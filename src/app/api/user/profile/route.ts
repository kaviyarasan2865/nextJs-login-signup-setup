import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email }).select('+password')
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      password: user.password ? '••••••••' : null,
      organization: user.organization,
      role: user.role,
      domain: user.domain,
      isVerified: user.isVerified,
      authProvider: user.authProvider,
      image: user.profileImage || null
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update basic fields
    const allowedFields = ['name', 'organization', 'role', 'domain']
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        user[field] = data[field]
      }
    })

    // Handle profile image as base64
    // if (data.image) {
    //   // Check if the image is already base64
    //   if (!data.image.startsWith('data:image')) {
    //     // If not base64, encode it
    //     try {
    //       const base64Image = Buffer.from(data.image).toString('base64')
    //       user.profileImage = `data:image/jpeg;base64,${base64Image}`
    //     } catch (error) {
    //       console.error('Image encoding error:', error)
    //       return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
    //     }
    //   } else {
    //     // Image is already base64, store as is
    //     user.profileImage = data.image
    //   }
    // }

    await user.save()
    
    return NextResponse.json({ 
      message: 'Profile updated successfully',
      image: user.profileImage || null,
      name: user.name,
      organization: user.organization,
      role: user.role,
      domain: user.domain
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}