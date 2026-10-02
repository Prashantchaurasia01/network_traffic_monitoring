import React from "react";

export function ProtocolDistribution({ totalFlows = 2520798 }) {
  const protocols = [
    {
      name: "TCP",
      percentage: 68.0,
      flows: Math.round(totalFlows * 0.68),
      colorClass: "proto-tcp",
      description: "HTTP, HTTPS, SSH, TLS"
    },
    {
      name: "UDP",
      percentage: 21.0,
      flows: Math.round(totalFlows * 0.21),
      colorClass: "proto-udp",
      description: "DNS, NTP, SNMP, QUIC"
    },
    {
      name: "ICMP",
      percentage: 7.0,
      flows: Math.round(totalFlows * 0.07),
      colorClass: "proto-icmp",
      description: "Echo Ping, TTL Exceeded"
    },
    {
      name: "Other",
      percentage: 4.0,
      flows: Math.round(totalFlows * 0.04),
      colorClass: "proto-other",
      description: "IGMP, GRE, IPSec, Raw"
    }
  ];

  return (
    <div className="soc-panel soc-protocol-panel">
      <div className="soc-panel-header">
        <div>
          <h2>Protocol Composition</h2>
          <p className="soc-panel-subtitle">Distribution across evaluated network sessions</p>
        </div>
      </div>

      {/* Segmented Distribution Bar */}
      <div className="soc-proto-bar" role="img" aria-label="Protocol Distribution Segmented Bar">
        {protocols.map((proto) => (
          <div
            key={proto.name}
            className={`soc-proto-segment ${proto.colorClass}`}
            style={{ width: `${proto.percentage}%` }}
            title={`${proto.name}: ${proto.percentage}% (${proto.flows.toLocaleString()} flows)`}
          />
        ))}
      </div>

      {/* List breakdown */}
      <div className="soc-proto-list">
        {protocols.map((proto) => (
          <div key={proto.name} className="soc-proto-row">
            <div className="soc-proto-identity">
              <span className={`soc-proto-swatch ${proto.colorClass}`} />
              <div className="soc-proto-text">
                <span className="soc-proto-name font-mono">{proto.name}</span>
                <span className="soc-proto-desc">{proto.description}</span>
              </div>
            </div>

            <div className="soc-proto-metrics">
              <span className="soc-proto-pct font-mono">{proto.percentage.toFixed(1)}%</span>
              <span className="soc-proto-count font-mono">{proto.flows.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProtocolDistribution;
