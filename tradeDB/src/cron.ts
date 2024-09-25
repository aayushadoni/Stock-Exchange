import { Client } from 'pg'; 
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

const pricesTable = ['TATA_INR', 'NVIDIA_INR', 'RELIANCE_INR', 'ICICI_INR', 'HDFC_INR', 'AIRTEL_INR', 'DELL_INR', 'HCL_INR', 'HP_INR', 'TCS_INR'];

async function refreshViews() {
    try {
        await client.connect();
        await Promise.all(
            pricesTable.map(async (table) => {
                await client.query(`REFRESH MATERIALIZED VIEW ${table}_klines_1m`);
                await client.query(`REFRESH MATERIALIZED VIEW ${table}_klines_1h`);
                await client.query(`REFRESH MATERIALIZED VIEW ${table}_klines_1w`);
            })
        );
    } catch (error) {
        console.error('Error refreshing views:', error);
    } finally {
        await client.end();
    }
}

refreshViews();

setInterval(() => {
    refreshViews()
}, 1000 * 10 );