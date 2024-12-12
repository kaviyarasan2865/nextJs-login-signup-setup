'use client'

import * as React from 'react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

// Define the password validation types
type PasswordCheck = {
  isValid: boolean;
  message: string;
}

type PasswordValidation = {
  isValid: boolean;
  checks: PasswordCheck[];
}

// Password validation function
const validatePassword = (password: string): PasswordValidation => {
  const checks = [
    {
      isValid: password.length >= 8,
      message: 'At least 8 characters'
    },
    {
      isValid: /[A-Z]/.test(password),
      message: 'At least one uppercase letter'
    },
    {
      isValid: /[a-z]/.test(password),
      message: 'At least one lowercase letter'
    },
    {
      isValid: /[0-9]/.test(password),
      message: 'At least one number'
    },
    {
      isValid: /[!@#$%^&*]/.test(password),
      message: 'At least one special character (!@#$%^&*)'
    }
  ];

  return {
    isValid: checks.every(check => check.isValid),
    checks
  };
};

const OTPInput = ({ value, onChange, disabled }: { 
  value: string; 
  onChange: (value: string) => void; 
  disabled?: boolean 
}) => {
  const inputRefs = Array(6).fill(0).map(() => React.useRef<HTMLInputElement>(null));

  const handleChange = (index: number, digit: string) => {
    if (digit.length > 1) return;
    const newValue = value.split('');
    newValue[index] = digit;
    onChange(newValue.join(''));
    if (digit && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array(6).fill(0).map((_, index) => (
        <input
          key={index}
          ref={inputRefs[index]}
          type="text"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          disabled={disabled}
          className="w-10 h-10 text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      ))}
    </div>
  );
};

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otp, setOtp] = useState('')
  const [timer, setTimer] = useState(60)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>(validatePassword(''))
  const [verifyStatus, setVerifyStatus] = useState('idle')
  const [otpMessageType, setOtpMessageType] = useState<'success' | 'error'>('error')
  const [isPasswordValid, setIsPasswordValid] = useState(false)

  useEffect(() => {
    const validation = validatePassword(password);
    setPasswordValidation(validation);
    setIsPasswordValid(validation.isValid);
  }, [password]);

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    } else if (timer === 0) {
      setIsTimerRunning(false)
    }
    return () => clearInterval(interval)
  }, [timer, isTimerRunning])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements')
      return
    }

    try {
      // Check if user exists first
      const checkUser = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const userData = await checkUser.json()
      if (userData?.exists) {
        setError('User already exists. Please use login instead.')
        return
      }
      // Proceed with signup only if user doesn't exist
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password,
          authProvider: 'local',
          isVerified: false
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      // Show OTP modal and send initial OTP
      setShowOtpModal(true)
      await sendOTP()
    } catch (error) {
      console.error('Signup error:', error)
      setError(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    }
  }
  const sendOTP = async () => {
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        throw new Error('Failed to send OTP')
      }

      setTimer(60)
      setIsTimerRunning(true)
      setOtpError('')
      setOtpMessageType('success')
      setOtpError('OTP sent successfully! Please check your email.')
    } catch (error) {
      setOtpMessageType('error')
      setOtpError('Failed to send OTP. Please try again.')
    }
  }

  const handleVerifyOTP = async () => {
    try {
      setVerifyStatus('loading')
      setError('')

      // Validate OTP format
      if (!otp || otp.length !== 6) {
        setError('Please enter a valid 6-digit OTP')
        setVerifyStatus('error')
        return
      }

      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          otp
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      // If verification successful, sign in
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (signInResult?.error) {
        throw new Error(signInResult.error)
      }

      setIsVerified(true)
      setShowOtpModal(false)
      router.push('/dashboard')
    } catch (error) {
      console.error('Verification Error:', error)
      setError(error instanceof Error ? error.message : 'Verification failed')
      setVerifyStatus('error')
    } finally {
      setVerifyStatus('idle')
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: true,
      });

      if (result?.error) {
        throw new Error(result.error);
      }
      
      // The actual provider linking will be handled in the OAuth callback API route
    } catch (error) {
      console.error('Google signup error:', error);
      setError('Google signup failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Create your account</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Create Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-2 space-y-2 text-sm">
              {passwordValidation.checks.map((check, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className={check.isValid ? "text-green-500" : "text-gray-400"}>
                    {check.isValid ? "✓" : "○"}
                  </span>
                  <span className="text-gray-600">{check.message}</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!isPasswordValid || !email}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full py-2 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>

        <p className="text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-700">
            Login
          </Link>
        </p>
      </div>

      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Verify Your Email</h2>
              <p className="text-gray-600 text-sm mt-2">
                We've sent a verification code to your email address
              </p>
            </div>

            <OTPInput
              value={otp}
              onChange={setOtp}
              disabled={!isTimerRunning || isVerified}
            />

            <p className="text-sm text-center text-gray-600">
              OTP sent to {email}
            </p>

            {otpError && (
              <p className={`text-sm text-center ${
                otpMessageType === 'success' ? 'text-green-500' : 'text-red-500'
              }`}>
                {otpError}
              </p>
            )}

            <button
              onClick={handleVerifyOTP}
              disabled={!isTimerRunning || otp.length !== 6 || isVerified}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Verify OTP
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <button
              onClick={sendOTP}
              disabled={isTimerRunning || isVerified}
              className="w-full py-2 border rounded-lg hover:bg-gray-50 disabled:bg-gray-100"
            >
              {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}