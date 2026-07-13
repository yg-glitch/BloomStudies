import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-06-24.dahlia',
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    // Webhook signature verification failed - log for debugging
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        if (!customerId) break

        // Find user by customer email or existing customer ID
        let userId: string | null = null

        const { data: existingSubscription } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (existingSubscription) {
          userId = existingSubscription.user_id
        } else if (session.customer_email) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', session.customer_email)
            .single()
          userId = profile?.id || null
        }

        if (userId) {
          // Update profiles table
          await supabase.from('profiles').update({ plan: 'premium', stripe_customer_id: customerId }).eq('id', userId)

          // Upsert subscription record
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan: 'premium',
            status: 'active',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (sub) {
          const isActive = ['active', 'trialing'].includes(subscription.status)
          await supabase.from('subscriptions').update({
            stripe_subscription_id: subscription.id,
            plan: isActive ? 'premium' : 'free',
            status: subscription.status,
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          }).eq('user_id', sub.user_id)

          await supabase.from('profiles').update({
            plan: isActive ? 'premium' : 'free'
          }).eq('id', sub.user_id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (sub) {
          await supabase.from('subscriptions').update({
            plan: 'free',
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          }).eq('user_id', sub.user_id)

          await supabase.from('profiles').update({ plan: 'free' }).eq('id', sub.user_id)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        // Payment succeeded - subscription is active
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Mark subscription as past_due
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (sub) {
          await supabase.from('subscriptions').update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          }).eq('user_id', sub.user_id)
        }
        break
      }

      default:
        // Unhandled Stripe event type
        break
    }
  } catch (err: any) {
    // Webhook processing error - log for debugging
    console.error('Webhook processing error:', err)
    // Return 200 to prevent Stripe from retrying for logic errors
    // Only return 4xx/5xx for signature/parsing issues
  }

  return NextResponse.json({ received: true })
}
