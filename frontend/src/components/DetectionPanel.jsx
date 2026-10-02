import React, { useState } from "react";
import StatusBadge from "./StatusBadge";

export function DetectionPanel({ onTestTraffic, prediction, isLoading, error, lastSampleData }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Format confidence percentage
  const confidencePct = prediction && typeof prediction.confidence === "number"
    ? (prediction.confidence * 100).toFixed(1)
    : null;

  const isAnomaly = prediction && prediction.label === "ANOMALY";
  const isBenign = prediction && prediction.label === "BENIGN";

  // Key discriminating features to display for security review
  const highlightedFeatureKeys = [
    "Flow Duration",
    "Total Fwd Packets",
    "Total Backward Packets",
    "Packet Length Mean",
    "Flow Bytes/s",
    "Flow Packets/s",
    "FIN Flag Count",
    "SYN Flag Count",
    "ACK Flag Count",
    "Init_Win_bytes_forward"
  ];

  return (
    <div className="soc-panel soc-detection-panel">
      <div className="soc-panel-header">
        <div>
          <div className="soc-panel-title-row">
            <h2>Traffic Anomaly Detection Console</h2>
            <span className="soc-tag-mono">Real-Time Flow Classifier</span>
          </div>
          <p className="soc-panel-subtitle">
            Evaluate high-dimensional CICIDS2017 network flow vectors through the trained Random Forest model
          </p>
        </div>

        <div className="soc-detection-actions">
          <button
            className="soc-btn soc-btn-outline"
            onClick={() => onTestTraffic("benign")}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="btn-spinner" />
            ) : (
              <span className="btn-icon">▶</span>
            )}
            Test Benign Flow
          </button>

          <button
            className="soc-btn soc-btn-danger"
            onClick={() => onTestTraffic("anomaly")}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="btn-spinner" />
            ) : (
              <span className="btn-icon">⚡</span>
            )}
            Test Anomaly Flow
          </button>
        </div>
      </div>

      {/* Main Console Output */}
      <div className="soc-console-body">
        {isLoading && (
          <div className="soc-detection-state-box loading">
            <div className="soc-pulse-spinner" />
            <div className="soc-state-text">
              <span className="state-main font-mono">EXTRACTING 77 FLOW ATTRIBUTES...</span>
              <span className="state-sub">Running inference via Random Forest classifier</span>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="soc-detection-state-box error">
            <div className="soc-state-icon">⚠</div>
            <div className="soc-state-text">
              <span className="state-main">Inference Request Failed</span>
              <span className="state-sub font-mono">{error}</span>
            </div>
          </div>
        )}

        {!prediction && !isLoading && !error && (
          <div className="soc-detection-state-box empty">
            <div className="soc-empty-indicator">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div className="soc-state-text">
              <span className="state-main">Detection Engine Ready</span>
              <span className="state-sub">
                Select a benchmark traffic vector above to inspect flow behavior and test the ML classifier.
              </span>
            </div>
          </div>
        )}

        {prediction && !isLoading && !error && (
          <div className={`soc-detection-result ${isAnomaly ? "result-anomaly" : "result-benign"}`}>
            {/* Header / Banner of Result */}
            <div className="soc-result-banner">
              <div className="soc-result-headline">
                <div className="soc-result-type-badge">
                  <span className={`status-pill ${isAnomaly ? "pill-anomaly" : "pill-benign"}`} />
                  <span className="soc-result-label font-mono">
                    {prediction.label}
                  </span>
                </div>
                <span className="soc-result-summary">
                  {isAnomaly 
                    ? "Suspicious pattern matched against intrusion attack signature"
                    : "Traffic profile matches baseline non-adversarial characteristics"}
                </span>
              </div>

              <div className="soc-result-confidence-block">
                <div className="soc-conf-label">
                  <span>Confidence Score</span>
                  <span className="font-mono font-bold">{confidencePct}%</span>
                </div>
                <div className="soc-conf-track">
                  <div 
                    className={`soc-conf-bar ${isAnomaly ? "bar-red" : "bar-green"}`} 
                    style={{ width: `${confidencePct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Technical Verification Grid */}
            <div className="soc-result-metrics-grid">
              <div className="soc-metric-cell">
                <span className="cell-label">Classification Status</span>
                <span className="cell-value font-mono">
                  {isAnomaly ? "Detected" : "Normal"}
                </span>
              </div>

              <div className="soc-metric-cell">
                <span className="cell-label">Evaluated Model</span>
                <span className="cell-value font-mono">Random Forest (100 Trees)</span>
              </div>

              <div className="soc-metric-cell">
                <span className="cell-label">Flow Input Vector</span>
                <span className="cell-value font-mono">
                  {prediction.sample_type ? `Demo ${prediction.sample_type.toUpperCase()}` : "Evaluated Sample"}
                </span>
              </div>

              <div className="soc-metric-cell">
                <span className="cell-label">Analyzed Dimensions</span>
                <span className="cell-value font-mono">77 CICIDS2017 Features</span>
              </div>
            </div>

            {/* Feature Inspector */}
            {lastSampleData && (
              <div className="soc-feature-inspection">
                <div className="soc-inspection-tabs">
                  <button 
                    className={`soc-subtab ${activeTab === "overview" ? "active" : ""}`}
                    onClick={() => setActiveTab("overview")}
                  >
                    Key Discriminative Features
                  </button>
                  <button 
                    className={`soc-subtab ${activeTab === "raw" ? "active" : ""}`}
                    onClick={() => setActiveTab("raw")}
                  >
                    Raw Feature Payload (77)
                  </button>
                </div>

                {activeTab === "overview" && (
                  <div className="soc-features-grid">
                    {highlightedFeatureKeys.map((key) => {
                      const val = lastSampleData[key];
                      const formatted = typeof val === "number" 
                        ? Number.isInteger(val) ? val.toLocaleString() : val.toFixed(2)
                        : (val ?? "N/A");
                      return (
                        <div key={key} className="soc-feature-item">
                          <span className="feature-key">{key}</span>
                          <span className="feature-val font-mono">{formatted}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === "raw" && (
                  <pre className="soc-json-dump font-mono">
                    {JSON.stringify(lastSampleData, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DetectionPanel;
