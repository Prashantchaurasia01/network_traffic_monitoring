import React from "react";

export function StatusBadge({ status, type = "status", size = "normal" }) {
  const normalized = (status || "").toLowerCase().trim();

  let badgeClass = "badge-neutral";
  let label = status;

  if (normalized === "online" || normalized === "loaded" || normalized === "normal" || normalized === "benign" || normalized === "low") {
    badgeClass = "badge-green";
  } else if (normalized === "warning" || normalized === "medium" || normalized === "checking") {
    badgeClass = "badge-amber";
  } else if (normalized === "anomaly" || normalized === "critical" || normalized === "high" || normalized === "offline" || normalized === "error") {
    badgeClass = "badge-red";
  } else if (normalized === "info" || normalized === "rf" || normalized === "cicids2017") {
    badgeClass = "badge-blue";
  }

  return (
    <span className={`soc-badge ${badgeClass} ${size === "small" ? "soc-badge-sm" : ""}`}>
      {type === "dot" && <span className="soc-dot" />}
      {label}
    </span>
  );
}

export default StatusBadge;
