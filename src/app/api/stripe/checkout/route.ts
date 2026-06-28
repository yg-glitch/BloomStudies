import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-06-24.dahlia',
})

export async function POST(req: NextRequest) {
  try {
    const { priceId, customerEmail, couponCode, referralCode } = await req.json()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId || process.env.STRIPE_PREMIUM_PRICE_ID || 'price_placeholder',
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard/settings?tab=billing&success=true`,
      cancel_url: `${appUrl}/dashboard/settings?tab=billing&cancelled=true`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          referralCode: referralCode || '',
        },
      },
    }

    if (customerEmail) {
      sessionParams.customer_email = customerEmail
    }

    if (couponCode) {
      // Validate coupon exists before applying
      try {
        const promotionCodes = await stripe.promotionCodes.list({ code: couponCode, active: true })
        if (promotionCodes.data.length > 0) {
          sessionParams.discounts = [{ promotion_code: promotionCodes.data[0].id }]
        }
      } catch {
        // Invalid coupon — proceed without it
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
