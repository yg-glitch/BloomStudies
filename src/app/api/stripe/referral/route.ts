import { NextRequest, NextResponse } from 'next/server'

// Generate a referral code for a user
function generateReferralCode(userId: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'BLOOM-'
  // Use userId as seed for consistency
  const seed = userId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  for (let i = 0; i < 6; i++) {
    code += chars[(seed * (i + 1) * 7919) % chars.length]
  }
  return code
}

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json()
    const referralCode = generateReferralCode(userId || email || Date.now().toString())

    // In production: store in Supabase and track referrals
    return NextResponse.json({
      referralCode,
      referralUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?ref=${referralCode}`,
      reward: '1 month free for you and your friend',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 })

  // In production: look up in Supabase
  return NextResponse.json({
    valid: code.startsWith('BLOOM-'),
    discount: '1 month free',
    code,
  })
}
