import { NextRequest, NextResponse } from 'next/server';
import { SQLService } from '../../../../lib/sqlService';
import { getServerSession } from 'next-auth';
import { authOptions } from "../../../../lib/auth";
// GET handler
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {

        const sqlService = SQLService.getInstance(process.env.DATABASE_URL!);
        const response = await sqlService.getOrdersByUserId(session.user.id);

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching open orders:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}