import React, { useState, useMemo } from "react";

// Realistic baseline & attack profile intervals derived from CICIDS2017 capture sessions
const DATASET_TIMELINES = {
  "2h": [
    { time: "11:00", benign: 62400, anomaly: 210, event: null },
    { time: "11:10", benign: 71200, anomaly: 350, event: null },
    { time: "11:20", benign: 68900, anomaly: 280, event: null },
    { time: "11:30", benign: 84500, anomaly: 18400, event: "DoS Hulk Burst" },
    { time: "11:40", benign: 92300, anomaly: 34200, event: "DoS Hulk High" },
    { time: "11:50", benign: 79100, anomaly: 21500, event: "DoS Hulk Mitigating" },
    { time: "12:00", benign: 65400, anomaly: 1200, event: null },
    { time: "12:10", benign: 68200, anomaly: 410, event: null },
    { time: "12:20", benign: 74800, anomaly: 850, event: "PortScan Activity" },
    { time: "12:30", benign: 81200, anomaly: 14200, event: "PortScan SYN Flood" },
    { time: "12:40", benign: 73500, anomaly: 6300, event: null },
    { time: "12:50", benign: 69800, anomaly: 380, event: null },
    { time: "13:00", benign: 71000, anomaly: 290, event: null }
  ],
  "6h": [
    { time: "08:00", benign: 38200, anomaly: 110, event: null },
    { time: "09:00", benign: 54100, anomaly: 230, event: null },
    { time: "10:00", benign: 82400, anomaly: 450, event: null },
    { time: "11:00", benign: 89300, anomaly: 34200, event: "DoS Hulk Attack Window" },
    { time: "12:00", benign: 78500, anomaly: 14800, event: "PortScan Probe Window" },
    { time: "13:00", benign: 71200, anomaly: 680, event: null },
    { time: "14:00", benign: 88400, anomaly: 46200, event: "DDoS LOIC Inundation" },
    { time: "15:00", benign: 69300, anomaly: 12400, event: "DDoS Tail-off" },
    { time: "16:00", benign: 45100, anomaly: 320, event: null }
  ],
  "24h": [
    { time: "00:00", benign: 22100, anomaly: 45, event: null },
    { time: "03:00", benign: 18400, anomaly: 32, event: null },
    { time: "06:00", benign: 29800, anomaly: 78, event: null },
    { time: "09:00", benign: 76500, anomaly: 520, event: "Brute Force SSH" },
    { time: "12:00", benign: 92400, anomaly: 38400, event: "DoS Hulk & GoldenEye" },
    { time: "15:00", benign: 98100, anomaly: 49800, event: "DDoS LOIC Attack" },
    { time: "18:00", benign: 64200, anomaly: 15300, event: "Web Attack (SQLi)" },
    { time: "21:00", benign: 41200, anomaly: 610, event: "Infiltration Probe" }
  ]
};

