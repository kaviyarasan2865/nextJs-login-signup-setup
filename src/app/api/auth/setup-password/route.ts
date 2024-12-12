import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { password } = await request.json()
    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(password, salt)
    await user.updateAuthProvider('local')

    await user.save()

    return NextResponse.json({ 
      message: 'Password set successfully',
      authProvider: user.authProvider,
      password: '••••••••'
    })
  } catch (error) {
    console.error('Password setup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}