import { useCallback, useEffect, useState } from 'react';
import api from '../services/api.js';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import Header from '../components/layout/Header.jsx';
import Sidebar from '../components/layout/Sidebar.jsx';
import './Dashboard.css';

const mealSlots = [
  'Before Breakfast', 'After Breakfast', 'Before Lunch', 'After Lunch',
  'Before Dinner', 'After Dinner', 'Bedtime',
];

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(value) {
  const key = typeof value === 'string' ? value.slice(0, 10) : localDateKey(new Date(value));
  const [year, month, day] = key.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(year, month - 1, day));
}

function formatTime(value) {
  if (!value) return '—';
  const [hours, minutes] = value.split(':').map(Number);
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, hours, minutes));
}

function initialForm() {
  const now = new Date();
  return {
    glucoseValue: '', date: localDateKey(now),
    time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    slot: mealSlots[0], notes: '',
  };
}

export default function Readings() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const loadReadings = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await api.get('/readings');
      setReadings(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setLoadError(error.response?.data?.message || 'Unable to load your readings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReadings(); }, [loadReadings]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submitReading(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    setSuccess('');
    try {
      await api.post('/readings', {
        ...form,
        glucoseValue: Number(form.glucoseValue),
        notes: form.notes.trim() || undefined,
      });
      setSuccess('Reading saved successfully.');
      setForm(initialForm());
      setFormOpen(false);
      await loadReadings();
    } catch (error) {
      setFormError(error.response?.data?.message || 'Unable to save this reading. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteReading(id) {
    try {
      await api.delete(`/readings/${id}`);
      setReadings((current) => current.filter((reading) => reading.id !== id));
      setSuccess('Reading deleted.');
    } catch (error) {
      setLoadError(error.response?.data?.message || 'Unable to delete this reading. Please try again.');
    }
  }

  return (
    <div className="app-shell">
      <Header />
      <div className="workspace">
        <Sidebar />
        <main className="dashboard-main readings-main">
          <div className="dashboard-heading">
            <div>
              <p className="eyebrow">YOUR HEALTH LOG</p>
              <h1>Glucose readings</h1>
              <p className="heading-subtitle">Record and review your glucose readings.</p>
            </div>
            <Button onClick={() => { setFormOpen((open) => !open); setFormError(''); }}>
              {formOpen ? 'Cancel' : '+ Add Reading'}
            </Button>
          </div>

          {success && <div className="dashboard-success" role="status">{success}</div>}
          {loadError && <div className="error-banner" role="alert"><span>{loadError}</span><Button variant="quiet" onClick={loadReadings}>Try again</Button></div>}

          {formOpen && (
            <Card className="reading-form-card">
              <div className="section-heading"><div><p className="eyebrow">NEW ENTRY</p><h2>Add a reading</h2></div></div>
              {formError && <div className="error-banner" role="alert">{formError}</div>}
              <form className="reading-form" onSubmit={submitReading}>
                <label className="reading-field">
                  <span>Glucose value <small>(mg/dL)</small></span>
                  <input name="glucoseValue" type="number" min="1" max="600" step="1" inputMode="numeric" placeholder="e.g. 110" value={form.glucoseValue} onChange={updateField} required disabled={saving} />
                </label>
                <label className="reading-field">
                  <span>Date</span>
                  <input name="date" type="date" max={localDateKey()} value={form.date} onChange={updateField} required disabled={saving} />
                </label>
                <label className="reading-field">
                  <span>Time</span>
                  <input name="time" type="time" value={form.time} onChange={updateField} required disabled={saving} />
                </label>
                <label className="reading-field">
                  <span>Meal slot</span>
                  <select name="slot" value={form.slot} onChange={updateField} required disabled={saving}>
                    {mealSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                  </select>
                </label>
                <label className="reading-field reading-field--wide">
                  <span>Notes <small>(optional)</small></span>
                  <textarea name="notes" rows="3" maxLength="500" placeholder="Add any context for this reading" value={form.notes} onChange={updateField} disabled={saving} />
                </label>
                <div className="reading-form-actions">
                  <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Reading'}</Button>
                  <span>Notes are optional and limited to 500 characters.</span>
                </div>
              </form>
            </Card>
          )}

          <Card className="readings-card readings-list-card">
            <div className="section-heading">
              <div><p className="eyebrow">YOUR LOG</p><h2>All readings</h2></div>
              <span className="readings-count">{loading ? 'Loading…' : `${readings.length} ${readings.length === 1 ? 'reading' : 'readings'}`}</span>
            </div>
            {loading ? <div className="table-state" role="status">Loading your readings…</div>
              : loadError ? <div className="table-state">Your readings couldn’t be loaded.</div>
                : readings.length === 0 ? (
                  <div className="empty-state"><span className="empty-icon" aria-hidden="true">◷</span><h3>No readings yet</h3><p>Add your first glucose reading to start your log.</p></div>
                ) : (
                  <div className="table-wrap">
                    <table className="readings-table">
                      <thead><tr><th>Glucose</th><th>Date</th><th>Time</th><th>Meal slot</th><th>Notes</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
                      <tbody>{readings.map((reading) => (
                        <tr key={reading.id}>
                          <td data-label="Glucose"><span className="reading-value">{reading.glucoseValue}<small>mg/dL</small></span></td>
                          <td data-label="Date">{formatDate(reading.date)}</td>
                          <td data-label="Time">{formatTime(reading.time)}</td>
                          <td data-label="Meal slot"><span className="slot-pill">{reading.slot}</span></td>
                          <td data-label="Notes" className="reading-notes">{reading.notes || '—'}</td>
                          <td className="reading-actions"><button type="button" className="delete-reading" onClick={() => deleteReading(reading.id)} aria-label={`Delete reading ${reading.glucoseValue} mg/dL`}>Delete</button></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
          </Card>
          <footer className="dashboard-footer">Your readings are private and visible only to you.</footer>
        </main>
      </div>
    </div>
  );
}
