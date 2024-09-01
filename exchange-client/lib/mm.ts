import axios from "axios";

const BASE_URL = "http://localhost:3000";
const TOTAL_BIDS = 15;
const TOTAL_ASKS = 15;
const MARKET = "TATA_INR";
const USER_COUNT = 200;

async function main() {
    const price = 1000 + Math.random() * 10;
    const userId = getRandomUserId();
    const openOrders = await axios.get(`${BASE_URL}/api/v1/order?userId=${userId}&market=${MARKET}`);

    const totalBids = openOrders.data.filter((o: any) => o.side === "buy").length;
    const totalAsks = openOrders.data.filter((o: any) => o.side === "sell").length;

    const cancelledBids = await cancelBidsMoreThan(openOrders.data, price, userId);
    const cancelledAsks = await cancelAsksLessThan(openOrders.data, price, userId);

    let bidsToAdd = TOTAL_BIDS - totalBids - cancelledBids;
    let asksToAdd = TOTAL_ASKS - totalAsks - cancelledAsks;

    while (bidsToAdd > 0 || asksToAdd > 0) {
        const currentUserId = getRandomUserId();
        const randomQuantity = getRandomQuantity();
        
        if (bidsToAdd > 0) {
            await axios.post(`${BASE_URL}/api/v1/order`, {
                market: MARKET,
                price: (price - Math.random() * 1).toFixed(1).toString(),
                quantity: randomQuantity.toString(),
                side: "buy",
                userId: `${currentUserId}`
            });
            bidsToAdd--;
        }
        if (asksToAdd > 0) {
            await axios.post(`${BASE_URL}/api/v1/order`, {
                market: MARKET,
                price: (price + Math.random() * 1).toFixed(1).toString(),
                quantity: randomQuantity.toString(),
                side: "sell",
                userId: `${currentUserId}`
            });
            asksToAdd--;
        }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    main();
}

function getRandomUserId() {
    return Math.floor(Math.random() * USER_COUNT) + 1;
}

function getRandomQuantity() {
    return Math.floor(Math.random() * 50) + 1;
}

async function cancelBidsMoreThan(openOrders: any, price: any, userId: any) {
    let promises: any = [];
    openOrders.forEach((o: any) => {
        if (o.side === "buy" && (o.price > price || Math.random() < 0.1)) {
            promises.push(
                axios.delete(`${BASE_URL}/api/v1/order`, {
                    data: {
                        orderId: o.orderId,
                        market: MARKET,
                    }
                })
            );
        }
    });
    await Promise.all(promises);
    return promises.length;
}

async function cancelAsksLessThan(openOrders: any, price: any, userId: any) {
    let promises: any = [];
    openOrders.forEach((o: any) => {
        if (o.side === "sell" && (o.price < price || Math.random() < 0.5)) {
            promises.push(
                axios.delete(`${BASE_URL}/api/v1/order`, {
                    data: {
                        orderId: o.orderId,
                        market: MARKET,
                    }
                })
            );
        }
    });

    await Promise.all(promises);
    return promises.length;
}

main();
