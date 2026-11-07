import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import Header from '../components/layout/Header.jsx';
import Sidebar from '../components/layout/Sidebar.jsx';
import GlucoseTrendChart from '../components/reports/GlucoseTrendChart.jsx';
import './Dashboard.css';
import './Reports.css';

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(value) {
  if (!value) return '—';
  const key = typeof value === 'string' ? value.slice(0, 10) : localDateKey(new Date(value));
  const [year, month, day] = key.split('-').map(Number);
  if (!year || !month || !day) return String(value);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(year, month - 1, day));
}

function formatTime(value) {
  if (!value) return '—';
  const [hours, minutes] = value.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return String(value);
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, hours, minutes));
}

const mealSlotIcons = {
  'Before Breakfast': '🍳',
  'After Breakfast': '🥞',
  'Before Lunch': '🥗',
  'After Lunch': '🍲',
  'Before Dinner': '🍽️',
  'After Dinner': '🍵',
  'Bedtime': '🌙',
  'Morning': '🌅',
};

function getSlotIcon(slot) {
  return mealSlotIcons[slot] || '🩺';
}

function getRangeDates(preset) {
  const now = new Date();
  const today = localDateKey(now);

  if (preset === '7d') {
    const past = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    return { start: localDateKey(past), end: today };
  }
  if (preset === '30d') {
    const past = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    return { start: localDateKey(past), end: today };
  }
  if (preset === '3m') {
    const past = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    return { start: localDateKey(past), end: today };
  }
  return { start: today, end: today };
}

