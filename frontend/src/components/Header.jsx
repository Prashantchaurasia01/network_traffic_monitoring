import React, { useState, useEffect } from "react";
import StatusBadge from "./StatusBadge";

export function Header({ backendStatus, onRefresh, isRefreshing, modelInfo }) {
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString().slice(17, 25) + " UTC");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toUTCString().slice(17, 25) + " UTC");
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="soc-header">
      <div className="soc-header-brand">
        <div className="soc-brand-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
            <line x1="6" y1="6" x2="6.01" y2="6"></line>
            <line x1="6" y1="18" x2="6.01" y2="18"></line>
          </svg>
        </div>
        <div>
          <div className="soc-header-title-row">
            <h1>Network Traffic Monitor</h1>
            <span className="soc-version-tag">SOC Console v1.0</span>
          </div>
          <p className="soc-header-subtitle">Network Anomaly Detection Platform • CICIDS2017</p>
        </div>
      </div>

      <div className="soc-header-meta">
        <div className="soc-meta-item">
          <span className="soc-meta-label">Model Engine</span>
          <span className="soc-meta-value font-mono">
            {modelInfo?.model || "Random Forest"} (77f)
          </span>
        </div>

        <div className="soc-meta-separator" />

        <div className="soc-meta-item">
          <span className="soc-meta-label">System Time</span>
          <span className="soc-meta-value font-mono">{currentTime}</span>
        </div>

        <div className="soc-meta-separator" />

        <div className="soc-meta-item">
          <span className="soc-meta-label">Backend Link</span>
          <div className="soc-status-wrapper">
            <span className={`soc-indicator-dot dot-${backendStatus.toLowerCase()}`} />
            <span className="soc-status-text font-mono">
              {backendStatus}
            </span>
          </div>
        </div>

        <button 
          className="soc-btn soc-btn-ghost soc-btn-sm" 
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh telemetry"
          aria-label="Refresh telemetry"
        >
          <svg 
            className={isRefreshing ? "spin" : ""} 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </button>
      </div>
    </header>
  );
}

export default Header;
