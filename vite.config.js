import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  async function callClaude(prompt, maxTokens) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY || env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    const data = await response.json()
    return data.content?.[0]?.text || ''
  }

  function readBody(req) {
    return new Promise((resolve, reject) => {
      let body = ''
      req.on('data', chunk => { body += chunk })
      req.on('end', () => {
        try { resolve(JSON.parse(body)) } catch (e) { reject(e) }
      })
    })
  }

  return {
    plugins: [
      react(),
      {
        name: 'anthropic-api-middleware',
        configureServer(server) {
          server.middlewares.use('/api/generate-questions', async (req, res) => {
            if (req.method !== 'POST') { res.statusCode = 405; res.end('Method not allowed'); return }
            try {
              const { examples, count, event } = await readBody(req)
              const eventName = event || 'this FBLA competitive event'
              const prompt = `You are writing FBLA competitive event practice questions for "${eventName}." Here are real example questions showing the exact style, tone, obscurity level, and format to match:

${examples.map((e, i) => `${i + 1}. ${e.q}\n   a) ${e.options[0]}\n   b) ${e.options[1]}\n   c) ${e.options[2]}\n   d) ${e.options[3]}\n   Correct: ${['a','b','c','d'][e.answer]}\n   Competency: ${e.competency}`).join('\n\n')}

Write ${count} BRAND NEW questions on this same topic, ranging from basic vocabulary to obscure niche terms. Do not repeat or lightly reword the examples above. Generate genuinely new questions covering different facts, terms, and scenarios relevant to "${eventName}".

Also tag each question with the specific competency area it tests (use the real competency names shown in the examples above, not a generic label).

Respond with ONLY a raw JSON array, no markdown, no code fences, no explanation. Format exactly:
[{"q": "question text", "options": ["opt a", "opt b", "opt c", "opt d"], "answer": 0, "competency": "the specific competency name"}]
where "answer" is the 0-indexed correct option.`
              const text = await callClaude(prompt, 4000)
              const clean = text.replace(/```json|```/g, '').trim()
              res.setHeader('Content-Type', 'application/json')
              res.end(clean)
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            }
          })

          server.middlewares.use('/api/explain-competency', async (req, res) => {
            if (req.method !== 'POST') { res.statusCode = 405; res.end('Method not allowed'); return }
            try {
              const { competency, examples, event } = await readBody(req)
              const eventName = event || 'this FBLA competitive event'
              const prompt = `You are writing a short study summary for FBLA competitive event students studying "${eventName}," specifically the competency area: "${competency}".

Here are real practice questions from this competency area, to show you exactly what students are tested on:

${examples.map((e, i) => `${i + 1}. ${e.q}`).join('\n')}

Write a clear, accurate study summary (250-400 words) covering the key concepts, terms, and rules a student needs to know for this competency area within "${eventName}". Use plain language a high school student would understand. Format with short paragraphs or a few bullet points where helpful. Do not include a title or heading, just the summary text itself.`
              const text = await callClaude(prompt, 1000)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ summary: text || 'Could not generate a summary right now.' }))
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            }
          })

          server.middlewares.use('/api/explain-missed-question', async (req, res) => {
            if (req.method !== 'POST') { res.statusCode = 405; res.end('Method not allowed'); return }
            try {
              const { question, options, correctAnswer, event, competency } = await readBody(req)
              const eventName = event || 'this FBLA competitive event'
              const letters = ['A', 'B', 'C', 'D']
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

Use plain language a high school student would understand. Do not include a title or heading, and do not use markdown formatting (no #, no **, no bullet symbols) — plain text only, using line breaks between points if needed.`
              const text = await callClaude(prompt, 600)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ explanation: text || 'Could not generate an explanation right now.' }))
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            }
          })

          server.middlewares.use('/api/generate-vocab', async (req, res) => {
            if (req.method !== 'POST') { res.statusCode = 405; res.end('Method not allowed'); return }
            try {
              const { competency, event, examples } = await readBody(req)
              const eventName = event || 'this FBLA competitive event'
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
[{"term": "the word or phrase", "definition": "a clear, accurate definition", "level": "foundational" | "intermediate" | "obscure"}]`
              const text = await callClaude(prompt, 2500)
              const clean = text.replace(/```json|```/g, '').trim()
              res.setHeader('Content-Type', 'application/json')
              res.end(clean)
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            }
          })
        }
      }
    ],
  }
})