export default function Reports() {
  const [activePreset, setActivePreset] = useState('7d');
  const today = useMemo(() => localDateKey(), []);

  const initialRange = useMemo(() => getRangeDates('7d'), []);
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);

  const [customStart, setCustomStart] = useState(initialRange.start);
  const [customEnd, setCustomEnd] = useState(initialRange.end);

  const [reportData, setReportData] = useState({
    summary: { average: null, highest: null, lowest: null, totalReadings: 0 },
    mealAnalysis: [],
    readings: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function selectPreset(preset) {
    setActivePreset(preset);
    setError('');
    if (preset !== 'custom') {
      const dates = getRangeDates(preset);
      setStartDate(dates.start);
      setEndDate(dates.end);
      setCustomStart(dates.start);
      setCustomEnd(dates.end);
    }
  }

  function handleCustomDateApply(e) {
    if (e) e.preventDefault();
    if (!customStart || !customEnd) {
      setError('Please choose both start and end dates.');
      return;
    }
    if (customStart > customEnd) {
      setError('Start date cannot be after end date.');
      return;
    }
    if (customEnd > today) {
      setError('Future dates are not allowed.');
      return;
    }
    setError('');
    setStartDate(customStart);
    setEndDate(customEnd);
  }

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      try {
        const response = await api.get('/reports/range', {
          params: { startDate, endDate },
        });
        if (response.data && response.data.summary) {
          setReportData(response.data);
          return;
        }
      } catch (rangeErr) {
        if (rangeErr.response?.status !== 404) {
          throw rangeErr;
        }
      }

      const allReadingsRes = await api.get('/readings');
      const allReadings = Array.isArray(allReadingsRes.data) ? allReadingsRes.data : [];

      const filtered = allReadings.filter((item) => {
        const dateKey = typeof item.date === 'string' ? item.date.slice(0, 10) : '';
        return dateKey >= startDate && dateKey <= endDate;
      });

      if (filtered.length === 0) {
        setReportData({
          summary: { average: null, highest: null, lowest: null, totalReadings: 0 },
          mealAnalysis: [],
          readings: [],
        });
        return;
      }

      const values = filtered.map((r) => r.glucoseValue);
      const total = values.length;
      const sum = values.reduce((acc, v) => acc + v, 0);
      const average = Number((sum / total).toFixed(1));
      const highest = Math.max(...values);
      const lowest = Math.min(...values);

      const slotMap = new Map();
      for (const item of filtered) {
        const slot = item.slot || 'Other';
        if (!slotMap.has(slot)) {
          slotMap.set(slot, { slot, count: 0, sum: 0, highest: item.glucoseValue, lowest: item.glucoseValue });
        }
        const stat = slotMap.get(slot);
        stat.count += 1;
        stat.sum += item.glucoseValue;
        stat.highest = Math.max(stat.highest, item.glucoseValue);
        stat.lowest = Math.min(stat.lowest, item.glucoseValue);
      }

      const mealAnalysis = Array.from(slotMap.values()).map((stat) => ({
        slot: stat.slot,
        average: Number((stat.sum / stat.count).toFixed(1)),
        count: stat.count,
        highest: stat.highest,
        lowest: stat.lowest,
      }));

      const sortedAsc = [...filtered].sort((a, b) => {
        const dateA = typeof a.date === 'string' ? a.date.slice(0, 10) : '';
        const dateB = typeof b.date === 'string' ? b.date.slice(0, 10) : '';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return (a.time || '').localeCompare(b.time || '');
      });

      setReportData({
        summary: { average, highest, lowest, totalReadings: total },
        mealAnalysis,
        readings: sortedAsc,
      });
    } catch (err) {
      console.error('Failed to load report:', err);
      setError(err.response?.data?.message || 'Unable to generate report for this date range. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const summary = reportData.summary;
  const readingsDesc = useMemo(() => {
    return [...reportData.readings].reverse();
  }, [reportData.readings]);

  return (
    <div className="app-shell">
      <Header />
      <div className="workspace">
        <Sidebar />
        <main className="dashboard-main reports-main">
          <div className="reports-heading">
            <div className="reports-heading-left">
              <p className="eyebrow">REPORTS & ANALYTICS</p>
              <h1>Glucose Insights</h1>
              <p className="heading-subtitle">Track trends, meal-time variations, and historical metrics.</p>
            </div>
            <div className="range-chip">
              <span className="range-chip-dot" />
              <span>{formatDate(startDate)} – {formatDate(endDate)}</span>
            </div>
          </div>
          <div className="reports-filter-bar">
            <div className="preset-filters" role="tablist" aria-label="Date range presets">
              <button
                type="button"
                className={`filter-pill ${activePreset === '7d' ? 'is-active' : ''}`}
                onClick={() => selectPreset('7d')}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                className={`filter-pill ${activePreset === '30d' ? 'is-active' : ''}`}
                onClick={() => selectPreset('30d')}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                className={`filter-pill ${activePreset === '3m' ? 'is-active' : ''}`}
                onClick={() => selectPreset('3m')}
              >
                Last 3 Months
              </button>
              <button
                type="button"
                className={`filter-pill ${activePreset === 'custom' ? 'is-active' : ''}`}
                onClick={() => selectPreset('custom')}
              >
                Custom Range
              </button>
            </div>

            {activePreset === 'custom' && (
              <form className="custom-range-inputs" onSubmit={handleCustomDateApply}>
                <label className="date-input-group">
                  <span>From:</span>
                  <input
                    type="date"
                    max={today}
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    required
                  />
                </label>
                <label className="date-input-group">
                  <span>To:</span>
                  <input
                    type="date"
                    min={customStart}
                    max={today}
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    required
                  />
                </label>
                <Button type="submit" variant="primary" style={{ padding: '6px 12px', fontSize: '11px' }}>
                  Apply
                </Button>
              </form>
            )}
          </div>
          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <Button variant="quiet" onClick={fetchReport}>Try again</Button>
            </div>
          )}
          <section className="metric-grid" aria-label="Date range glucose summary">
            <Card className="metric-card">
              <div className="metric-topline">
                <span className="metric-label">Average glucose</span>
                <span className="metric-icon metric-icon--violet" aria-hidden="true">◉</span>
              </div>
              {loading ? (
                <div className="skeleton-value" aria-label="Loading" />
              ) : (
                <div className="metric-value">
                  {summary.average !== null ? summary.average : '—'}
                  <span>{summary.average !== null ? ' mg/dL' : ''}</span>
                </div>
              )}
              <p className="metric-footnote">For selected range</p>
            </Card>

            <Card className="metric-card">
              <div className="metric-topline">
                <span className="metric-label">Highest glucose</span>
                <span className="metric-icon metric-icon--rose" aria-hidden="true">↗</span>
              </div>
              {loading ? (
                <div className="skeleton-value" aria-label="Loading" />
              ) : (
                <div className="metric-value">
                  {summary.highest !== null ? summary.highest : '—'}
                  <span>{summary.highest !== null ? ' mg/dL' : ''}</span>
                </div>
              )}
              <p className="metric-footnote">Peak reading</p>
            </Card>

            <Card className="metric-card">
              <div className="metric-topline">
                <span className="metric-label">Lowest glucose</span>
                <span className="metric-icon metric-icon--blue" aria-hidden="true">↘</span>
              </div>
              {loading ? (
                <div className="skeleton-value" aria-label="Loading" />
              ) : (
                <div className="metric-value">
                  {summary.lowest !== null ? summary.lowest : '—'}
                  <span>{summary.lowest !== null ? ' mg/dL' : ''}</span>
                </div>
              )}
              <p className="metric-footnote">Lowest reading</p>
            </Card>

            <Card className="metric-card">
              <div className="metric-topline">
                <span className="metric-label">Total readings</span>
                <span className="metric-icon metric-icon--green" aria-hidden="true">▤</span>
              </div>
              {loading ? (
                <div className="skeleton-value" aria-label="Loading" />
              ) : (
                <div className="metric-value">
                  {summary.totalReadings}
                </div>
              )}
              <p className="metric-footnote">Recorded in period</p>
            </Card>
          </section>
          <Card className="chart-card">
            <div className="chart-header">
              <div>
                <p className="eyebrow">GLUCOSE OVER TIME</p>
                <h2>Trend chart</h2>
              </div>
              <div className="chart-legend">
                <span className="legend-item">
                  <span className="legend-swatch legend-swatch--line" />
                  Glucose reading
                </span>
                <span className="legend-item">
                  <span className="legend-swatch legend-swatch--target" />
                  Target range (70–140 mg/dL)
                </span>
              </div>
            </div>

            {loading ? (
              <div className="skeleton-chart" aria-label="Loading chart" />
            ) : (
              <GlucoseTrendChart readings={reportData.readings} />
            )}
          </Card>
          <Card className="meal-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">BY MEAL SLOT</p>
                <h2>Meal-wise analysis</h2>
              </div>
              <span className="readings-count">
                {reportData.mealAnalysis.length > 0 ? `${reportData.mealAnalysis.length} slots recorded` : ''}
              </span>
            </div>

            {loading ? (
              <div className="meal-grid">
                <div className="skeleton-tile" />
                <div className="skeleton-tile" />
                <div className="skeleton-tile" />
              </div>
            ) : reportData.mealAnalysis.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true">🥗</span>
                <h3>No meal data</h3>
                <p>No readings with meal slots found for this period.</p>
              </div>
            ) : (
              <div className="meal-grid">
                {reportData.mealAnalysis.map((item) => (
                  <div key={item.slot} className="meal-tile">
                    <div className="meal-tile-top">
                      <span className="meal-tile-slot">
                        <span aria-hidden="true">{getSlotIcon(item.slot)}</span>
                        {item.slot}
                      </span>
                      <span className="meal-tile-count">
                        {item.count} {item.count === 1 ? 'reading' : 'readings'}
                      </span>
                    </div>
                    <div className="meal-tile-val">
                      {item.average}
                      <small>mg/dL avg</small>
                    </div>
                    <div className="meal-tile-range">
                      <span>Min: {item.lowest} mg/dL</span>
                      <span>Max: {item.highest} mg/dL</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card className="readings-card history-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">DATA LOG</p>
                <h2>Reading history</h2>
              </div>
              <span className="readings-count">
                {loading ? 'Loading…' : `${readingsDesc.length} in range`}
              </span>
            </div>

            {loading ? (
              <div className="table-state" role="status">Loading history…</div>
            ) : readingsDesc.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true">◷</span>
                <h3>No readings in range</h3>
                <p>Try expanding your date filter to view past records.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="readings-table">
                  <thead>
                    <tr>
                      <th>Glucose</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Meal slot</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readingsDesc.map((reading) => (
                      <tr key={reading.id}>
                        <td data-label="Glucose">
                          <span className="reading-value">{reading.glucoseValue}<small>mg/dL</small></span>
                        </td>
                        <td data-label="Date">{formatDate(reading.date)}</td>
                        <td data-label="Time">{formatTime(reading.time)}</td>
                        <td data-label="Meal slot">
                          <span className="slot-pill">{reading.slot}</span>
                        </td>
                        <td data-label="Notes" className="reading-notes">{reading.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
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
