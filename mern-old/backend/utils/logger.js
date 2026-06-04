// Enhanced Console Logger (Manual Implementation)
// This replaces Winston when package installation is restricted

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

const levels = {
  ERROR: colors.red,
  WARN: colors.yellow,
  INFO: colors.blue,
  DEBUG: colors.white,
};

const formatMessage = (level, message) => {
  const timestamp = new Date().toISOString();
  const color = levels[level] || colors.reset;
  return `${colors.dim}[${timestamp}]${colors.reset} ${color}${level}${colors.reset}: ${message}`;
};

const logger = {
  error: (msg, error) => {
    console.error(formatMessage('ERROR', msg));
    if (error && error.stack) console.error(colors.dim + error.stack + colors.reset);
  },
  warn: (msg) => console.warn(formatMessage('WARN', msg)),
  info: (msg) => console.log(formatMessage('INFO', msg)),
  debug: (msg) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatMessage('DEBUG', msg));
    }
  },
};

module.exports = logger;
