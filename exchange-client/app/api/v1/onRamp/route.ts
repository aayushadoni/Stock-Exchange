import Stripe from "stripe";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from "../../../../lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest, res: NextResponse) {
  
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  
  try {
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
            price: 'price_1PtE7YSCTStHeC5ZEiiSItwh',
            quantity: 1,
            adjustable_quantity: {
              enabled: true,
              minimum: 1000,
              maximum: 500000,
            },
        },
      ],
      metadata: {
        userId: userId,
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: 'http://localhost:3000',
        },
      },
    });

    return NextResponse.json({ url: paymentLink.url }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}