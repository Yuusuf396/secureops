// AI analysis via the Anthropic API. Returns { summary, risk, action }.
require('dotenv').config();

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

const VALID_RISKS = ['Low', 'Medium', 'High'];

async function analyzeIncident({ title, description, severity }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    const err = new Error('ANTHROPIC_API_KEY is not configured on the server');
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
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`AI API error (${res.status}): ${body.slice(0, 300)}`);
    err.status = 502;
    throw err;
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '';

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
