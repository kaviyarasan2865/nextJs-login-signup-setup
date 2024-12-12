import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [function(this: any) { 
      return this.authProvider.includes('local'); 
    }, 'Password is required for local auth'],
    select: false
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'local and google'],
    default: 'local'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: String,
    expiresAt: Date
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  name: {
    type: String,
    trim: true,
  }
}, {
  timestamps: true
});

// Hash password before saving (only for local auth)
userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || !this.authProvider.includes('local')) return next();
    
    try {
      console.log('\n📝 Password Save Operation:', {
        'Operation': 'Pre-save password hashing',
        'Email': this.email,
        'Password Present': !!this.password,
        'Auth Providers': this.authProvider,
        'Time': new Date().toISOString()
      });

      if (!this.password && this.authProvider.includes('local')) {
        throw new Error('Password is required for local authentication');
      }
      if (!this.password) {
        throw new Error('Password is required for local authentication');
      }
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      console.error('❌ Password Hashing Error:', {
        'Error': error instanceof Error ? error.message : 'Unknown error',       
        'Time': new Date().toISOString()
      });
      next(error as Error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string) {
  try {
    if (!this.authProvider.includes('local')) {
      console.log('Auth Provider Mismatch:', {
        expected: 'local',
        found: this.authProvider
      });
      return false;
    }

    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    
    console.log('Password Verification Result:', {
      isMatch,
      authProviders: this.authProvider,
      hasPassword: !!this.password,
      timestamp: new Date().toISOString()
    });

    return isMatch;
  } catch (error) {
    console.error('Password Comparison Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    return false;
  }
};

// Method to add auth provider
userSchema.methods.updateAuthProvider = async function(provider: 'local' | 'google') {
  try {
    let newAuthProvider = this.authProvider;

    if (provider === 'google' && this.authProvider === 'local') {
      newAuthProvider = 'local and google';
    } else if (provider === 'local' && this.authProvider === 'google') {
      newAuthProvider = 'local and google';
    } else if (!this.authProvider) {
      newAuthProvider = provider;
    }

    this.authProvider = newAuthProvider;
    await this.save();

    console.log('✅ Auth Provider Updated:', {
      email: this.email,
      newProvider: newAuthProvider,
      timestamp: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('❌ Update Auth Provider Error:', error);
    return false;
  }
};

// Method to verify credentials based on login method
userSchema.methods.verifyCredentials = async function(loginMethod: 'local' | 'google', credential: string) {
  try {
    if (loginMethod === 'local') {
      if (!this.authProvider.includes('local')) return false;
      return await bcrypt.compare(credential, this.password);
    } else if (loginMethod === 'google') {
      if (!this.authProvider.includes('google')) return false;
      return this.googleId === credential;
    }
    return false;
  } catch (error) {
    console.error('Credential Verification Error:', error);
    return false;
  }
};

userSchema.methods.generateResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
  
  return resetToken;
};

// Add this new method for password reset
userSchema.methods.resetPassword = async function(newPassword: string) {
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(newPassword, salt);
    
    // Clear reset token fields
    this.resetPasswordToken = undefined;
    this.resetPasswordExpires = undefined;
    
    console.log('Password Reset Success:', {
      'Email': this.email,
      'New Hash Generated': true,
      'Hash Valid': this.password.startsWith('$2b$') || this.password.startsWith('$2a$'),
      'Time': new Date().toISOString()
    });
    
    await this.save();
    return true;
  } catch (error) {
    console.error('Password Reset Error:', {
      'Error': error instanceof Error ? error.message : 'Unknown error',
      'Time': new Date().toISOString()
    });
    return false;
  }
};

// Add method to link Google account
userSchema.methods.linkGoogleAccount = async function(googleId: string) {
  try {
    if (this.googleId && this.googleId !== googleId) {
      throw new Error('Account already linked to a different Google account');
    }
    
    this.googleId = googleId;
    await this.updateAuthProvider('google');
    
    console.log('Google Account Linked:', {
      email: this.email,
      googleId,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Link Google Account Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email: this.email,
      timestamp: new Date().toISOString()
    });
    return false;
  }
};

// Add method to check if provider exists
userSchema.methods.hasProvider = function(provider: string) {
  return this.authProvider.includes(provider);
};

// Add method to get available login methods
userSchema.methods.getLoginMethods = function() {
  return {
    local: this.authProvider.includes('local'),
    google: this.authProvider.includes('google'),
  };
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;