import { useId, useMemo, useState } from 'react';

function formatDateLabel(val) {
  if (!val) return '';
  const str = typeof val === 'string' ? val.slice(0, 10) : '';
  const [year, month, day] = str.split('-').map(Number);
  if (!year || !month || !day) return str;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(year, month - 1, day));
}

function formatTime(val) {
  if (!val) return '';
  const [hours, minutes] = val.split(':').map(Number);
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, hours, minutes));
}

function getGlucoseTone(value) {
  if (value < 70) return { tone: 'low', label: 'Low' };
  if (value <= 140) return { tone: 'normal', label: 'In target' };
  if (value <= 180) return { tone: 'elevated', label: 'Elevated' };
  return { tone: 'high', label: 'High' };
}

export default function GlucoseTrendChart({ readings = [] }) {
  const gradientId = useId();
  const [activeItem, setActiveItem] = useState(null);

  const chartData = useMemo(() => {
    if (!readings || readings.length === 0) return null;

    // Sort chronologically ascending
    const sorted = [...readings].sort((a, b) => {
      const dateA = typeof a.date === 'string' ? a.date.slice(0, 10) : '';
      const dateB = typeof b.date === 'string' ? b.date.slice(0, 10) : '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.time || '').localeCompare(b.time || '');
    });

    const values = sorted.map((r) => r.glucoseValue);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    // Determine Y axis bounds
    const yMin = Math.max(30, Math.floor((minVal - 20) / 20) * 20);
    const yMax = Math.min(600, Math.ceil((Math.max(maxVal, 160) + 20) / 20) * 20);

    const width = 800;
    const height = 280;
    const padding = { top: 25, right: 35, bottom: 45, left: 45 };

    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const getY = (val) => {
      const clamped = Math.max(yMin, Math.min(yMax, val));
      const ratio = (clamped - yMin) / (yMax - yMin);
      return padding.top + innerHeight - ratio * innerHeight;
    };

    const getX = (index, total) => {
      if (total <= 1) return padding.left + innerWidth / 2;
      return padding.left + (index / (total - 1)) * innerWidth;
    };

    const points = sorted.map((item, idx) => {
      const x = getX(idx, sorted.length);
      const y = getY(item.glucoseValue);
      return {
        x,
        y,
        raw: item,
        status: getGlucoseTone(item.glucoseValue),
      };
    });

    // Build SVG path strings
    let linePath = '';
    let areaPath = '';

    if (points.length === 1) {
      const p = points[0];
      linePath = `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y}`;
      areaPath = `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y} L ${p.x + 20} ${height - padding.bottom} L ${p.x - 20} ${height - padding.bottom} Z`;
    } else {
      linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      const firstX = points[0].x.toFixed(1);
      const lastX = points[points.length - 1].x.toFixed(1);
      const bottomY = (height - padding.bottom).toFixed(1);
      areaPath = `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
    }

    // Y Axis ticks (approx 4-5 ticks)
    const tickStep = (yMax - yMin) / 4;
    const yTicks = [0, 1, 2, 3, 4].map((i) => {
      const val = Math.round(yMin + i * tickStep);
      return { val, y: getY(val) };
    });

    // Target range rectangle Y coords (70 to 140 mg/dL)
    const targetYTop = getY(Math.min(yMax, 140));
    const targetYBottom = getY(Math.max(yMin, 70));
    const targetHeight = Math.max(0, targetYBottom - targetYTop);

    // X Axis ticks (spread out dates)
    const xTicks = [];
    const step = Math.max(1, Math.floor(points.length / 5));
    for (let i = 0; i < points.length; i += step) {
      xTicks.push(points[i]);
    }
    // Ensure the last point's date is included if not already
    if (xTicks[xTicks.length - 1] !== points[points.length - 1]) {
      xTicks.push(points[points.length - 1]);
    }

    return {
      width,
      height,
      padding,
      points,
      linePath,
      areaPath,
      yTicks,
      xTicks,
      targetYTop,
      targetHeight,
    };
  }, [readings]);

  if (!chartData) {
    return (
      <div className="empty-state">
        <span className="empty-icon" aria-hidden="true">📈</span>
        <h3>No trend data available</h3>
        <p>No glucose readings recorded for this date range.</p>
      </div>
    );
  }

  const { width, height, padding, points, linePath, areaPath, yTicks, xTicks, targetYTop, targetHeight } = chartData;

  return (
    <div className="chart-container">
      <svg
        className="trend-svg"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Glucose trend chart over selected time period"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5d997b" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#5d997b" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Target range background zone (70 - 140 mg/dL) */}
        {targetHeight > 0 && (
          <rect
            className="target-zone"
            x={padding.left}
            y={targetYTop}
            width={width - padding.left - padding.right}
            height={targetHeight}
          />
        )}

        {/* Target range boundary lines */}
        <line
          className="target-line"
          x1={padding.left}
          y1={targetYTop}
          x2={width - padding.right}
          y2={targetYTop}
        />
        <line
          className="target-line"
          x1={padding.left}
          y1={targetYTop + targetHeight}
          x2={width - padding.right}
          y2={targetYTop + targetHeight}
        />

        {/* Y Axis Grid Lines & Labels */}
        {yTicks.map(({ val, y }) => (
          <g key={val}>
            <line
              className="chart-grid-line"
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
            />
            <text
              className="chart-axis-text"
              x={padding.left - 8}
              y={y + 3}
              textAnchor="end"
            >
              {val}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path className="trend-area" d={areaPath} fill={`url(#${gradientId})`} />

        {/* Trend line */}
        <path className="trend-line" d={linePath} />

        {/* X Axis Labels */}
        {xTicks.map((pt, idx) => (
          <text
            key={idx}
            className="chart-axis-text"
            x={pt.x}
            y={height - 12}
            textAnchor="middle"
          >
            {formatDateLabel(pt.raw.date)}
          </text>
        ))}

        {/* Data points */}
        {points.map((pt, idx) => {
          const isSelected = activeItem?.raw.id === pt.raw.id;
          return (
            <g key={pt.raw.id || idx}>
              {/* Invisible larger hover target */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="16"
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setActiveItem(pt)}
                onMouseLeave={() => setActiveItem(null)}
                onClick={() => setActiveItem(pt)}
              />
              {/* Visible styled marker */}
              <circle
                className={`chart-point chart-point--${pt.status.tone} ${isSelected ? 'is-selected' : ''}`}
                cx={pt.x}
                cy={pt.y}
                r={isSelected ? 6.5 : 4.5}
                pointerEvents="none"
              />
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {activeItem && (
        <div
          className="chart-tooltip"
          style={{
            left: `${(activeItem.x / width) * 100}%`,
            top: `${(activeItem.y / height) * 100}%`,
          }}
          role="tooltip"
        >
          <div className="chart-tooltip-value">
            {activeItem.raw.glucoseValue} mg/dL
            <span className={`chart-tooltip-badge chart-tooltip-badge--${activeItem.status.tone}`}>
              {activeItem.status.label}
            </span>
          </div>
          <div className="chart-tooltip-meta">
            {formatDateLabel(activeItem.raw.date)} · {formatTime(activeItem.raw.time)} · {activeItem.raw.slot}
          </div>
          {activeItem.raw.notes && (
            <div className="chart-tooltip-meta" style={{ marginTop: '3px', fontStyle: 'italic', maxWidth: '180px', whiteSpace: 'normal' }}>
              “{activeItem.raw.notes}”
            </div>
          )}
        </div>
      )}
    </div>
  );
}
