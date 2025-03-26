// Polyfill for global object
if (typeof window !== 'undefined') {
  console.log('Applying global polyfill');
  (window as any).global = window;
  (window as any).process = { env: {} };
  // Log to confirm the polyfill is applied
  console.log('Global polyfill applied:', typeof (window as any).global);
}

export {};