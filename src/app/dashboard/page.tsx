'use client'

import { signOut } from "next-auth/react"
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut({ 
        redirect: true,
        callbackUrl: '/' 
      })
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <button 
            onClick={handleSignOut}
            className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Sign out
          </button>
        </div>
        
        {/* Add your dashboard content here */}
        <div className="bg-white rounded-lg shadow p-6">
          <p>Welcome to your dashboard!</p>
        </div>
      </div>
    </div>
  )
}