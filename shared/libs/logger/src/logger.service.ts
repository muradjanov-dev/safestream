import { Injectable, LoggerService } from '@nestjs/common';

interface LogEntry {
  level: string;
  message: string;
  context?: string;
  timestamp: string;
  [key: string]: unknown;
}

@Injectable()
export class AppLogger implements LoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
    return this;
  }

  private write(level: string, message: unknown, context?: string): void {
    const entry: LogEntry = {
      level,
      message: String(message),
      context: context || this.context,
      timestamp: new Date().toISOString(),
    };
    const output = JSON.stringify(entry);
    if (level === 'error' || level === 'warn') {
      process.stderr.write(output + '\n');
    } else {
      process.stdout.write(output + '\n');
    }
  }

  log(message: unknown, context?: string)   { this.write('info',  message, context); }
  error(message: unknown, trace?: string, context?: string) {
    this.write('error', message, context);
    if (trace) process.stderr.write(trace + '\n');
  }
  warn(message: unknown, context?: string)  { this.write('warn',  message, context); }
  debug(message: unknown, context?: string) { this.write('debug', message, context); }
  verbose(message: unknown, context?: string) { this.write('verbose', message, context); }
}
