import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-05-28.basil',
})

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ invoices: [] }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ invoices: [] })
    }

    const invoices = await stripe.invoices.list({
      customer: profile.stripe_customer_id,
      limit: 24,
    })

    const formatted = invoices.data.map(inv => ({
      id: inv.id,
      date: new Date(inv.created * 1000).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }),
      amount: `€${((inv.amount_paid || 0) / 100).toFixed(2)}`,
      status: inv.status,
      description: inv.lines.data[0]?.description || 'Bloom Premium',
      pdf: inv.invoice_pdf,
    }))

    return NextResponse.json({ invoices: formatted })
  } catch (error: any) {
    console.error('Invoices error:', error)
    return NextResponse.json({ invoices: [] })
  }
}
