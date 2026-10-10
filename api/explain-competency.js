import { requireStudent } from './_auth.js';

// Deliberately not named VITE_*. Vite inlines any VITE_-prefixed variable
// it finds in client code, so that prefix on a billing credential is one
// careless import away from shipping the key to every visitor's browser.
// The old name is still read so nothing breaks before Vercel is updated.
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;

export default async function handler(req, res) {
  // The native app runs from capacitor://localhost, so every /api/ call is
  // cross-origin and the browser sends an OPTIONS preflight first. Answer it
  // before the method check, or the real request is never sent. The website
  // is same-origin and never reaches this.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const user = await requireStudent(req, res);
  if (!user) return;

  try {
    const { competency, examples, event } = req.body;
    const eventName = event || 'this FBLA competitive event';
    const prompt = `You are writing a short study summary for FBLA competitive event students studying "${eventName}," specifically the competency area: "${competency}".

Here are real practice questions from this competency area, to show you exactly what students are tested on:

${examples.map((e, i) => `${i + 1}. ${e.q}`).join('\n')}

Write a clear, accurate study summary (250-400 words) covering the key concepts, terms, and rules a student needs to know for this competency area within "${eventName}". Use plain language a high school student would understand. Format with short paragraphs or a few bullet points where helpful. Do not include a title or heading, just the summary text itself.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || 'Could not generate a summary right now.';

    res.status(200).json({ summary: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
