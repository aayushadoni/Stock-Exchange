import fs from "fs";
import { RedisManager } from "../RedisManager";
import { ORDER_UPDATE, TRADE_ADDED, BALANCE_UPDATE, ORDER_DELETE } from "../types/index";
import { CANCEL_ORDER, CREATE_ORDER, GET_DEPTH, GET_OPEN_ORDERS, MessageFromApi, ON_RAMP } from "../types/fromApi";
import { Fill, Order, Orderbook } from "./Orderbook";

export const BASE_CURRENCY = "INR";

interface UserBalance {
    [key: string]: {
        available: number;
        locked: number;
    }
}

export class Engine {
    private orderbooks: Orderbook[] = [];
    private balances: Map<string, UserBalance> = new Map();

    constructor() {
        let snapshot = null
        try {
            if (process.env.WITH_SNAPSHOT) {
                snapshot = fs.readFileSync("./snapshot.json");
            }
        } catch (e) {
            console.log("No snapshot found");
        }

        if (snapshot) {
            const snapshotSnapshot = JSON.parse(snapshot.toString());
            this.orderbooks = snapshotSnapshot.orderbooks.map((o: any) => new Orderbook(o.baseAsset, o.bids, o.asks, o.lastTradeId, o.currentPrice, o.lowPrice, o.highPrice, o.volume, o.priceChange, o.priceChangePercent, o.lastUpdateTime, o.price24hAgo));
            this.balances = new Map(snapshotSnapshot.balances);
        } else {
            const markets = ['TATA', 'RELIANCE', 'HDFC', 'NVIDIA', 'ICICI', 'AIRTEL', 'DELL', 'HCL', 'HP', 'TCS'];

            this.orderbooks = markets.map(
                (market) => new Orderbook(market, [], [], 0, 0, 0, 0, 0, 0, 0, 0, 0)
            );
            this.setBaseBalances();
        }
        setInterval(() => {
            this.saveSnapshot();
        }, 1000 * 3);
    }

    saveSnapshot() {
        const snapshotSnapshot = {
            orderbooks: this.orderbooks.map(o => o.getSnapshot()),
            balances: Array.from(this.balances.entries())
        }
        fs.writeFileSync("./snapshot.json", JSON.stringify(snapshotSnapshot));
    }

