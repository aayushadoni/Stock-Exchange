import { BASE_CURRENCY } from "./Engine";

export interface Order {
    price: number;
    quantity: number;
    orderId: string;
    filled: number;
    side: "buy" | "sell";
    userId: string;
}

export interface Fill {
    price: string;
    qty: number;
    tradeId: number;
    otherUserId: string;
    markerOrderId: string;
}

export class Orderbook {
    bids: Order[] = [];
    asks: Order[] = [];
    baseAsset: string;
    quoteAsset: string = BASE_CURRENCY;
    lastTradeId: number;
    currentPrice: number;
    lowPrice: number;
    highPrice: number;
    price24hAgo: number
    priceChange :number;
    priceChangePercent: number;
    volume: number;
    lastUpdateTime: number;
    bidsObj: { [key: string]: number } = {};
    asksObj: { [key: string]: number } = {};

    constructor(baseAsset: string, bids: Order[], asks: Order[], lastTradeId: number, currentPrice: number, lowPrice: number, highPrice: number, volume: number, priceChange :number, priceChangePercent: number, lastUpdateTime: number, price24hAgo: number) {
        this.bids = bids;
        this.asks = asks;
        this.baseAsset = baseAsset;
        this.lastTradeId = lastTradeId || 0;
        this.currentPrice = currentPrice || 0;
        this.lowPrice = lowPrice || 0;
        this.highPrice = highPrice || 0;
        this.volume = volume || 0;
        this.price24hAgo = price24hAgo || 0;
        this.priceChange = priceChange || 0;
        this.priceChangePercent = priceChangePercent || 0;
        this.lastUpdateTime = lastUpdateTime || 0
        // Initialize depth tracking
        this.initializeDepth();
    }

    initializeDepth() {
        this.bids.forEach(order => {
            if (!this.bidsObj[order.price]) this.bidsObj[order.price] = 0;
            this.bidsObj[order.price] += order.quantity;
        });

        this.asks.forEach(order => {
            if (!this.asksObj[order.price]) this.asksObj[order.price] = 0;
            this.asksObj[order.price] += order.quantity;
        });
    }

    ticker() {
        return `${this.baseAsset}_${this.quoteAsset}`;
    }

    updatePriceAndVolume(fills: Fill[]) {
        const currentTime = Date.now();
        fills.forEach(fill => {
            const price = parseFloat(fill.price);
            const quantity = fill.qty;
            this.priceChange = price - this.currentPrice
            this.priceChangePercent = this.priceChange / this.currentPrice * 100
            this.currentPrice = price;

            if (price > this.highPrice) {
                this.highPrice = price;
            }

            if (this.lowPrice === 0 || price < this.lowPrice) {
                this.lowPrice = price;
            }

            this.volume += quantity;

            if (currentTime - this.lastUpdateTime >= 24 * 60 * 60 * 1000) {
                
                if (this.price24hAgo === 0) {
                    this.price24hAgo = price;
                } else {
                    
                    this.priceChange = Number((price - this.price24hAgo).toFixed(2));
                    this.priceChangePercent = Number(((this.priceChange / this.price24hAgo) * 100).toFixed(2));
                    
                    this.volume = 0;
                    this.price24hAgo = price;
                }
                this.lastUpdateTime = currentTime;
            }

        });
    }

    getSnapshot() {
        return {
            baseAsset: this.baseAsset,
            bids: this.bids,
            asks: this.asks,
            lastTradeId: this.lastTradeId,
            currentPrice: this.currentPrice
        }
    }

    addOrder(order: Order): { executedQty: number, fills: Fill[] } {
        if (order.side === "buy") {
            const { executedQty, fills } = this.matchBid(order);
            order.filled = executedQty;
            if (executedQty === order.quantity) {
                return { executedQty, fills };
            }
            this.bids.push(order);
            this.updateDepth(order, true);
            return { executedQty, fills };
        } else {
            const { executedQty, fills } = this.matchAsk(order);
            order.filled = executedQty;

            this.updatePriceAndVolume(fills);

            if (executedQty === order.quantity) {
                return { executedQty, fills };
            }
            this.asks.push(order);
            this.updateDepth(order, false);
            return { executedQty, fills };
        }
    }

    matchBid(order: Order): { fills: Fill[], executedQty: number } {
        const fills: Fill[] = [];
        let executedQty = 0;

        for (let i = 0; i < this.asks.length; i++) {
            if (this.asks[i].price <= order.price && executedQty < order.quantity) {
                if (this.asks[i].userId === order.userId) continue; // Skip self-trade

                const filledQty = Math.min(order.quantity - executedQty, this.asks[i].quantity);
                executedQty += filledQty;
                this.asks[i].filled += filledQty;

                fills.push({
                    price: this.asks[i].price.toString(),
                    qty: filledQty,
                    tradeId: this.lastTradeId++,
                    otherUserId: this.asks[i].userId,
                    markerOrderId: this.asks[i].orderId
                });
            }
        }

        this.removeFullyFilledOrders();
        return { fills, executedQty };
    }

    matchAsk(order: Order): { fills: Fill[], executedQty: number } {
        const fills: Fill[] = [];
        let executedQty = 0;

        for (let i = 0; i < this.bids.length; i++) {
            if (this.bids[i].price >= order.price && executedQty < order.quantity) {
                if (this.bids[i].userId === order.userId) continue; // Skip self-trade

                const filledQty = Math.min(order.quantity - executedQty, this.bids[i].quantity);
                executedQty += filledQty;
                this.bids[i].filled += filledQty;

                fills.push({
                    price: this.bids[i].price.toString(),
                    qty: filledQty,
                    tradeId: this.lastTradeId++,
                    otherUserId: this.bids[i].userId,
                    markerOrderId: this.bids[i].orderId
                });
            }
        }

        this.removeFullyFilledOrders();
        return { fills, executedQty };
    }

    updateDepth(order: Order, isBid: boolean) {
        const depthObj = isBid ? this.bidsObj : this.asksObj;
        if (!depthObj[order.price]) depthObj[order.price] = 0;
        depthObj[order.price] += order.quantity - order.filled;
    }

    removeFullyFilledOrders() {
        this.bids = this.bids.filter(order => order.quantity !== order.filled);
        this.asks = this.asks.filter(order => order.quantity !== order.filled);

        // Update depth after removing fully filled orders
        this.recalculateDepth();
    }

    recalculateDepth() {
        this.bidsObj = {};
        this.asksObj = {};
        this.initializeDepth();
    }

    getDepth() {
        const bids: [string, string][] = Object.entries(this.bidsObj).map(([price, quantity]) => [price, quantity.toString()]);
        const asks: [string, string][] = Object.entries(this.asksObj).map(([price, quantity]) => [price, quantity.toString()]);

        return { bids, asks };
    }

    getOpenOrders(userId: string): Order[] {
        const asks = this.asks.filter(x => x.userId === userId);
        const bids = this.bids.filter(x => x.userId === userId);
        return [...asks, ...bids];
    }

    cancelBid(order: Order) {
        const index = this.bids.findIndex(x => x.orderId === order.orderId);
        if (index !== -1) {
            const price = this.bids[index].price;
            this.bids.splice(index, 1);
            this.updateDepth(order, true);
            return price;
        }
    }

    cancelAsk(order: Order) {
        const index = this.asks.findIndex(x => x.orderId === order.orderId);
        if (index !== -1) {
            const price = this.asks[index].price;
            this.asks.splice(index, 1);
            this.updateDepth(order, false);
            return price;
        }
    }
}
