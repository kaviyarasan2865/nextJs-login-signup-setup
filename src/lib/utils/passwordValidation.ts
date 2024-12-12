interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
    score: number;
    checks: {
      length: boolean;
      uppercase: boolean;
      lowercase: boolean;
      number: boolean;
      special: boolean;
    };
  }
  
  export const validatePassword = (password: string): PasswordValidationResult => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  
    const errors: string[] = [];
    if (!checks.length) errors.push('Password must be at least 8 characters long');
    if (!checks.uppercase) errors.push('Password must contain at least one uppercase letter');
    if (!checks.lowercase) errors.push('Password must contain at least one lowercase letter');
    if (!checks.number) errors.push('Password must contain at least one number');
    if (!checks.special) errors.push('Password must contain at least one special character');
  
    // Calculate score (0-5 based on checks)
    const score = Object.values(checks).filter(Boolean).length;
  
    // Determine strength
    const strength = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';
  
    return {
      isValid: errors.length === 0,
      errors,
      strength,
      score,
      checks
    };
  };