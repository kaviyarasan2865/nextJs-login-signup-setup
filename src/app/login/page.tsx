'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const router = useRouter()
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [resetError, setResetError] = useState('')

  const handleGoogleSignIn = async () => {
    try {
      setStatus('loading');
      
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/dashboard'
      });

      if (result?.error) {
        throw new Error('Google sign in failed');
      }

      if (result?.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      setStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to sign in with Google');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    try {
      // Check user's auth provider first
      const checkRes = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const userData = await checkRes.json();

      if (!userData.exists) {
        setError('No account found with this email');
        setStatus('error');
        return;
      }

      // Check if local auth is enabled
      if (!userData.authProvider.includes('local')) {
        setError('Please use Google to sign in');
        setStatus('error');
        return;
      }

      // Proceed with credentials login
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (!result?.ok) {
        throw new Error('Invalid credentials');
      }

      setStatus('success');
      router.push('/dashboard');
    } catch (error) {
      setStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to login');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetStatus('loading')
    setResetError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset link')
      }

      setResetStatus('success')
    } catch (error) {
      setResetStatus('error')
      setResetError(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold text-center mb-8">Log In</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          

          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {status === 'loading' ? 'Signing in...' : 'Log In'}
          </button>
        </form>

        <div className="my-4 text-center text-gray-500">
          <span>or</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={status === 'loading'}
          className="w-full flex items-center justify-center gap-2 border py-2 rounded-lg hover:bg-gray-50"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Sign in with Google
        </button>

        <div className="mt-4 text-center">
          <button
            onClick={() => setShowForgotPasswordModal(true)}
            className="text-gray-600 hover:text-blue-600"
          >
            Forgot your password?
          </button>
        </div>

        <div className="mt-4 text-center text-gray-600">
          Don't have an account?{' '}
          <Link href="/signup" className="text-blue-600 hover:text-blue-700">
            Sign up
          </Link>
        </div>
      </div>

      {/* Modal for password reset */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
            
            {resetStatus === 'success' ? (
              <div className="text-center">
                <p className="mb-4">Reset link sent! Check your email for instructions.</p>
                <button 
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <p className="mb-2">Enter your email address and we'll send you a link to reset your password.</p>
                  <input
                    type="email"
                    placeholder="Email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                {resetError && <p className="text-red-500 text-sm">{resetError}</p>}
                <button
                  type="submit"
                  disabled={resetStatus === 'loading'}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {resetStatus === 'loading' ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}