import { useState } from 'react';
import { api } from '../api.js';

export default function IncidentDetail({ incident, onBack, onUpdated }) {
  const [analyzing, setAnalyzing] = useState(false);
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

  return (
    <main className="panel detail">
      <button className="link" onClick={onBack}>
        ← Back to dashboard
      </button>

      <div className="card-top">
        <span className={`tag tag-${incident.severity.toLowerCase()}`}>{incident.severity}</span>
        <span className="date">{new Date(incident.created_at).toLocaleString()}</span>
      </div>
      <h2>{incident.title}</h2>
      <p className="description">{incident.description}</p>

      <section className="ai-section">
        <h3>🤖 AI Risk Analysis</h3>
        {incident.ai_summary ? (
          <div className="ai-result">
            <div>
              <span className="label">Summary</span>
              <p>{incident.ai_summary}</p>
            </div>
            <div>
              <span className="label">Risk level</span>
              <p>
                <span className={`tag tag-${(incident.ai_risk || '').toLowerCase()}`}>
                  {incident.ai_risk}
                </span>
              </p>
            </div>
            <div>
              <span className="label">Suggested action</span>
              <p>{incident.ai_action}</p>
            </div>
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
