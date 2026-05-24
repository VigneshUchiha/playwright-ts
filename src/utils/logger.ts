export enum LogLevel {
  DEBUG = 10,
  INFO = 20,
  WARN = 30,
  ERROR = 40,
}

export type LogSink = (line: string) => void;

const LEVEL_NAME: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
};

const defaultSink: LogSink = (line) => {
  process.stdout.write(line + '\n');
};

export class TestLogger {
  constructor(
    private readonly tag: string,
    private readonly level: LogLevel = LogLevel.INFO,
    private readonly sink: LogSink = defaultSink,
  ) {}

  debug(message: string, context?: Record<string, unknown>): void {
    this.emit(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.emit(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.emit(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.emit(LogLevel.ERROR, message, context);
  }

  child(subTag: string): TestLogger {
    return new TestLogger(`${this.tag}/${subTag}`, this.level, this.sink);
  }

  private emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (level < this.level) return;
    const ts = new Date().toISOString();
    let ctx = '';
    if (context) {
      try {
        ctx = ' ' + JSON.stringify(context);
      } catch {
        ctx = ' [unserializable context]';
      }
    }
    this.sink(`${ts} [${LEVEL_NAME[level]}] [${this.tag}] ${message}${ctx}`);
  }
}
