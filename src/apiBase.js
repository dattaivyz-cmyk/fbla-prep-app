import { Capacitor } from '@capacitor/core';

// On the website, '/api/...' resolves against the same origin and works.
// Inside the native app the origin is capacitor://localhost, which has no
// /api routes, so those calls have to name the deployed domain explicitly.
const PROD_ORIGIN = 'https://fbla-prep-app.vercel.app';

export function apiUrl(path) {
  try {
    if (Capacitor && typeof Capacitor.isNativePlatform === 'function'
        && Capacitor.isNativePlatform()) {
      return PROD_ORIGIN + path;
    }
  } catch {
    // fall through to the relative path
  }
  return path;
}
