import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(req: Request) {
  try {
    await connectDB()
    const { email } = await req.json()

    const user = await User.findOne({ email })

    if (!user) {
      return NextResponse.json({ exists: false })
    }

    return NextResponse.json({
      exists: true,
      isVerified: user.isVerified,
      authProvider: user.authProvider,
      hasGoogleId: !!user.googleId
    })
  } catch (error) {
    console.error('Check User Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}