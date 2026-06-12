import { useState } from 'react';

const SEVERITY_ORDER = { High: 3, Medium: 2, Low: 1 };

export default function IncidentList({ incidents, onSelect }) {
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [query, setQuery] = useState('');

  let shown = filter === 'All' ? incidents : incidents.filter((i) => i.severity === filter);
  if (query.trim()) {
    const q = query.trim().toLowerCase();
    shown = shown.filter(
      (i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
    );
  }
  shown = [...shown].sort((a, b) =>
    sortBy === 'severity'
      ? SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]
      : new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <div>
      <div className="list-controls">
        <input
          type="search"
          className="search"
          placeholder="Search incidents…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search incidents"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by severity">
          <option value="All">All severities</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort">
          <option value="newest">Newest first</option>
          <option value="severity">Severity</option>
        </select>
      </div>

      {shown.length === 0 ? (
        <p className="muted">
          {incidents.length === 0
            ? 'No incidents yet. Report one to get started.'
            : 'No incidents match your search.'}
        </p>
      ) : (
        <ul className="incident-list">
          {shown.map((incident) => (
            <li key={incident.id}>
              <button className="incident-card" onClick={() => onSelect(incident.id)}>
                <div className="card-top">
                  <span className={`tag tag-${incident.severity.toLowerCase()}`}>
                    {incident.severity}
                  </span>
                  <span className={`tag tag-status-${(incident.status || 'Open').toLowerCase()}`}>
                    {incident.status || 'Open'}
                  </span>
                  {incident.ai_summary && <span className="tag tag-ai">AI analyzed</span>}
                  <span className="date">
                    {new Date(incident.created_at).toLocaleDateString()}
                  </span>
                </div>
                <strong>{incident.title}</strong>
                <p className="muted clamp">{incident.description}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
