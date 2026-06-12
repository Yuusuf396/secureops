// Database layer. Uses PostgreSQL when DATABASE_URL is set (Supabase in prod),
// otherwise falls back to an in-memory store so the app runs locally with zero setup.
require('dotenv').config();

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High')),
    ai_summary TEXT,
    ai_risk TEXT,
    ai_action TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`;

let db;

if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  db = {
    mode: 'postgres',
    async init() {
      await pool.query(SCHEMA);
    },
    async listIncidents() {
      const { rows } = await pool.query('SELECT * FROM incidents ORDER BY created_at DESC');
      return rows;
    },
    async getIncident(id) {
      const { rows } = await pool.query('SELECT * FROM incidents WHERE id = $1', [id]);
      return rows[0] || null;
    },
    async createIncident({ title, description, severity }) {
      const { rows } = await pool.query(
        'INSERT INTO incidents (title, description, severity) VALUES ($1, $2, $3) RETURNING *',
        [title, description, severity]
      );
      return rows[0];
    },
    async saveAnalysis(id, { summary, risk, action }) {
      const { rows } = await pool.query(
        'UPDATE incidents SET ai_summary = $1, ai_risk = $2, ai_action = $3 WHERE id = $4 RETURNING *',
        [summary, risk, action, id]
      );
      return rows[0] || null;
    },
  };
} else {
  const incidents = [];
  let nextId = 1;

  db = {
    mode: 'memory',
    async init() {
      console.warn('DATABASE_URL not set - using in-memory store (data resets on restart)');
    },
    async listIncidents() {
      return [...incidents].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
    async getIncident(id) {
      return incidents.find((i) => i.id === Number(id)) || null;
    },
    async createIncident({ title, description, severity }) {
      const incident = {
        id: nextId++,
        title,
        description,
        severity,
        ai_summary: null,
        ai_risk: null,
        ai_action: null,
        created_at: new Date().toISOString(),
      };
      incidents.push(incident);
      return incident;
    },
    async saveAnalysis(id, { summary, risk, action }) {
      const incident = incidents.find((i) => i.id === Number(id));
      if (!incident) return null;
      incident.ai_summary = summary;
      incident.ai_risk = risk;
      incident.ai_action = action;
      return incident;
    },
  };
}

module.exports = db;
