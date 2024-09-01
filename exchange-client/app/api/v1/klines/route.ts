import { Client } from 'pg';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "../../../../lib/auth";

const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
});

pgClient.connect();

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const { searchParams } = new URL(req.url);
        const market = searchParams.get('market');
        const interval = searchParams.get('interval');
        const startTime = searchParams.get('startTime');
        const endTime = searchParams.get('endTime');

        if (!market || !interval || !startTime || !endTime) {
            return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 });
        }

        let query: string;
        switch (interval) {
            case '1m':
                query = `SELECT * FROM ${market}_klines_1m WHERE bucket >= $1 AND bucket <= $2`;
                break;
            case '1h':
                query = `SELECT * FROM ${market}_klines_1h WHERE bucket >= $1 AND bucket <= $2`;
                break;
            case '1w':
                query = `SELECT * FROM ${market}_klines_1w WHERE bucket >= $1 AND bucket <= $2`;
                break;
            default:
                return NextResponse.json({ error: 'Invalid interval' }, { status: 400 });
        }

        const startTimeDate = new Date(parseInt(startTime) * 1000);
        const endTimeDate = new Date(parseInt(endTime) * 1000);

        const result = await pgClient.query(query, [startTimeDate, endTimeDate]);

        return NextResponse.json(result.rows.map(row => ({
            close: row.close,
            end: row.bucket,
            high: row.high,
            low: row.low,
            open: row.open,
            quoteVolume: row.quoteVolume,
            start: row.start,
            trades: row.trades,
            volume: row.volume,
        })));
    } catch (error) {
        console.error('Error fetching kline data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