    process({ message, clientId }: {message: MessageFromApi, clientId: string}) {
        switch (message.type) {
            case CREATE_ORDER:
                try {
                    const { executedQty, fills, orderId } = this.createOrder(message.data.market, message.data.price, message.data.quantity, message.data.side, message.data.userId);
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_PLACED",
                        payload: {
                            orderId,
                            executedQty,
                            fills
                        }
                    });
                } catch (e) {
                    console.log(e);
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_CANCELLED",
                        payload: {
                            orderId: "",
                            executedQty: 0,
                            remainingQty: 0
                        }
                    });
                }
                break;
            case CANCEL_ORDER:
                try {
                    const orderId = message.data.orderId;
                    const cancelMarket = message.data.market;
                    const cancelOrderbook = this.orderbooks.find(o => o.ticker() === cancelMarket);
                    const quoteAsset = cancelMarket.split("_")[1];
                    if (!cancelOrderbook) {
                        throw new Error("No orderbook found");
                    }

                    const order = cancelOrderbook.asks.find(o => o.orderId === orderId) || cancelOrderbook.bids.find(o => o.orderId === orderId);
                    if (!order) {
                        console.log("No order found");
                        throw new Error("No order found");
                    }

                    if (order.side === "buy") {
                        const price = cancelOrderbook.cancelBid(order)
                        const leftQuantity = (order.quantity - order.filled) * order.price;
                        //@ts-ignore
                        this.balances.get(order.userId)[BASE_CURRENCY].available += leftQuantity;
                        //@ts-ignore
                        this.balances.get(order.userId)[BASE_CURRENCY].locked -= leftQuantity;
                        if (price) {
                            this.sendUpdatedDepthAt(price.toString(), cancelMarket);
                        }
                    } else {
                        const price = cancelOrderbook.cancelAsk(order)
                        const leftQuantity = order.quantity - order.filled;
                        //@ts-ignore
                        this.balances.get(order.userId)[quoteAsset].available += leftQuantity;
                        //@ts-ignore
                        this.balances.get(order.userId)[quoteAsset].locked -= leftQuantity;
                        if (price) {
                            this.sendUpdatedDepthAt(price.toString(), cancelMarket);
                        }
                    }

                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_CANCELLED",
                        payload: {
                            orderId,
                            executedQty: 0,
                            remainingQty: 0
                        }
                    });
                    
                } catch (e) {
                    console.log("Error hwile cancelling order", );
                    console.log(e);
                }
                break;
            case GET_OPEN_ORDERS:
                try {
                    const openOrderbook = this.orderbooks.find(o => o.ticker() === message.data.market);
                    if (!openOrderbook) {
                        throw new Error("No orderbook found");
                    }
                    const openOrders = openOrderbook.getOpenOrders(message.data.userId);

                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "OPEN_ORDERS",
                        payload: openOrders
                    }); 
                } catch(e) {
                    console.log(e);
                }
                break;
            case ON_RAMP:
                const userId = message.data.userId;
                const amount = Number(message.data.amount);
                this.onRamp(userId, amount);
                this.pushBalanceUpdate(userId, BASE_CURRENCY);
                break;
            case GET_DEPTH:
                try {
                    const market = message.data.market;
                    const orderbook = this.orderbooks.find(o => o.ticker() === market);
                    if (!orderbook) {
                        throw new Error("No orderbook found");
                    }
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "DEPTH",
                        payload: orderbook.getDepth()
                    });
                } catch (e) {
                    console.log(e);
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "DEPTH",
                        payload: {
                            bids: [],
                            asks: []
                        }
                    });
                }
                break;
        }
    }

    addOrderbook(orderbook: Orderbook) {
        this.orderbooks.push(orderbook);
    }

    createOrder(market: string, price: string, quantity: string, side: "buy" | "sell", userId: string) {

        const orderbook = this.orderbooks.find(o => o.ticker() === market)
        const baseAsset = market.split("_")[0];
        const quoteAsset = market.split("_")[1];

        if (!orderbook) {
            throw new Error("No orderbook found");
        }

        this.checkAndLockFunds(baseAsset, quoteAsset, side, userId, quoteAsset, price, quantity);

        const order: Order = {
            price: Number(price),
            quantity: Number(quantity),
            orderId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            filled: 0,
            side,
            userId
        }
        
        const { fills, executedQty } = orderbook.addOrder(order);
        this.updateBalance(userId, baseAsset, quoteAsset, side, fills, executedQty);

        this.createDbTrades(fills, market, userId);
        this.updateDbOrders(order, executedQty, fills, market);
        this.publisWsDepthUpdates(fills, price, side, market);
        this.publishWsTrades(fills, userId, market);
        this.publishWsTicker(market);
        return { executedQty, fills, orderId: order.orderId };
    }

    updateDbOrders(order: Order, executedQty: number, fills: Fill[], market: string) {
        RedisManager.getInstance().pushMessage({
            type: ORDER_UPDATE,
            data: {
                orderId: order.orderId,
                executedQty: executedQty,
                market: market,
                price: order.price.toString(),
                quantity: order.quantity.toString(),
                side: order.side,
            }
        });
    }

    createDbTrades(fills: Fill[], market: string, userId: string) {
        fills.forEach(fill => {
            RedisManager.getInstance().pushMessage({
                type: TRADE_ADDED,
                data: {
                    market: market,
                    id: fill.tradeId.toString(),
                    isBuyerMaker: fill.otherUserId !== userId,
                    price: fill.price,
                    quantity: fill.qty.toString(),
                    quoteQuantity: (fill.qty * Number(fill.price)).toString(),
                    timestamp: Date.now()
                }
            });
        });
    }

    publishWsTrades(fills: Fill[], userId: string, market: string) {
        fills.forEach(fill => {
            RedisManager.getInstance().publishMessage(`trade.${market}`, {
                stream: `trade.${market}`,
                data: {
                    e: "trade",
                    i: fill.tradeId,
                    t: this.getTime(),
                    m: fill.otherUserId !== userId,
                    p: fill.price,
                    q: fill.qty.toString(),
                    s: market,
                }
            });
        });
    }

    publishWsTicker(market: string) {
        const orderbook = this.orderbooks.find(o => o.ticker() === market);
        if (!orderbook) return;

        RedisManager.getInstance().publishMessage(`ticker.${market}`, {
            stream: `ticker.${market}`,
            data: {
                c: orderbook.currentPrice.toString(),
                h: orderbook.highPrice.toString(),
                l: orderbook.lowPrice.toString(),
                v: orderbook.volume.toString(),
                p: orderbook.priceChangePercent.toString(),
                x: orderbook.priceChange.toString(),
                s: market,
                id: Date.now(),
                e: "ticker"
            }
        });
    }

    sendUpdatedDepthAt(price: string, market: string) {
        const orderbook = this.orderbooks.find(o => o.ticker() === market);
        if (!orderbook) {
            return;
        }
        const depth = orderbook.getDepth();
        const updatedBids = depth?.bids.filter(x => x[0] === price);
        const updatedAsks = depth?.asks.filter(x => x[0] === price);
        
        RedisManager.getInstance().publishMessage(`depth.${market}`, {
            stream: `depth.${market}`,
            data: {
                a: updatedAsks.length ? updatedAsks : [[price, "0"]],
                b: updatedBids.length ? updatedBids : [[price, "0"]],
                e: "depth"
            }
        });
    }

    publisWsDepthUpdates(fills: Fill[], price: string, side: "buy" | "sell", market: string) {
        const orderbook = this.orderbooks.find(o => o.ticker() === market);
        if (!orderbook) {
            return;
        }
        const depth = orderbook.getDepth();
        if (side === "buy") {
            const updatedAsks = depth?.asks.filter(x => fills.map(f => f.price).includes(x[0].toString()));
            const updatedBid = depth?.bids.find(x => x[0] === price);
            console.log("publish ws depth updates")
            RedisManager.getInstance().publishMessage(`depth.${market}`, {
                stream: `depth.${market}`,
                data: {
                    a: updatedAsks,
                    b: updatedBid ? [updatedBid] : [],
                    e: "depth"
                }
            });
        }
        if (side === "sell") {
           const updatedBids = depth?.bids.filter(x => fills.map(f => f.price).includes(x[0].toString()));
           const updatedAsk = depth?.asks.find(x => x[0] === price);
           console.log("publish ws depth updates")
           RedisManager.getInstance().publishMessage(`depth.${market}`, {
               stream: `depth.${market}`,
               data: {
                   a: updatedAsk ? [updatedAsk] : [],
                   b: updatedBids,
                   e: "depth"
               }
           });
        }
    }

    updateBalance(userId: string, baseAsset: string, quoteAsset: string, side: "buy" | "sell", fills: Fill[], executedQty: number) {
        if (side === "buy") {
            fills.forEach(fill => {
                // Update quote asset balance
                //@ts-ignore
                this.balances.get(fill.otherUserId)[quoteAsset].available = this.balances.get(fill.otherUserId)?.[quoteAsset].available + (fill.qty * fill.price);

                //@ts-ignore
                this.balances.get(userId)[quoteAsset].locked = this.balances.get(userId)?.[quoteAsset].locked - (fill.qty * fill.price);

                // Update base asset balance

                //@ts-ignore
                this.balances.get(fill.otherUserId)[baseAsset].locked = this.balances.get(fill.otherUserId)?.[baseAsset].locked - fill.qty;

                //@ts-ignore
                this.balances.get(userId)[baseAsset].available = this.balances.get(userId)?.[baseAsset].available + fill.qty;

                // Send balance update to Redis
                this.pushBalanceUpdate(fill.otherUserId, baseAsset);
                this.pushBalanceUpdate(fill.otherUserId, quoteAsset);
                this.pushBalanceUpdate(userId, baseAsset);
                this.pushBalanceUpdate(userId, quoteAsset);

            });
            
        } else {
            fills.forEach(fill => {
                // Update quote asset balance
                //@ts-ignore
                this.balances.get(fill.otherUserId)[quoteAsset].locked = this.balances.get(fill.otherUserId)?.[quoteAsset].locked - (fill.qty * fill.price);

                //@ts-ignore
                this.balances.get(userId)[quoteAsset].available = this.balances.get(userId)?.[quoteAsset].available + (fill.qty * fill.price);

                // Update base asset balance

                //@ts-ignore
                this.balances.get(fill.otherUserId)[baseAsset].available = this.balances.get(fill.otherUserId)?.[baseAsset].available + fill.qty;

                //@ts-ignore
                this.balances.get(userId)[baseAsset].locked = this.balances.get(userId)?.[baseAsset].locked - (fill.qty);

                // Send balance update to Redis
                this.pushBalanceUpdate(fill.otherUserId, baseAsset);
                this.pushBalanceUpdate(fill.otherUserId, quoteAsset);
                this.pushBalanceUpdate(userId, baseAsset);
                this.pushBalanceUpdate(userId, quoteAsset);

            });
        }
    }

    checkAndLockFunds(baseAsset: string, quoteAsset: string, side: "buy" | "sell", userId: string, asset: string, price: string, quantity: string) {
        if (side === "buy") {
            if ((this.balances.get(userId)?.[quoteAsset]?.available || 0) < Number(quantity) * Number(price)) {
                throw new Error("Insufficient funds");
            }
            //@ts-ignore
            this.balances.get(userId)[quoteAsset].available = this.balances.get(userId)?.[quoteAsset].available - (Number(quantity) * Number(price));
            
            //@ts-ignore
            this.balances.get(userId)[quoteAsset].locked = this.balances.get(userId)?.[quoteAsset].locked + (Number(quantity) * Number(price));
        } else {
            if ((this.balances.get(userId)?.[baseAsset]?.available || 0) < Number(quantity)) {
                throw new Error("Insufficient funds");
            }
            //@ts-ignore
            this.balances.get(userId)[baseAsset].available = this.balances.get(userId)?.[baseAsset].available - (Number(quantity));
            
            //@ts-ignore
            this.balances.get(userId)[baseAsset].locked = this.balances.get(userId)?.[baseAsset].locked + Number(quantity);
        }
    }

    onRamp(userId: string, amount: number) {
        const userBalance = this.balances.get(userId);
        if (!userBalance) {
            this.balances.set(userId, {
                [BASE_CURRENCY]: {
                    available: amount,
                    locked: 0
                }
            });
        } else {
            userBalance[BASE_CURRENCY].available += amount;
        }
    }

    pushBalanceUpdate(userId: string, asset: string) {
        const userBalance = this.balances.get(userId);
        if (!userBalance) return;
    
        const balanceUpdate = {
            userId: userId,
            asset: asset,
            available: userBalance[asset].available,
            locked: userBalance[asset].locked
        };
    
        RedisManager.getInstance().pushMessage({
            type: BALANCE_UPDATE,
            data: balanceUpdate
        });
    }

    pushOrderDelete(orderId: string) {
        const orderDelete = {
            orderId: orderId
        };
    
        RedisManager.getInstance().pushMessage({
            type: ORDER_DELETE,
            data: orderDelete
        });
    }

    setBaseBalances() {
        const markets = ['TATA', 'RELIANCE', 'HDFC', 'NVIDIA', 'ICICI', 'AIRTEL', 'DELL', 'HCL', 'HP', 'TCS'];
        for (let i = 1; i <= 200; i++) {
            const balance: UserBalance = {
                [BASE_CURRENCY]: {
                    available: 10000,
                    locked: 0
                }
            };
            
            for (const market of markets) {
                balance[market] = {
                    available: 1000,
                    locked: 0
                };
            }
            
            this.balances.set(`${i}`, balance);
        }
    }

    padToTwoDigits(num:any) { return num.toString().padStart(2, '0');}
    getTime() { 
        const now = new Date();
        return `${this.padToTwoDigits(now.getHours())}:${this.padToTwoDigits(now.getMinutes())}:${this.padToTwoDigits(now.getSeconds())}`;
     }
}