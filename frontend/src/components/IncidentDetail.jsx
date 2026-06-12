import { useState } from 'react';
import { api } from '../api.js';

const STATUSES = ['Open', 'Investigating', 'Resolved'];

export default function IncidentDetail({ incident, onBack, onUpdated }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [error, setError] = useState('');

  async function handleAnalyze() {
    setAnalyzing(true);
    setError('');
    try {
      const updated = await api.summarize(incident.id);
      onUpdated(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleStatusChange(status) {
    setSavingStatus(true);
    setError('');
    try {
      const updated = await api.updateStatus(incident.id, status);
      onUpdated(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingStatus(false);
    }
  }

  const status = incident.status || 'Open';

  return (
    <main className="panel detail">
      <button className="link" onClick={onBack}>
        ← Back to dashboard
      </button>

      <div className="card-top">
        <span className={`tag tag-${incident.severity.toLowerCase()}`}>{incident.severity}</span>
        <span className={`tag tag-status-${status.toLowerCase()}`}>{status}</span>
        <span className="date">{new Date(incident.created_at).toLocaleString()}</span>
      </div>
      <h2>{incident.title}</h2>
      <p className="description">{incident.description}</p>

      <div className="status-controls">
        <span className="label">Status</span>
        {STATUSES.map((s) => (
          <button
            key={s}
            className={s === status ? 'status-btn active' : 'status-btn'}
            disabled={savingStatus || s === status}
            onClick={() => handleStatusChange(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <section className="ai-section">
        <h3>AI Risk Analysis</h3>
        {incident.ai_summary ? (
          <div className="ai-result">
            <div>
              <span className="label">Summary</span>
              <p>{incident.ai_summary}</p>
            </div>
            <div>
              <span className="label">Risk level</span>
              <p className="risk-row">
                <span className={`tag tag-${(incident.ai_risk || '').toLowerCase()}`}>
                  {incident.ai_risk}
                </span>
                {incident.ai_meta?.recommended_action && (
                  <span className="tag tag-action">{incident.ai_meta.recommended_action}</span>
                )}
                {Number.isFinite(incident.ai_meta?.confidence) && (
                  <span className="confidence">
                    {Math.round(incident.ai_meta.confidence * 100)}% confidence
                  </span>
                )}
              </p>
            </div>
            <div>
              <span className="label">Suggested action</span>
              <p>{incident.ai_action}</p>
            </div>
            {incident.ai_meta?.tags?.length > 0 && (
              <div>
                <span className="label">Tags</span>
                <p className="chip-row">
                  {incident.ai_meta.tags.map((t) => (
                    <span key={t} className="chip">
                      {t}
                    </span>
                  ))}
                </p>
              </div>
            )}
            {incident.ai_meta?.reasoning && (
              <div>
                <span className="label">Reasoning</span>
                <p className="reasoning">
                  {incident.ai_meta.reasoning}
                  {incident.ai_meta.similar_ids?.length > 0 &&
                    ` (informed by ${incident.ai_meta.similar_ids.length} similar past incident${
                      incident.ai_meta.similar_ids.length > 1 ? 's' : ''
                    })`}
                </p>
              </div>
            )}
            <button onClick={handleAnalyze} disabled={analyzing} className="secondary">
              {analyzing ? 'Re-analyzing…' : 'Re-run analysis'}
            </button>
          </div>
        ) : (
          <div>
            <p className="muted">No analysis yet. Generate an AI summary, risk level, and suggested action.</p>
            <button onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? 'Analyzing…' : 'Analyze with AI'}
            </button>
          </div>
        )}
        {error && <p className="form-error">{error}</p>}
      </section>
    </main>
  );
}
