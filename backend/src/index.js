require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const { analyzeIncident } = require('./ai');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json());

const VALID_SEVERITIES = ['Low', 'Medium', 'High'];

app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: db.mode, time: new Date().toISOString() });
});

app.get('/incidents', async (req, res, next) => {
  try {
    res.json(await db.listIncidents());
  } catch (err) {
    next(err);
  }
});

app.get('/incidents/:id', async (req, res, next) => {
  try {
    const incident = await db.getIncident(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json(incident);
  } catch (err) {
    next(err);
  }
});

app.post('/incidents', async (req, res, next) => {
  try {
    const { title, description, severity } = req.body || {};
    if (!title || !title.trim()) return res.status(400).json({ error: 'title is required' });
    if (!description || !description.trim()) return res.status(400).json({ error: 'description is required' });
    if (!VALID_SEVERITIES.includes(severity)) {
      return res.status(400).json({ error: 'severity must be Low, Medium, or High' });
    }
    const incident = await db.createIncident({
      title: title.trim(),
      description: description.trim(),
      severity,
    });
    res.status(201).json(incident);
  } catch (err) {
    next(err);
  }
});

const VALID_STATUSES = ['Open', 'Investigating', 'Resolved'];

app.patch('/incidents/:id', async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'status must be Open, Investigating, or Resolved' });
    }
    const incident = await db.updateStatus(req.params.id, status);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json(incident);
  } catch (err) {
    next(err);
  }
});

// Runs AI analysis for an incident and persists the result on the record.
app.post('/ai/summarize', async (req, res, next) => {
  try {
    const { incidentId } = req.body || {};
    if (!incidentId) return res.status(400).json({ error: 'incidentId is required' });

    const incident = await db.getIncident(incidentId);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    // Pass the full incident history so the triage engine can retrieve similar cases
    const allIncidents = await db.listIncidents();
    const analysis = await analyzeIncident(incident, allIncidents);
    const updated = await db.saveAnalysis(incident.id, analysis);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

db.init()
  .then(() => {
    app.listen(PORT, () => console.log(`SecureOps Lite API listening on :${PORT} (db: ${db.mode})`));
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
