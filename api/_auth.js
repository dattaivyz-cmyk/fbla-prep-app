// Shared gatekeeper for the /api routes.
//
// Without this, anyone who discovers an address like
// fbla-prep-app.vercel.app/api/generate-questions can call it over and
// over, and every call is billed to our Anthropic account. Nobody needs
// to steal the key to run up the bill.
//
// Each route now asks this file to check the caller first.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Best-effort throttle. Vercel may run several copies of this code at
// once and each copy keeps its own count, so this is a speed bump, not a
// hard ceiling. The token check above it is the real protection.
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const recentCalls = new Map();

function overRateLimit(userId) {
  const now = Date.now();
  const hits = (recentCalls.get(userId) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  recentCalls.set(userId, hits);

  // Don't let the map grow forever on a long-lived instance.
  if (recentCalls.size > 500) {
    for (const [key, times] of recentCalls) {
      if (times.every(t => now - t >= RATE_LIMIT_WINDOW_MS)) recentCalls.delete(key);
    }
  }
  return hits.length > RATE_LIMIT_MAX;
}

// Returns the signed-in user when the request is good.
// Returns null after already sending an error response, in which case the
// calling route must stop immediately.
export async function requireStudent(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return null;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Misconfigured deployment. Fail closed rather than serving everyone.
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    res.status(500).json({ error: 'Server is not configured correctly.' });
    return null;
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Sign in first.' });
    return null;
  }

  // Ask Supabase whether this token is real and still valid. A student
  // cannot forge one, because it is signed by Supabase.
  let user;
  try {
    const check = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
    });
    if (!check.ok) {
      res.status(401).json({ error: 'Your session expired. Sign in again.' });
      return null;
    }
    user = await check.json();
  } catch (err) {
    console.error('Token check failed:', err);
    res.status(503).json({ error: 'Could not verify your sign-in. Try again.' });
    return null;
  }

  if (!user || !user.id) {
    res.status(401).json({ error: 'Your session expired. Sign in again.' });
    return null;
  }

  if (overRateLimit(user.id)) {
    res.status(429).json({ error: 'Too many requests in a row. Wait a minute and try again.' });
    return null;
  }

  return user;
}
