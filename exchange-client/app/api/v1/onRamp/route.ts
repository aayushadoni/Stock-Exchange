import Stripe from "stripe";
import { NextResponse, NextRequest } from "next/server";
import { RedisManager } from "../../../../lib/RedisManager";
import { ON_RAMP } from "../../../../types";
import { getServerSession } from 'next-auth';
import { authOptions } from "../../../../lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {

  const session = await getServerSession(authOptions);

  const payload = await req.text();
  const res = JSON.parse(payload);

  const sig = req.headers.get("Stripe-Signature");

  try {
    let event = stripe.webhooks.constructEvent(
      payload,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const amountReceived = paymentIntent.amount_received;
        const txnId = paymentIntent.id
        const response = await RedisManager.getInstance().sendAndAwait({
            type: ON_RAMP,
            data: {
                amount: `&${amountReceived}`,
                userId: session.user.id,
                txnId: txnId
            }
          });
        
    }

    return NextResponse.json({ status: "sucess", event: event.type, response: res });
  } catch (error) {
    return NextResponse.json({ status: "Failed", error });
  }
}