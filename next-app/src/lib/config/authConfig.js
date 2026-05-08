// Backend configuration for JWT and authentication settings
// Next.js automatically loads .env files

export const authConfig = {
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'fallbackSecretKey',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtCookieExpiresInDays: parseInt(process.env.JWT_COOKIE_EXPIRES_IN) || 1,
  
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 4001,
  
  // Database
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/fmpg',
  
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
