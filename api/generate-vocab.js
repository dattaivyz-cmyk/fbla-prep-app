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
    const { competency, event, examples } = req.body;
    const eventName = event || 'this FBLA competitive event';
    const prompt = `You are creating vocabulary flashcards for FBLA competitive event students studying "${eventName}," specifically the competency area: "${competency}".

Here are real practice questions from this competency area:

${(examples || []).map((e, i) => `${i + 1}. ${e.q}`).join('\n')}

Step 1: Study these real questions carefully and judge how obscure or niche the hardest ones are. FBLA competitive tests often go well beyond textbook basics into specific, easily-overlooked details. Identify the actual difficulty ceiling shown in these examples.

Step 2: Write 12 vocabulary flashcards for this competency area, spanning that full range:
- About 4 cards: foundational terms a student must know as a baseline
- About 4 cards: intermediate terms, the kind that separate a prepared student from an unprepared one
- About 4 cards: niche, obscure terms that match the SAME level of difficulty and obscurity as the hardest real questions above — not generic "advanced" terms, but genuinely parallel in obscurity to what these real questions test

Each card needs a clear, accurate, concise definition (1-2 sentences). Do not invent facts — base every definition on standard, accurate knowledge for this subject area. Order the array from easiest to most obscure.

Respond with ONLY a raw JSON array, no markdown, no code fences, no explanation. Format exactly:
[{"term": "the word or phrase", "definition": "a clear, accurate definition", "level": "foundational" | "intermediate" | "obscure"}]`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '[]';
    const clean = text.replace(/```json|```/g, '').trim();

    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(clean);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
