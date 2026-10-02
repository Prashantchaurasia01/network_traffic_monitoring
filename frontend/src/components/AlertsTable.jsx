import React, { useState, useMemo } from "react";
import StatusBadge from "./StatusBadge";

// Baseline benchmark reference events from CICIDS2017 capture windows
const BASELINE_SECURITY_EVENTS = [
  {
    id: "evt-01",
    time: "14:22:15",
    type: "ANOMALY",
    source: "CICIDS2017: DDoS LOIC UDP Flood",
    severity: "CRITICAL",
    status: "Mitigated",
    confidence: 0.998
  },
  {
    id: "evt-02",
    time: "13:50:08",
    type: "ANOMALY",
    source: "CICIDS2017: DoS Hulk Flow Burst",
    severity: "HIGH",
    status: "Flagged",
    confidence: 0.994
  },
  {
    id: "evt-03",
    time: "13:12:44",
    type: "BENIGN",
    source: "CICIDS2017: Standard HTTPS Egress",
    severity: "LOW",
    status: "Normal",
    confidence: 0.999
  },
  {
    id: "evt-04",
    time: "12:41:20",
    type: "ANOMALY",
    source: "CICIDS2017: PortScan SYN Sweep",
    severity: "MEDIUM",
    status: "Flagged",
    confidence: 0.978
  },
  {
    id: "evt-05",
    time: "12:15:02",
    type: "BENIGN",
    source: "CICIDS2017: DNS Query Resolution",
    severity: "LOW",
    status: "Normal",
    confidence: 0.996
  }
];

export function AlertsTable({ liveEvents = [] }) {
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Merge live events (from test runs) ahead of benchmark baseline records
  const allEvents = useMemo(() => {
    return [...liveEvents, ...BASELINE_SECURITY_EVENTS];
  }, [liveEvents]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((item) => {
      if (filter === "ANOMALY" && item.type !== "ANOMALY") return false;
      if (filter === "BENIGN" && item.type !== "BENIGN") return false;
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        return (
          item.source.toLowerCase().includes(query) ||
          item.status.toLowerCase().includes(query) ||
          item.severity.toLowerCase().includes(query) ||
          item.time.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [allEvents, filter, searchQuery]);

  return (
    <div className="soc-panel soc-alerts-panel">
      <div className="soc-panel-header">
        <div>
          <div className="soc-panel-title-row">
            <h2>Recent Security Events & Classifications</h2>
            <span className="soc-tag-mono">Audit Log</span>
          </div>
          <p className="soc-panel-subtitle">
            Chronological audit of inspected traffic sessions and algorithmic threat detections
          </p>
        </div>

        <div className="soc-table-actions">
          <div className="soc-filter-pills">
            {["ALL", "ANOMALY", "BENIGN"].map((mode) => (
              <button
                key={mode}
                className={`soc-filter-btn ${filter === mode ? "active" : ""}`}
                onClick={() => setFilter(mode)}
              >
                {mode === "ALL" ? `All (${allEvents.length})` : mode}
              </button>
            ))}
          </div>

          <div className="soc-search-wrap">
            <input
              type="text"
              placeholder="Filter events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="soc-search-input font-mono"
            />
          </div>
        </div>
      </div>

      <div className="soc-table-container">
        <table className="soc-table">
          <thead>
            <tr>
              <th style={{ width: "110px" }}>Timestamp</th>
              <th style={{ width: "130px" }}>Classification</th>
              <th>Traffic Source / Vector</th>
              <th style={{ width: "110px" }}>Severity</th>
              <th style={{ width: "120px" }}>Confidence</th>
              <th style={{ width: "110px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan="6" className="soc-table-empty">
                  No matching security events found.
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt, idx) => {
                const isNew = idx < liveEvents.length;
                return (
                  <tr key={evt.id || idx} className={isNew ? "row-live-highlight" : ""}>
                    <td className="font-mono text-muted">
                      {isNew && <span className="live-dot" title="Live test result" />}
                      {evt.time}
                    </td>

                    <td>
                      <StatusBadge status={evt.type} />
                    </td>

                    <td className="font-mono soc-table-source">
                      {evt.source}
                    </td>

                    <td>
                      <StatusBadge status={evt.severity} />
                    </td>

                    <td className="font-mono">
                      {(evt.confidence * 100).toFixed(1)}%
                    </td>

                    <td className="font-mono text-secondary">
                      {evt.status}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="soc-table-footer">
        <span>Showing {filteredEvents.length} of {allEvents.length} events</span>
        <span className="font-mono text-muted">Engine: Random Forest Classifier</span>
      </div>
    </div>
  );
}

export default AlertsTable;
