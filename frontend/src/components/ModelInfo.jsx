import React from "react";
import StatusBadge from "./StatusBadge";

export function ModelInfo({ modelInfo, stats }) {
  const specs = [
    { label: "Model Architecture", value: modelInfo?.model || "Random Forest", mono: true },
    { label: "Inference Status", value: modelInfo?.status === "loaded" ? "Active / Loaded" : "Ready", badge: "loaded" },
    { label: "Input Features", value: `${modelInfo?.features || 77} Dimensions`, mono: true },
    { label: "Training Dataset", value: "CICIDS2017", mono: true },
    { label: "Classification Type", value: "Supervised Binary", mono: true },
    { label: "Target Classes", value: "0: BENIGN | 1: ANOMALY", mono: true },
    { label: "Evaluated Records", value: stats?.total_flows ? stats.total_flows.toLocaleString() : "2,520,798 flows", mono: true },
    { label: "Class Balance", value: "83.1% Benign / 16.9% Attack", mono: true }
  ];

  return (
    <div className="soc-panel soc-model-panel">
      <div className="soc-panel-header">
        <div>
          <div className="soc-panel-title-row">
            <h2>Model & Telemetry Specifications</h2>
            <span className="soc-tag-mono">FastAPI / Scikit-Learn</span>
          </div>
          <p className="soc-panel-subtitle">
            Algorithmic parameters and generalizable feature preprocessing constraints
          </p>
        </div>
      </div>

      <div className="soc-model-grid">
        {specs.map((item) => (
          <div key={item.label} className="soc-model-item">
            <span className="model-label">{item.label}</span>
            <div className="model-val-wrap">
              {item.badge ? (
                <StatusBadge status={item.badge} size="small" />
              ) : (
                <span className={`model-value ${item.mono ? "font-mono" : ""}`}>
                  {item.value}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="soc-model-note">
        <span className="note-title font-mono">FEATURE GENERALIZATION POLICY</span>
        <p className="note-body">
          To prevent the model from overfitting to specific host identities or temporal attack windows, 
          non-generalizable identifiers (<code>Source IP</code>, <code>Destination IP</code>, <code>Source Port</code>, 
          <code>Destination Port</code>, <code>Timestamp</code>, <code>Flow ID</code>) were explicitly omitted during feature preparation. 
          Classification evaluates statistical flow dynamics, packet length distributions, and TCP flag transitions.
        </p>
      </div>
    </div>
  );
}

export default ModelInfo;
