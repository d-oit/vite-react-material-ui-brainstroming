// Polyfill for AWS SDK which expects 'global' to be defined
// This needs to be imported before AWS SDK is used

if (typeof window !== 'undefined' && !window.global) {
  window.global = window;
}

// Other Node.js globals that might be needed
// Use window.global instead of directly assigning to global
if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
  window.global = window;
}

// Buffer polyfill
if (typeof window !== 'undefined' && typeof Buffer === 'undefined') {
  // Use dynamic import instead of require
  import('buffer/').then(buffer => {
    window.Buffer = buffer.Buffer;
  });
}

// Process polyfill
if (typeof process === 'undefined') {
  window.process = { env: {} };
}
