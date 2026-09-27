import { requireStudent } from './_auth.js';

// Deliberately not named VITE_*. Vite inlines any VITE_-prefixed variable
// it finds in client code, so that prefix on a billing credential is one
// careless import away from shipping the key to every visitor's browser.
// The old name is still read so nothing breaks before Vercel is updated.
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;

export default async function handler(req, res) {
  const user = await requireStudent(req, res);
  if (!user) return;

  try {
    const { examples, count, event } = req.body;
    const eventName = event || 'this FBLA competitive event';
    const prompt = `You are writing FBLA competitive event practice questions for "${eventName}." Here are real example questions showing the exact style, tone, obscurity level, and format to match:

${examples.map((e, i) => `${i + 1}. ${e.q}\n   a) ${e.options[0]}\n   b) ${e.options[1]}\n   c) ${e.options[2]}\n   d) ${e.options[3]}\n   Correct: ${['a','b','c','d'][e.answer]}\n   Competency: ${e.competency}`).join('\n\n')}

Write ${count} BRAND NEW questions on this same topic, ranging from basic vocabulary to obscure niche terms. Do not repeat or lightly reword the examples above. Generate genuinely new questions covering different facts, terms, and scenarios relevant to "${eventName}".

Also tag each question with the specific competency area it tests (use the real competency names shown in the examples above, not a generic label).

Respond with ONLY a raw JSON array, no markdown, no code fences, no explanation. Format exactly:
[{"q": "question text", "options": ["opt a", "opt b", "opt c", "opt d"], "answer": 0, "competency": "the specific competency name"}]
where "answer" is the 0-indexed correct option.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
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
