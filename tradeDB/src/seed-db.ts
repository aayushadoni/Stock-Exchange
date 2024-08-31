import { Client } from 'pg'; 
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});
client.connect();

async function initializeDB() {
    const pricesTable = ['TATA_INR', 'NVIDIA_INR', 'RELIANCE_INR', 'ICICI_INR', 'HDFC_INR', 'AIRTEL_INR', 'DELL_INR', 'HCL_INR', 'HP_INR', 'TCS_INR'];
    
    await client.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            orderIds VARCHAR(255)[] DEFAULT ARRAY[]::VARCHAR[],
            createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS balances (
            id SERIAL PRIMARY KEY,
            userId INT REFERENCES users(id) ON DELETE CASCADE,
            asset VARCHAR(50) NOT NULL,
            available DOUBLE PRECISION NOT NULL,
            locked DOUBLE PRECISION NOT NULL,
            updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (userId, asset)
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS orders (
            orderId VARCHAR(255) PRIMARY KEY,
            market VARCHAR(50),
            price DOUBLE PRECISION,
            quantity DOUBLE PRECISION,
            side VARCHAR(10),
            executedQty DOUBLE PRECISION DEFAULT 0,
            updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    for (const table of pricesTable) {
        await client.query(`
            DROP TABLE IF EXISTS ${table};
            CREATE TABLE ${table}(
                time TIMESTAMP WITH TIME ZONE NOT NULL,
                price DOUBLE PRECISION,
                volume DOUBLE PRECISION,
                currency_code VARCHAR (10)
            );
            
            SELECT create_hypertable('${table}', 'time', 'price', 2);
        `);

        await client.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS ${table}_klines_1m AS
            SELECT
                time_bucket('1 minute', time) AS bucket,
                first(price, time) AS open,
                max(price) AS high,
                min(price) AS low,
                last(price, time) AS close,
                sum(volume) AS volume,
                currency_code
            FROM ${table}
            GROUP BY bucket, currency_code;
        `);

        await client.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS ${table}_klines_1h AS
            SELECT
                time_bucket('1 hour', time) AS bucket,
                first(price, time) AS open,
                max(price) AS high,
                min(price) AS low,
                last(price, time) AS close,
                sum(volume) AS volume,
                currency_code
            FROM ${table}
            GROUP BY bucket, currency_code;
        `);

        await client.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS ${table}_klines_1w AS
            SELECT
                time_bucket('1 week', time) AS bucket,
                first(price, time) AS open,
                max(price) AS high,
                min(price) AS low,
                last(price, time) AS close,
                sum(volume) AS volume,
                currency_code
            FROM ${table}
            GROUP BY bucket, currency_code;
        `);
    }

    await client.end();
    console.log("Database initialized successfully");
}

initializeDB().catch(console.error);
