import { useState } from 'react';
import { api } from '../api.js';

export default function IncidentForm({ onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('Low');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const incident = await api.createIncident({ title, description, severity });
      onCreated(incident);
      setTitle('');
      setDescription('');
      setSeverity('Low');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="incident-form">
      <label>
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Suspicious login attempts from unknown IP"
          required
        />
      </label>
      <label>
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What happened, when, and what systems are affected?"
          rows={5}
          required
        />
      </label>
      <label>
        Severity
        <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </label>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit incident'}
      </button>
    </form>
  );
}
