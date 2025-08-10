export interface LoggerOptions {
  animated?: boolean;
  level?: 'debug' | 'info' | 'warn' | 'error';
}

export interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

const colors = {
  debug: '\x1b[36m',
  info: '\x1b[32m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  reset: '\x1b[0m'
};

const levels = { debug: 0, info: 1, warn: 2, error: 3 };

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function createLogger(options: LoggerOptions = {}): Logger {
  const { animated = false, level = 'info' } = options;
  const minLevel = levels[level];
  const isTTY = process.stdout.isTTY && !process.env.CI;
  
  const log = async (type: keyof typeof levels, message: string) => {
    if (levels[type] < minLevel) return;
    
    const color = isTTY ? colors[type] : '';
    const reset = isTTY ? colors.reset : '';
    const prefix = `${color}[${type.toUpperCase()}]${reset}`;
    
    if (animated && isTTY) {
      const text = `${prefix} ${message}`;
      for (const char of text) {
        process.stdout.write(char);
        await sleep(20);
      }
      process.stdout.write('\n');
    } else {
      console.log(`${prefix} ${message}`);
    }
  };
  
  return {
    debug: (message: string) => log('debug', message),
    info: (message: string) => log('info', message),
    warn: (message: string) => log('warn', message),
    error: (message: string) => log('error', message)
  };
}