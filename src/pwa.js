import { Capacitor } from '@capacitor/core'

// Registers the service worker. Save this as src/pwa.js and add one line to
// src/main.jsx:
//
//     import './pwa.js'
//
// Registration is skipped in development so the worker never caches a Vite
// dev build and confuses hot reload.

const native = (() => { try { return Capacitor.isNativePlatform(); } catch { return false; } })()

if ('serviceWorker' in navigator && import.meta.env.PROD && !native) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // A failed registration is not worth bothering a student about - the app
      // works fine without it, just without the offline shell.
    });
  });
}
