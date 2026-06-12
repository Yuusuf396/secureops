// AI triage engine via the Groq API (free tier, OpenAI-compatible).
// Get a free key at https://console.groq.com - no credit card required.
// Analysis is context-aware: similar past incidents from the database are
// retrieved (word-overlap scoring) and injected into the prompt so the model
// can lean on resolution history.
require('dotenv').config();

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const VALID_RISKS = ['Low', 'Medium', 'High', 'Critical'];
const VALID_ACTIONS = ['Ignore', 'Monitor', 'Investigate', 'Escalate'];

function significantWords(text) {
  return new Set((text.toLowerCase().match(/[a-z]{4,}/g) || []));
}

// Naive retrieval: rank past incidents by shared significant words.
function findSimilarIncidents(incident, allIncidents, limit = 3) {
  const words = significantWords(`${incident.title} ${incident.description}`);
  return allIncidents
    .filter((other) => other.id !== incident.id)
    .map((other) => {
      const otherWords = `${other.title} ${other.description}`.toLowerCase().match(/[a-z]{4,}/g) || [];
      const overlap = new Set(otherWords.filter((w) => words.has(w))).size;
      return { incident: other, score: overlap };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function buildContextSection(similar) {
  if (similar.length === 0) return 'No similar past incidents found in the database.';
  return similar
    .map(({ incident: s }) => {
      const lines = [
        `- Incident #${s.id}: "${s.title}" (severity: ${s.severity}, status: ${s.status || 'Open'})`,
        `  Description: ${s.description.slice(0, 200)}`,
      ];
      if (s.ai_risk) lines.push(`  Past assessment: risk ${s.ai_risk}; action taken: ${s.ai_action || 'n/a'}`);
      return lines.join('\n');
    })
    .join('\n');
}

async function analyzeIncident(incident, allIncidents = []) {
  if (!process.env.GROQ_API_KEY) {
    const err = new Error('GROQ_API_KEY is not configured on the server');
    err.status = 503;
    throw err;
  }

  const similar = findSimilarIncidents(incident, allIncidents);

  const prompt = `You are an AI incident triage engine for a security operations platform. You analyze operational data; you do not chat. No storytelling, no filler, no markdown.

Respond with ONLY a valid JSON object in this exact shape:
{
  "summary": "<1-3 line plain-English summary>",
  "risk": "<Low|Medium|High|Critical>",
  "action": "<one concrete suggested mitigation action>",
  "recommended_action": "<Ignore|Monitor|Investigate|Escalate>",
  "confidence": <0.0-1.0>,
  "tags": ["<2-4 short lowercase tags>"],
  "reasoning": "<one sentence on why you classified it this way, referencing similar past incidents if used>"
}

Severity rules:
- Critical: active threat, safety risk, or system-wide outage
- High: strong evidence of malfunction or security risk
- Medium: abnormal but contained issue
- Low: informational or expected behavior
If uncertain, err UPWARD (choose the higher severity).

Use the similar past incidents below when relevant; prioritize their resolution patterns. If none are relevant, say so in "reasoning".

Similar past incidents (retrieved from database):
${buildContextSection(similar)}

Incident to triage:
Title: ${incident.title}
Reporter-assigned severity: ${incident.severity}
Description: ${incident.description}`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 700,
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
  const confidence = Number(parsed.confidence);
  return {
    summary: String(parsed.summary || '').trim(),
    risk: VALID_RISKS.includes(parsed.risk) ? parsed.risk : incident.severity,
    action: String(parsed.action || '').trim(),
    meta: {
      recommended_action: VALID_ACTIONS.includes(parsed.recommended_action)
        ? parsed.recommended_action
        : 'Investigate',
      confidence: Number.isFinite(confidence) ? Math.min(Math.max(confidence, 0), 1) : null,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 4).map((t) => String(t).toLowerCase()) : [],
      reasoning: String(parsed.reasoning || '').trim(),
      similar_ids: similar.map(({ incident: s }) => s.id),
    },
  };
}

module.exports = { analyzeIncident };
