import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import { join } from 'path';

const logDir = join(process.cwd(), 'logs');

const customFormat = winston.format.printf((info) => {
  const { timestamp, level, message, context, ...meta } = info;
  const contextStr = typeof context === 'string' ? context : 'App';
  const messageStr = typeof message === 'string' ? message : String(message);
  const timestampStr = typeof timestamp === 'string' ? timestamp : '';
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${timestampStr} [${level.toUpperCase()}] [${contextStr}] ${messageStr} ${metaStr}`;
});

export const winstonConfig = {
  transports: [
    // Console transport (development friendly)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike('BosowsOCR', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),
    // Error log file
    new winston.transports.File({
      filename: join(logDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json(),
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file (all levels)
    new winston.transports.File({
      filename: join(logDir, 'combined.log'),
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json(),
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Access log file (info level only, for request logging)
    new winston.transports.File({
      filename: join(logDir, 'access.log'),
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat,
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
};
