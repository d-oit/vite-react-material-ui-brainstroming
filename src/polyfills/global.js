// Polyfill for AWS SDK which expects 'global' to be defined
// This needs to be imported before AWS SDK is used

if (typeof window !== 'undefined' && !window.global) {
  window.global = window;
}

// Other Node.js globals that might be needed
if (typeof global === 'undefined') {
  global = window;
}

// Buffer polyfill
if (typeof Buffer === 'undefined') {
  window.Buffer = require('buffer/').Buffer;
}

// Process polyfill
if (typeof process === 'undefined') {
  window.process = { env: {} };
}
