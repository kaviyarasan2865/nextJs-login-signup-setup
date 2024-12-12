import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(email: string, otp: string) {
  // Implement your email sending logic here
  // You can use services like SendGrid, NodeMailer, etc.
  console.log(`Sending OTP ${otp} to ${email}`);
}