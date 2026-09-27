import { requireStudent } from './_auth.js';

export default async function handler(req, res) {
  const user = await requireStudent(req, res);
  if (!user) return;

  try {
    const { question, options, correctAnswer, event, competency } = req.body;
    const eventName = event || 'this FBLA competitive event';
    const letters = ['A', 'B', 'C', 'D'];
    const prompt = `You are explaining an FBLA competitive event practice question to a student studying "${eventName}," competency area: "${competency}".

Question: ${question}
A) ${options[0]}
B) ${options[1]}
C) ${options[2]}
D) ${options[3]}
Correct answer: ${letters[correctAnswer]}) ${options[correctAnswer]}

Write a short, clear explanation (120-180 words) that:
1. Explains why the correct answer is right
2. Briefly explains why each of the other three options is wrong or a common misconception

Use plain language a high school student would understand. Do not include a title or heading, and do not use markdown formatting (no #, no **, no bullet symbols) — plain text only, using line breaks between points if needed.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || 'Could not generate an explanation right now.';

    res.status(200).json({ explanation: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
