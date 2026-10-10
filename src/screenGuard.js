import { Capacitor, registerPlugin } from '@capacitor/core';
const ScreenGuard = registerPlugin('ScreenGuard');

function isNative() {
  try {
    return Capacitor && typeof Capacitor.isNativePlatform === 'function'
      && Capacitor.isNativePlatform();
  } catch { return false; }
}

export function onScreenshot(handler) {
  if (!isNative()) return () => {};
  let remove = () => {};
  try {
    ScreenGuard.addListener('screenshotTaken', () => { try { handler(); } catch {} })
      .then(h => { remove = () => { try { h.remove(); } catch {} }; });
  } catch {}
  return () => remove();
}

export function onCaptureChange(handler) {
  if (!isNative()) return () => {};
  let remove = () => {};
  try {
    ScreenGuard.isBeingCaptured()
      .then(r => { try { handler(!!(r && r.captured)); } catch {} })
      .catch(() => {});
    ScreenGuard.addListener('captureStateChanged', e => {
      try { handler(!!(e && e.captured)); } catch {}
    }).then(h => { remove = () => { try { h.remove(); } catch {} }; });
  } catch {}
  return () => remove();
}
