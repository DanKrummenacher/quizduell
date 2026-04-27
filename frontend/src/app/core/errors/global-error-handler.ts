import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  handleError(error: any): void {
    const timestamp = new Date().toISOString();

    const message = error.message ? error.message : error.toString();

    console.error(`[${timestamp}] Globaler Frontend Fehler abgefangen:`, message);
    if (error.stack) {
      console.error('Stacktrace:', error.stack);
    }
  }
}
