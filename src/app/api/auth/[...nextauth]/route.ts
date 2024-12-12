import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'
import { authOptions } from './auth'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Please provide both email and password');
          }

          await connectDB();
          const user = await User.findOne({ email: credentials.email }).select('+password');

          // Log user search results
          console.log('\n🔍 Manual Login Attempt:', {
            email: credentials.email,
            userFound: !!user,
            authProvider: user?.authProvider
          });

          if (!user) {
            throw new Error('User not found');
          }

          if (!user.authProvider.includes('local')) {
            throw new Error('Please use Google login for this account');
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          console.log('\n✅ Password Verification:', {
            isValid: isPasswordValid,
            authProvider: user.authProvider
          });

          if (!isPasswordValid) {
            throw new Error('Invalid password');
          }

          return {
            id: user._id.toString(),
            email: user.email,
            authProvider: user.authProvider
          };
        } catch (error) {
          console.error('\n❌ Manual Login Error:', error);
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          await connectDB();
          let dbUser = await User.findOne({ email: user.email });
          
          console.log('\n🔍 Google Sign In Attempt:', {
            email: user.email,
            existingUser: !!dbUser,
            currentAuthProvider: dbUser?.authProvider
          });

          if (dbUser) {
            // Update Google ID and auth provider if needed
            let needsUpdate = false;
            let updates: any = {};

            if (!dbUser.googleId || dbUser.googleId !== user.id) {
              updates.googleId = user.id;
              needsUpdate = true;
            }

            if (!dbUser.authProvider.includes('google')) {
              updates.authProvider = dbUser.authProvider === 'local' 
                ? 'local and google' 
                : 'google';
              needsUpdate = true;
            }

            if (needsUpdate) {
              dbUser = await User.findByIdAndUpdate(
                dbUser._id,
                updates,
                { new: true }
              );
            }

            return true;
          } else {
            await User.create({
              email: user.email,
              googleId: user.id,
              authProvider: 'google',
              isVerified: true
            });

            return true;
          }
        } catch (error) {
          console.error('\n❌ Google Sign In Error:', error);
          return false;
        }
      }
      return true;
    },

    async session({ session, token }) {
      if (session.user) {
        const dbUser = await User.findOne({ email: session.user.email })
        if (dbUser) {
          session.user.id = dbUser._id.toString()
          session.user.authProvider = dbUser.authProvider
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/error',
  }
});

export { handler as GET, handler as POST }