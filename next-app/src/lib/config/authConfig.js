// Full-stack Next.js configuration for JWT and authentication settings

export const authConfig = {
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'fallbackSecretKey',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtCookieExpiresInDays: parseInt(process.env.JWT_COOKIE_EXPIRES_IN) || 1,
  
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  
  // Database
  mongoUri: process.env.MONGO_URI,
  
  // Email Configuration
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
};

// Helper functions
export const isDevelopment = () => authConfig.nodeEnv === 'development';
export const isProduction = () => authConfig.nodeEnv === 'production';

// Convert JWT expiry string to milliseconds for consistency
export const parseJWTExpiryToMs = (expiryString) => {
  if (!expiryString) return 24 * 60 * 60 * 1000; // Default 1 day
  
  const unit = expiryString.slice(-1).toLowerCase();
  const value = parseInt(expiryString.slice(0, -1));
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000; // Default 1 day
  }
};

// Get cookie max age in milliseconds
export const getCookieMaxAge = () => {
  return authConfig.jwtCookieExpiresInDays * 24 * 60 * 60 * 1000;
};

// Get JWT expiry in milliseconds
export const getJWTExpiryMs = () => {
  return parseJWTExpiryToMs(authConfig.jwtExpiresIn);
};

// Validate configuration
export const validateConfig = () => {
  const required = [
    { key: 'JWT_SECRET', value: process.env.JWT_SECRET },
    { key: 'MONGO_URI', value: process.env.MONGO_URI },
  ];
  
  const missing = required.filter(item => !item.value);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(item => {
      console.error(`   - ${item.key}`);
    });
    // In Next.js, we might not want to process.exit(1) on the server-side during runtime
    // but rather during build or just log the error.
  }
  
  if (isDevelopment()) {
    console.log('🔧 Authentication Configuration (Unified):');
    console.log(`   - JWT Expires In: ${authConfig.jwtExpiresIn}`);
    console.log(`   - Cookie Expires In: ${authConfig.jwtCookieExpiresInDays} days`);
  }
};
