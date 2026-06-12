const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  listIncidents: () => request('/incidents'),
  getIncident: (id) => request(`/incidents/${id}`),
  createIncident: (incident) =>
    request('/incidents', { method: 'POST', body: JSON.stringify(incident) }),
};
