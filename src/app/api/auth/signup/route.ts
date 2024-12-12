import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password, authProvider } = await request.json();

    // Connect to database
    await connectDB();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists. Please use login instead.' },
        { status: 400 }
      );
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      authProvider: authProvider || 'local',
      isVerified: false
    });

    console.log('User created successfully:', user);

    return NextResponse.json(
      { message: 'User created successfully' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}