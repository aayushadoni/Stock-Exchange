// marketSimulation.ts
import axios from 'axios';

const BASE_URL = "http://localhost:3000";
const TOTAL_BIDS = 15;
const TOTAL_ASKS = 15;
const USER_COUNT = 200;

export async function startMarketSimulation(market: string, duration: number) {
    const price = 1000 + Math.random() * 10;
    const simulationInterval = setInterval(async () => {
        const userId = getRandomUserId();
        const openOrders = await axios.get(`${BASE_URL}/api/v1/marketMaker?userId=${userId}&market=${market}`);
        
        const totalBids = openOrders.data.filter((o: any) => o.side === "buy").length;
        const totalAsks = openOrders.data.filter((o: any) => o.side === "sell").length;
        
        const cancelledBids = await cancelOrders(openOrders.data, price, "buy", market);
        const cancelledAsks = await cancelOrders(openOrders.data, price, "sell", market);
        
        let bidsToAdd = TOTAL_BIDS - totalBids - cancelledBids;
        let asksToAdd = TOTAL_ASKS - totalAsks - cancelledAsks;
        
        while (bidsToAdd > 0 || asksToAdd > 0) {
            const currentUserId = getRandomUserId();
            const randomQuantity = getRandomQuantity();
            
            if (bidsToAdd > 0) {
                await axios.post(`${BASE_URL}/api/v1/marketMaker`, {
                    market,
                    price: (price - Math.random() * 1).toFixed(1).toString(),
                    quantity: randomQuantity.toString(),
                    side: "buy",
                    userId: `${currentUserId}`
                });
                bidsToAdd--;
            }
            if (asksToAdd > 0) {
                await axios.post(`${BASE_URL}/api/v1/marketMaker`, {
                    market,
                    price: (price + Math.random() * 1).toFixed(1).toString(),
                    quantity: randomQuantity.toString(),
                    side: "sell",
                    userId: `${currentUserId}`
                });
                asksToAdd--;
            }
        }
    }, 1000);

    // Stop the simulation after the given duration
    setTimeout(() => {
        clearInterval(simulationInterval);
    }, duration);
}

function getRandomUserId() {
    return Math.floor(Math.random() * USER_COUNT) + 1;
}

function getRandomQuantity() {
    return Math.floor(Math.random() * 50) + 1;
}

async function cancelOrders(openOrders: any, price: any, side: "buy" | "sell", market: string) {
    const condition = side === "buy" ? (o: any) => o.price > price || Math.random() < 0.1 
                                        : (o: any) => o.price < price || Math.random() < 0.5;
    const ordersToCancel = openOrders.filter((o: any) => o.side === side && condition(o));
    const promises = ordersToCancel.map((o: any) => axios.delete(`${BASE_URL}/api/v1/order`, {
        data: {
            orderId: o.orderId,
            market,
        }
    }));
    await Promise.all(promises);
    return promises.length;
}
