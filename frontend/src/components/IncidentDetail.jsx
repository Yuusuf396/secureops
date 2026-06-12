export default function IncidentDetail({ incident, onBack }) {
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
    </main>
  );
}
