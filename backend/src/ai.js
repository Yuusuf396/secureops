// AI analysis via the Groq API (free tier, OpenAI-compatible).
// Get a free key at https://console.groq.com - no credit card required.
require('dotenv').config();

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const VALID_RISKS = ['Low', 'Medium', 'High'];

async function analyzeIncident({ title, description, severity }) {
  if (!process.env.GROQ_API_KEY) {
    const err = new Error('GROQ_API_KEY is not configured on the server');
    err.status = 503;
    throw err;
  }

  const prompt = `You are a security operations analyst. Analyze this incident report and respond with ONLY a JSON object (no markdown, no extra text) in this exact shape:
{"summary": "<1-3 line plain-English summary>", "risk": "<Low|Medium|High>", "action": "<one concrete suggested mitigation action>"}

Incident:
Title: ${title}
Reporter-assigned severity: ${severity}
Description: ${description}`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`AI API error (${res.status}): ${body.slice(0, 300)}`);
    err.status = 502;
    throw err;
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';

  // Tolerate the model wrapping JSON in extra text or code fences
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    const err = new Error('AI returned an unparseable response');
    err.status = 502;
    throw err;
  }

  const parsed = JSON.parse(match[0]);
  return {
    summary: String(parsed.summary || '').trim(),
    risk: VALID_RISKS.includes(parsed.risk) ? parsed.risk : severity,
    action: String(parsed.action || '').trim(),
  };
}

module.exports = { analyzeIncident };
