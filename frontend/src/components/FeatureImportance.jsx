import React from "react";

function FeatureImportance({ metrics }) {
  const features = metrics?.top_features || [];

  return (
    <div className="panel feature-panel">
      <div className="panel-header">
        <div>
          <h2>Feature Importance</h2>
          <p>Top features used by the Random Forest model</p>
        </div>

        <span className="detail-badge">TOP FEATURES</span>
      </div>

      {features.length === 0 ? (
        <div className="empty-state">
          Feature importance data unavailable
        </div>
      ) : (
        <div className="feature-list">
          {features.map((item, index) => {
            const percentage = item.importance * 100;

            return (
              <div className="feature-row" key={item.feature}>
                <div className="feature-info">
                  <span className="feature-rank">
                    #{index + 1}
                  </span>

                  <span className="feature-name">
                    {item.feature}
                  </span>

                  <span className="feature-value">
                    {percentage.toFixed(2)}%
                  </span>
                </div>

                <div className="feature-bar">
                  <div
                    className="feature-bar-fill"
                    style={{
                      width: `${Math.min(percentage * 10, 100)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FeatureImportance;