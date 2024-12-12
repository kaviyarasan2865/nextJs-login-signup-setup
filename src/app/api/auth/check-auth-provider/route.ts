import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    await connectDB();

    const user = await User.findOne({ email });
    
    return NextResponse.json({
      authProvider: user ? user.authProvider : null
    });
    
  } catch (error) {
    console.error('Check auth provider error:', error);
    return NextResponse.json(
      { error: 'Failed to check auth provider' },
      { status: 500 }
    );
  }
}