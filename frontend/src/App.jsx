import { useEffect, useState } from 'react';
import { api } from './api.js';
import IncidentForm from './components/IncidentForm.jsx';
import IncidentList from './components/IncidentList.jsx';
import IncidentDetail from './components/IncidentDetail.jsx';

export default function App() {
  const [incidents, setIncidents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function refresh() {
    try {
      setError('');
      setIncidents(await api.listIncidents());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleCreated(incident) {
    setIncidents((prev) => [incident, ...prev]);
  }

  const selected = incidents.find((i) => i.id === selectedId);

  return (
    <div className="app">
      <header>
        <h1>
          <span className="logo">🛡️</span> SecureOps Lite
        </h1>
        <p className="tagline">Lightweight security incident tracking</p>
      </header>

      {error && <div className="banner error">{error}</div>}

      {selected ? (
        <IncidentDetail incident={selected} onBack={() => setSelectedId(null)} />
      ) : (
        <main className="grid">
          <section className="panel">
            <h2>Report an incident</h2>
            <IncidentForm onCreated={handleCreated} />
          </section>
          <section className="panel">
            <h2>Incidents</h2>
            {loading ? (
              <p className="muted">Loading…</p>
            ) : (
              <IncidentList incidents={incidents} onSelect={setSelectedId} />
            )}
          </section>
        </main>
      )}
    </div>
  );
}
