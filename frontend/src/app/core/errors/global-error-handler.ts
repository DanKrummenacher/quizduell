import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  handleError(error: any): void {
    const timestamp = new Date().toISOString();
    
    // Check if it's an Error instance or something else
    const message = error.message ? error.message : error.toString();
    
    // G16: Systematisches Logging von Fehlern, ohne die App zum Absturz zu bringen
    console.error(`[${timestamp}] 🔴 Globaler Frontend Fehler abgefangen:`, message);
    if (error.stack) {
      console.error('Stacktrace:', error.stack);
    }

    // In a real production app we would send this to a logging backend like Sentry
    // or show a user-friendly Toast notification using a UI service.
    
    // Optional: console.warn('We could show a Toast notification here: "Ein unerwarteter Fehler ist aufgetreten."');
  }
}
