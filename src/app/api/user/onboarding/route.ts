// Import necessary modules from NextAuth and other libraries
import NextAuth from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';

// Create the NextAuth handler for authentication
const handler = NextAuth(authOptions);
export { handler as GET };

// Define the POST function for onboarding users
export async function POST(req: Request) {
  try {
    // Retrieve the session to check if the user is authenticated
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated by verifying their email
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to the MongoDB database
    await connectDB();
    
    // Parse the request body to extract onboarding details
    const { name, organization, role, domain } = await req.json();

    // Validate all required fields
    if (!name || !organization || !role || !domain) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Update the user with onboarding details in the database
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          name,
          organization,
          role,
          domain,
          onboardingCompleted: true
        }
      },
      { new: true }
    );

    // Check if the user was found and updated successfully
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return a success response with updated user information
    return NextResponse.json({
      success: true,
      user: {
        name: updatedUser.name,
        organization: updatedUser.organization,
        role: updatedUser.role,
        domain: updatedUser.domain
      }
    });
  } catch (error) {
    console.error('Onboarding Error:', error);
    
    // Return an error response for any unexpected issues
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    );
  }
}