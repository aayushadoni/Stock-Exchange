import { RedisManager } from "../../../../lib/RedisManager";
import { GET_DEPTH } from "../../../../types";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "../../../../lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Missing symbol parameter' }, { status: 400 });
    }

    const response = await RedisManager.getInstance().sendAndAwait({
      type: GET_DEPTH,
      data: {
        market: symbol
      }
    });

    return NextResponse.json(response.payload);
  } catch (error) {
    console.error('Error Getting Depth Data:', error);
    return NextResponse.json({ error: 'Error Getting Depth Data' }, { status: 500 });
  }
}
