import React from "react";

export function StatCard({ title, value, subtitle, trend, tone = "default", detailBadge }) {
  let toneClass = "stat-card-default";
  if (tone === "green") toneClass = "stat-card-green";
  if (tone === "red") toneClass = "stat-card-red";
  if (tone === "blue") toneClass = "stat-card-blue";

  return (
    <div className={`soc-panel soc-stat-card ${toneClass}`}>
      <div className="soc-stat-header">
        <span className="soc-stat-title">{title}</span>
        {detailBadge && (
          <span className="soc-stat-badge font-mono">{detailBadge}</span>
        )}
      </div>

      <div className="soc-stat-body">
        <div className="soc-stat-value font-mono">{value}</div>
        {trend && (
          <div className="soc-stat-trend">
            <span className="soc-trend-indicator font-mono">{trend}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <div className="soc-stat-footer">
          <span className="soc-stat-subtitle">{subtitle}</span>
        </div>
      )}
    </div>
  );
}

export default StatCard;
