import { NextRequest, NextResponse } from 'next/server';
import { RedisManager } from '../../../../lib/RedisManager';
import { CREATE_ORDER, CANCEL_ORDER, GET_OPEN_ORDERS } from '../../../../types';
import { SQLService } from '../../../../lib/sqlService';

export async function POST(req: NextRequest) {
    
    try {
        const body = await req.json();
        const { market, price, quantity, side, userId } = body;
        console.log('Request body:', body);

        if (!market || !price || !quantity || !side || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const response = await RedisManager.getInstance().sendAndAwait({
            type: CREATE_ORDER,
            data: {
                market,
                price,
                quantity,
                side,
                userId
            }
        });

        if ('orderId' in response.payload) {
            const orderId = response.payload.orderId;
            console.log(orderId);

            const sqlService = SQLService.getInstance(process.env.DATABASE_URL!);
            await sqlService.addOrderIdToUser(userId, orderId);

            return NextResponse.json(response.payload);
        } else {
            return NextResponse.json({ error: 'Invalid response payload' }, { status: 500 });
        }

    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {

    try {
        const body = await req.json(); // Parse the JSON body
        const { orderId, market } = body;

        if (!orderId || !market) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const response = await RedisManager.getInstance().sendAndAwait({
            type: CANCEL_ORDER,
            data: {
                orderId,
                market
            }
        });

        return NextResponse.json(response.payload);
    } catch (error) {
        console.error('Error canceling order:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// GET handler
export async function GET(req: NextRequest) {
    
    try {
        const { searchParams } = new URL(req.url);
        const market = searchParams.get('market');
        const userId = searchParams.get('userId');

        if (!market) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const response = await RedisManager.getInstance().sendAndAwait({
            type: GET_OPEN_ORDERS,
            data: {
                userId:userId!,
                market
            }
        });
        console.log(response.payload)
        return NextResponse.json(response.payload);
    } catch (error) {
        console.error('Error fetching open orders:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
