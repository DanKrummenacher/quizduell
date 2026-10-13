import { type INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { Server, ServerOptions } from 'socket.io';

export class SocketIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly corsOrigins: string[],
  ) {
    super(app);
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    const merged: Partial<ServerOptions> = {
      ...options,
      cors: { origin: this.corsOrigins },
      // Small payloads only; protects against oversized messages.
      maxHttpBufferSize: 10_000,
      pingInterval: 10_000,
      pingTimeout: 8_000,
    };
    return super.createIOServer(port, merged as ServerOptions);
  }
}
