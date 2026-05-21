import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';

@Catch()
export class WsExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(WsExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();

    const message =
      exception instanceof Error
        ? exception.message
        : 'An unexpected error occurred';

    this.logger.error(
      `WebSocket error: ${message}`,
      exception instanceof Error ? exception.stack : '',
    );

    client.emit('error', message);
  }
}
