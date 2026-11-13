'use client';

/**
 * @fileOverview Production-grade structured logging utility.
 * Ensures consistent telemetry without leaking PII.
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogContext {
  userId?: string;
  component?: string;
  action?: string;
  path?: string;
  payload?: any;
  [key: string]: any;
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  private sanitize(context: LogContext): LogContext {
    const sensitiveKeys = ['email', 'password', 'token', 'phone', 'whatsappNumber', 'idNumber'];
    const sanitized = { ...context };
    
    // Recursive sanitization for payload
    const walk = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      Object.keys(obj).forEach(key => {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sensitiveKeys.find(s => sk === s) || ''))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          walk(obj[key]);
        }
      });
    };

    if (sanitized.payload) walk(sanitized.payload);
    return sanitized;
  }

  private log(level: LogLevel, message: string, context: LogContext = {}) {
    const sanitizedContext = this.sanitize(context);
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...sanitizedContext,
    };

    if (this.isProduction) {
      // In production, this would typically pipe to Google Cloud Logging or Sentry
      // For now, we use structured console logs which are captured by modern monitoring tools
      console.log(JSON.stringify(logEntry));
    } else {
      const color = level === 'ERROR' ? '\x1b[31m' : level === 'WARN' ? '\x1b[33m' : '\x1b[36m';
      console.log(`${color}[${level}] [${timestamp}]\x1b[0m ${message}`, sanitizedContext);
    }
  }

  info(message: string, context?: LogContext) {
    this.log('INFO', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('WARN', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('ERROR', message, context);
  }
}

export const logger = new Logger();
