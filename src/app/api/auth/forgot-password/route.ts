import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendResetPasswordEmail } from '@/lib/nodemailer';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    await connectDB();
    const { email } = await request.json();

    // Find user and check if exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'No user found with this email.' },
        { status: 404 }
      );
    }

    // Check auth provider
    if (user.authProvider === 'google') {
      return NextResponse.json(
        { error: 'This account uses Google Sign-In. Please login with Google.' },
        { status: 400 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 600000; // 10 minutes (600000 milliseconds)

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Send email with the token
    const emailSent = await sendResetPasswordEmail(email, resetToken);
    
    if (!emailSent) {
      throw new Error('Failed to send reset email');
    }

    return NextResponse.json({ 
      message: 'Password reset email sent successfully' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}