import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "../../../../lib/auth";
import { startMarketSimulation } from '@/lib/marketSimulation';

let simulationTimers: Record<string, NodeJS.Timeout | null> = {};

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { market, query } = body;
        const userId = session.user.id;

        if (query === 'start') {
            if (simulationTimers[market]) {
                return NextResponse.json({ error: 'Simulation already running' }, { status: 400 });
            }

            startMarketSimulation(market, 5 * 60 * 1000);

            simulationTimers[market] = setTimeout(() => {
                delete simulationTimers[market];
            }, 5 * 60 * 1000);

            return NextResponse.json({ message: 'Simulation started' });
        } else if (query === 'stop') {
            if (!simulationTimers[market]) {
                return NextResponse.json({ error: 'No running simulation for this market' }, { status: 400 });
            }

            clearTimeout(simulationTimers[market]!);
            delete simulationTimers[market];

            return NextResponse.json({ message: 'Simulation stopped' });
        } else {
            return NextResponse.json({ error: 'Invalid query parameter' }, { status: 400 });
        }

    } catch (error) {
        console.error('Error handling request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}