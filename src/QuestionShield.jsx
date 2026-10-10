import { useEffect, useState } from 'react';
import { onScreenshot, onCaptureChange } from './screenGuard.js';
import { supabase } from './supabaseClient';

export default function QuestionShield({ student, question, children }) {
  const [captured, setCaptured] = useState(false);

  useEffect(() => onCaptureChange(setCaptured), []);

  useEffect(() => {
    return onScreenshot(() => {
      try {
        supabase.from('screenshot_events').insert({
          student_email: student?.email || null,
          event: student?.event || null,
          question_id: question?.id || null,
          kind: 'screenshot',
        }).then(() => {}, () => {});
      } catch {}
    });
  }, [student?.email, student?.event, question?.id]);

  if (captured) {
    return (
      <div style={{
        minHeight: '40vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '32px 20px', border: '1px solid #C8C2B2',
        background: '#FBFAF6', color: '#15356B',
      }}>
        <div style={{
          fontFamily: "ui-monospace, 'SF Mono', 'Menlo', 'Consolas', monospace",
          fontSize: '11px', fontWeight: 700, letterSpacing: '1px',
          color: '#9C2E28', marginBottom: '12px',
        }}>SCREEN RECORDING DETECTED</div>
        <div style={{ fontSize: '15px', lineHeight: 1.5, maxWidth: '320px' }}>
          Questions are hidden while your screen is being recorded or mirrored.
          Stop the recording and this will come back on its own.
        </div>
      </div>
    );
  }

  const mark = student?.email || '';

  return (
    <div style={{ position: 'relative' }}>
      {mark && (
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-around', opacity: 0.1,
        }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{
              fontFamily: "ui-monospace, 'SF Mono', 'Menlo', 'Consolas', monospace",
              fontSize: '11px', color: '#15356B', whiteSpace: 'nowrap',
              transform: 'rotate(-18deg)', textAlign: 'center', letterSpacing: '1px',
            }}>{mark}&nbsp;&nbsp;&nbsp;{mark}&nbsp;&nbsp;&nbsp;{mark}</div>
          ))}
        </div>
      )}
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  );
}
