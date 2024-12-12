import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request: Request) {
  try {
    await connectDB()
    const { token } = await request.json()

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    })

    return NextResponse.json({ 
      isValid: !!user && !!user.resetPasswordToken
    })
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json({ isValid: false })
  }
}