// Daily study reminder.
//
// Apple's guideline 4.2 rejects apps that are "simply a website bundled as an
// app". A local notification is real native capability a browser tab cannot
// provide, and this one is built on the student's own review queue.
//
// Daily rather than per-question because REVIEW_INTERVALS_MIN is in minutes
// and box 1 is a two-minute gap. Right for a practice session, absurd for push.
//
// Everything fails silently. A reminder that cannot be scheduled must never
// stop a student from practising.

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const DAILY_ID = 1001;
const DEFAULT_HOUR = 17;

function isNative() {
  try {
    return Capacitor && typeof Capacitor.isNativePlatform === 'function'
      ? Capacitor.isNativePlatform()
      : false;
  } catch {
    return false;
  }
}

async function ensurePermission() {
  const current = await LocalNotifications.checkPermissions();
  if (current.display === 'granted') return true;
  if (current.display === 'denied') return false;
  const asked = await LocalNotifications.requestPermissions();
  return asked.display === 'granted';
}

export async function syncStudyReminder(supabase, student, hour = DEFAULT_HOUR) {
  if (!isNative()) return;
  if (!student || !student.email || !student.event) return;
  try {
    if (!(await ensurePermission())) return;
    const { count, error } = await supabase
      .from('missed_questions')
      .select('id', { count: 'exact', head: true })
      .eq('student_email', student.email)
      .eq('event', student.event);
    if (error) return;
    const waiting = count || 0;
    const body = waiting > 0
      ? waiting + ' question' + (waiting === 1 ? '' : 's') + ' waiting in review for ' + student.event + '.'
      : 'Keep ' + student.event + ' fresh. A short set today beats cramming later.';
    await LocalNotifications.cancel({ notifications: [{ id: DAILY_ID }] });
    await LocalNotifications.schedule({
      notifications: [{
        id: DAILY_ID,
        title: 'FBLA practice',
        body: body,
        schedule: { on: { hour: hour, minute: 0 }, allowWhileIdle: true },
      }],
    });
  } catch {
    // deliberately silent
  }
}

export async function cancelStudyReminder() {
  if (!isNative()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: DAILY_ID }] });
  } catch {
    // deliberately silent
  }
}
