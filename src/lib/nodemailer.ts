import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export async function sendOTPEmail(email: string, otp: string) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Email</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #f97316; font-size: 32px; letter-spacing: 2px;">${otp}</h1>
        <p>This code will expire in 60 seconds.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

export async function sendResetPasswordEmail(email: string, resetToken: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <h2 style="color: #1f2937; text-align: center; margin-bottom: 20px;">Reset Your Password</h2>
        <p style="color: #4b5563; margin-bottom: 30px; text-align: center;">
          You requested to reset your password. Click the button below to set a new password:
        </p>
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${resetUrl}" 
             style="background-color: #f97316; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 5px;
                    display: inline-block;
                    font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
          This link will expire in 10 minutes. If you didn't request this reset, please ignore this email.
        </p>
        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #6b7280; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #3b82f6; word-break: break-all; font-size: 12px;">
            ${resetUrl}
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}