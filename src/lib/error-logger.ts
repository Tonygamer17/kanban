// Global error logging for development
if (typeof window !== 'undefined') {
  // Log all unhandled errors
  window.addEventListener('error', (event) => {
    console.error('🚨 GLOBAL ERROR:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });

  // Log all unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 UNHANDLED PROMISE REJECTION:', {
      reason: event.reason,
      promise: event.promise
    });
  });
}

