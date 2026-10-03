import React from "react";

function ConfusionMatrix({ metrics }) {
  if (!metrics?.confusion_matrix) {
    return (
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Confusion Matrix</h2>
            <p>Model classification results</p>
          </div>
        </div>

        <div className="empty-state">
          Confusion matrix data unavailable
        </div>
      </div>
    );
  }

  const {
    true_negative,
    false_positive,
    false_negative,
    true_positive,
  } = metrics.confusion_matrix;

  return (
    <div className="panel confusion-panel">
      <div className="panel-header">
        <div>
          <h2>Confusion Matrix</h2>
          <p>Random Forest test-set classification</p>
        </div>

        <span className="detail-badge">TEST SET</span>
      </div>

      <div className="confusion-matrix">
        <div className="matrix-axis"></div>

        <div className="matrix-label">Predicted BENIGN</div>
        <div className="matrix-label">Predicted ANOMALY</div>

        <div className="matrix-label vertical">
          Actual BENIGN
        </div>

        <div className="matrix-cell true">
          <span>{true_negative.toLocaleString()}</span>
          <small>True Negative</small>
        </div>

        <div className="matrix-cell false">
          <span>{false_positive.toLocaleString()}</span>
          <small>False Positive</small>
        </div>

        <div className="matrix-label vertical">
          Actual ANOMALY
        </div>

        <div className="matrix-cell false">
          <span>{false_negative.toLocaleString()}</span>
          <small>False Negative</small>
        </div>

        <div className="matrix-cell true">
          <span>{true_positive.toLocaleString()}</span>
          <small>True Positive</small>
        </div>
      </div>

      <div className="matrix-summary">
        <div>
          <span>Test Samples</span>
          <strong>{metrics.test_samples.toLocaleString()}</strong>
        </div>

        <div>
          <span>Accuracy</span>
          <strong>{(metrics.accuracy * 100).toFixed(2)}%</strong>
        </div>
      </div>
    </div>
  );
}

export default ConfusionMatrix;