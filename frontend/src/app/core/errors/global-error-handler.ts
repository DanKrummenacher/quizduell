import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    const timestamp = new Date().toISOString();
    const err = error as Error;

    const message = err.message ? err.message : String(error);

    console.error(`[${timestamp}] Global frontend error intercepted:`, message);
    if (err.stack) {
      console.error('Stacktrace:', err.stack);
    }
  }
}
