import { Pool } from "pg";

export class SQLService {
    private static instance: SQLService;
    private pool: Pool;

    // Private constructor to prevent direct instantiation
    private constructor(postgresUri: string) {
        this.pool = new Pool({
            connectionString: postgresUri,
        });
    }

    // Static method to get the single instance of the class
    public static getInstance(postgresUri: string): SQLService {
        if (!SQLService.instance) {
            SQLService.instance = new SQLService(postgresUri);
        }
        return SQLService.instance;
    }

    // Create a new user
    async createUser(email: string, password: string) {
        const query = `
            INSERT INTO users (email, password)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const values = [email, password];
        const { rows } = await this.pool.query(query, values);
        return rows[0];
    }

    // Get user by email
    async getUserByEmail(email: string) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const values = [email];
        const { rows } = await this.pool.query(query, values);
        return rows[0];
    }

    // Get user balances by user ID
    async getBalancesByUserId(userId: string) {
        const query = 'SELECT * FROM balances WHERE userId = $1';
        const values = [userId];
        const { rows } = await this.pool.query(query, values);
        return rows;
    }

    // Get user orders by user ID
    async getOrdersByUserId(userId: string) {
        const query = `
            SELECT o.*
            FROM orders o
            JOIN unnest((SELECT orderIds FROM users WHERE id = $1)) as orderIdList(orderId)
            ON o.orderId = orderIdList.orderId;
        `;
        const values = [userId];
        const { rows } = await this.pool.query(query, values);
        return rows;
    }

     // Method to add an orderId to a user
     async addOrderIdToUser(userId: string, orderId: string) {
        const query = `
            UPDATE users
            SET orderIds = array_append(orderIds, $1)
            WHERE id = $2;
        `;
        const values = [orderId, userId];
        try {
            await this.pool.query(query, values);
        } catch (error) {
            console.error('Error updating user with orderId:', error);
            throw new Error('Failed to update user with new orderId');
        }
    }


    // Close the connection pool
    async closeConnection() {
        await this.pool.end();
    }
}