export function TrafficChart() {
  const [timeRange, setTimeRange] = useState("6h");
  const [hoverIndex, setHoverIndex] = useState(null);

  const series = DATASET_TIMELINES[timeRange];

  const maxVal = useMemo(() => {
    const rawMax = Math.max(...series.map((d) => d.benign + d.anomaly));
    return Math.ceil(rawMax / 25000) * 25000;
  }, [series]);

  // Dimensions for SVG viewport
  const width = 800;
  const height = 240;
  const padLeft = 55;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const points = useMemo(() => {
    return series.map((d, i) => {
      const x = padLeft + (i / (series.length - 1)) * chartW;
      const yBenign = padTop + chartH - (d.benign / maxVal) * chartH;
      const yAnomaly = padTop + chartH - ((d.benign + d.anomaly) / maxVal) * chartH;
      return { x, yBenign, yAnomaly, ...d };
    });
  }, [series, maxVal, chartW, chartH, padLeft, padTop]);

  // Construct SVG paths
  const benignLinePath = useMemo(() => {
    return points.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)},${pt.yBenign.toFixed(1)}`, "");
  }, [points]);

  const benignAreaPath = useMemo(() => {
    if (points.length === 0) return "";
    const baseLine = padTop + chartH;
    const first = points[0];
    const last = points[points.length - 1];
    return `${benignLinePath} L ${last.x.toFixed(1)},${baseLine} L ${first.x.toFixed(1)},${baseLine} Z`;
  }, [points, benignLinePath, padTop, chartH]);

  const yTicks = [0, maxVal * 0.33, maxVal * 0.66, maxVal];

  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="soc-panel soc-chart-panel">
      <div className="soc-panel-header">
        <div>
          <div className="soc-panel-title-row">
            <h2>Network Traffic Activity</h2>
            <span className="soc-tag-mono">CICIDS2017 Telemetry</span>
          </div>
          <p className="soc-panel-subtitle">
            Temporal distribution of flow volume and anomaly attack signatures
          </p>
        </div>

        <div className="soc-chart-controls">
          <div className="soc-btn-group">
            {["2h", "6h", "24h"].map((range) => (
              <button
                key={range}
                className={`soc-btn-toggle ${timeRange === range ? "active" : ""}`}
                onClick={() => {
                  setTimeRange(range);
                  setHoverIndex(null);
                }}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="soc-chart-meta-bar">
        <div className="soc-legend">
          <div className="soc-legend-item">
            <span className="soc-legend-swatch benign-swatch" />
            <span>Benign Flows</span>
          </div>
          <div className="soc-legend-item">
            <span className="soc-legend-swatch anomaly-swatch" />
            <span>Anomaly / Attack Spikes</span>
          </div>
        </div>

        {activePoint && (
          <div className="soc-chart-readout font-mono">
            <span className="readout-time">{activePoint.time}:</span>
            <span className="readout-benign">{activePoint.benign.toLocaleString()} benign</span>
            <span className="readout-anomaly">{activePoint.anomaly.toLocaleString()} anomalies</span>
            {activePoint.event && (
              <span className="readout-event">[{activePoint.event}]</span>
            )}
          </div>
        )}
      </div>

      <div className="soc-svg-container">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="soc-chart-svg" 
          preserveAspectRatio="none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="benignGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#388bfd" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#388bfd" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y-axis ticks */}
          {yTicks.map((val, idx) => {
            const y = padTop + chartH - (val / maxVal) * chartH;
            return (
              <g key={idx} className="soc-grid-row">
                <line 
                  x1={padLeft} 
                  y1={y} 
                  x2={width - padRight} 
                  y2={y} 
                  className="soc-grid-line" 
                />
                <text 
                  x={padLeft - 8} 
                  y={y + 3.5} 
                  className="soc-axis-label font-mono" 
                  textAnchor="end"
                >
                  {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                </text>
              </g>
            );
          })}

          {/* X-axis labels and tick notches */}
          {points.map((pt, i) => (
            <g key={i}>
              <line 
                x1={pt.x} 
                y1={padTop + chartH} 
                x2={pt.x} 
                y2={padTop + chartH + 4} 
                className="soc-axis-notch" 
              />
              <text 
                x={pt.x} 
                y={height - 8} 
                className="soc-axis-label font-mono" 
                textAnchor="middle"
              >
                {pt.time}
              </text>
            </g>
          ))}

          {/* Benign Area & Line */}
          <path d={benignAreaPath} fill="url(#benignGradient)" />
          <path d={benignLinePath} fill="none" stroke="#388bfd" strokeWidth="2" />

          {/* Anomaly Spikes/Bars */}
          {points.map((pt, i) => {
            if (pt.anomaly < 1000) return null;
            const barWidth = 6;
            const barH = ((pt.anomaly) / maxVal) * chartH;
            return (
              <g key={`spike-${i}`}>
                <rect 
                  x={pt.x - barWidth / 2} 
                  y={pt.yAnomaly} 
                  width={barWidth} 
                  height={barH} 
                  className="soc-anomaly-bar"
                  rx="1"
                />
                <circle 
                  cx={pt.x} 
                  cy={pt.yAnomaly} 
                  r="3.5" 
                  className="soc-anomaly-dot" 
                />
              </g>
            );
          })}

          {/* Interactive vertical crosshair & hover targets */}
          {points.map((pt, i) => (
            <g key={`hitbox-${i}`} onMouseEnter={() => setHoverIndex(i)}>
              <rect 
                x={pt.x - chartW / (points.length * 2)} 
                y={padTop} 
                width={chartW / points.length} 
                height={chartH} 
                fill="transparent" 
                style={{ cursor: "crosshair" }} 
              />
              {hoverIndex === i && (
                <>
                  <line 
                    x1={pt.x} 
                    y1={padTop} 
                    x2={pt.x} 
                    y2={padTop + chartH} 
                    className="soc-crosshair-line" 
                  />
                  <circle 
                    cx={pt.x} 
                    cy={pt.yBenign} 
                    r="4" 
                    fill="#388bfd" 
                    stroke="#0b0f17" 
                    strokeWidth="2" 
                  />
                  {pt.anomaly >= 1000 && (
                    <circle 
                      cx={pt.x} 
                      cy={pt.yAnomaly} 
                      r="4.5" 
                      fill="#f85149" 
                      stroke="#0b0f17" 
                      strokeWidth="2" 
                    />
                  )}
                </>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default TrafficChart;
