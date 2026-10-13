import { type ErrorHandler, Injectable } from '@angular/core';

/** Logs unexpected errors without breaking the running game. */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    console.error('[playduelio] Unexpected error', error);
  }
}
