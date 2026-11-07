import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import Header from '../components/layout/Header.jsx';
import Sidebar from '../components/layout/Sidebar.jsx';
import './Dashboard.css';

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

const metrics = [
  { key: 'highest', label: "Today's highest", icon: '↗', tone: 'rose' },
  { key: 'lowest', label: "Today's lowest", icon: '↘', tone: 'blue' },
  { key: 'average', label: "Today's average", icon: '◉', tone: 'violet' },
  { key: 'totalReadings', label: 'Readings today', icon: '▤', tone: 'green', unit: '' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [summary, setSummary] = useState(null);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const today = localDateKey();

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dailyResponse, readingsResponse] = await Promise.all([
        api.get('/reports/daily', { params: { date: today } }),
        api.get('/readings'),
      ]);
      setSummary(dailyResponse.data);
      setReadings(Array.isArray(readingsResponse.data) ? readingsResponse.data.slice(0, 8) : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load your dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  useEffect(() => {
    document.body.classList.add('dashboard-no-scrollbar');
    return () => {
      document.body.classList.remove('dashboard-no-scrollbar');
    };
  }, []);

  return (
    <div className="app-shell dashboard-shell">
      <Header />
      <div className="workspace">
        <Sidebar />
        <main className="dashboard-main">
          <div className="dashboard-heading">
            <div>
              <p className="eyebrow">YOUR HEALTH OVERVIEW</p>
              <h1>Welcome back, {user?.name || 'there'} <span aria-hidden="true">✦</span></h1>
              <p className="heading-subtitle">Here’s how your glucose tracking is looking today.</p>
            </div>
            <div className="today-chip"><span className="today-dot" /> Today · {formatDate(today)}</div>
          </div>

          {location.state?.notice && <div className="dashboard-success" role="status">{location.state.notice}</div>}
          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span><Button variant="quiet" onClick={loadDashboard}>Try again</Button>
            </div>
          )}

          <section className="metric-grid" aria-label="Today's glucose summary">
            {metrics.map((metric) => {
              const value = summary?.[metric.key];
              const hasValue = value !== null && value !== undefined;
              return (
                <Card key={metric.key} className="metric-card">
                  <div className="metric-topline">
                    <span className="metric-label">{metric.label}</span>
                    <span className={`metric-icon metric-icon--${metric.tone}`} aria-hidden="true">{metric.icon}</span>
                  </div>
                  {loading ? <div className="skeleton-value" aria-label="Loading" /> : (
                    <div className="metric-value">{hasValue ? value : '—'}<span>{hasValue ? (metric.unit ?? ' mg/dL') : ''}</span></div>
                  )}
                  <p className="metric-footnote">{metric.key === 'totalReadings' ? 'Recorded today' : 'For today'}</p>
                </Card>
              );
            })}
          </section>

          <Card className="readings-card">
            <div className="section-heading">
              <div><p className="eyebrow">YOUR LOG</p><h2>Recent readings</h2></div>
              <span className="readings-count">{loading ? ' ' : `${readings.length} shown`}</span>
            </div>
            {loading ? (
              <div className="table-state" role="status">Loading your readings…</div>
            ) : error ? (
              <div className="table-state">Your readings couldn’t be loaded.</div>
            ) : readings.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true">◷</span>
                <h3>No readings yet</h3>
                <p>Your glucose readings will appear here once you add them.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Date</th><th>Time</th><th>Reading slot</th><th>Glucose value</th></tr></thead>
                  <tbody>{readings.map((reading) => (
                    <tr key={reading.id}>
                      <td data-label="Date">{formatDate(reading.date)}</td>
                      <td data-label="Time">{formatTime(reading.time)}</td>
                      <td data-label="Reading slot"><span className="slot-pill">{reading.slot}</span></td>
                      <td data-label="Glucose value"><span className="reading-value">{reading.glucoseValue}<small>mg/dL</small></span></td>
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
