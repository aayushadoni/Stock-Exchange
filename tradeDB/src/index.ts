import { Client } from 'pg';
import { createClient } from 'redis';  
import { DbMessage } from './types';
import dotenv from 'dotenv';

dotenv.config();

const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
});
pgClient.connect();

async function main() {
    const redisClient = createClient({
        socket: {
            host: process.env.REDIS_HOST,
            port: 19859
        }
    });
    await redisClient.connect();
    console.log("connected to redis");

    while (true) {
        const response = await redisClient.rPop("db_processor" as string)
        if (!response) {

        }  else {
            const data: DbMessage = JSON.parse(response);
            if (data.type === "TRADE_ADDED") {
                console.log("adding data");
                console.log(data);
                const price = data.data.price;
                const timestamp = new Date(data.data.timestamp);
                const quantity = data.data.quantity
                const query = `INSERT INTO ${data.data.market} (time, price, volume, currency_code) VALUES ($1, $2, $3, $4)`;
                const values = [timestamp, price, quantity, 'INR'];
                await pgClient.query(query, values);
            } else if (data.type === "BALANCE_UPDATE") {
                console.log("updating balance data");
                console.log(data);
                const { userId, asset, available, locked } = data.data;
                const query = `
                    INSERT INTO balances (userId, asset, available, locked, updatedAt)
                    VALUES ($1, $2, $3, $4, NOW())
                    ON CONFLICT (userId, asset)
                    DO UPDATE SET available = EXCLUDED.available, locked = EXCLUDED.locked, updatedAt = EXCLUDED.updatedAt
                `;
                const values = [userId, asset, available, locked];
                await pgClient.query(query, values);
            } else if (data.type === "ORDER_UPDATE") {
                console.log("updating order data");
                console.log(data);
                const { orderId, executedQty, market, price, quantity, side } = data.data;
    
                const query = `
                    INSERT INTO orders (orderId, executedQty, market, price, quantity, side, updatedAt)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW())
                    ON CONFLICT (orderId)
                    DO UPDATE SET executedQty = EXCLUDED.executedQty, market = EXCLUDED.market, price = EXCLUDED.price,
                                  quantity = EXCLUDED.quantity, side = EXCLUDED.side, updatedAt = EXCLUDED.updatedAt
                `;
                const values = [orderId, executedQty, market, price, quantity, side];
                await pgClient.query(query, values);
            } else if (data.type === "ORDER_DELETE") {
                console.log("deleting order data");
                console.log(data);
                const { orderId } = data.data;
                const query = `
                    DELETE FROM orders
                    WHERE orderId = $1
                `;
                const values = [orderId];
                await pgClient.query(query, values);
            }
        } 
    }

}

main();