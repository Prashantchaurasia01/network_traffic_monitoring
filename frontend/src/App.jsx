import { useEffect, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;
function App() {
  const [backendStatus, setBackendStatus] = useState("CHECKING");

  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);

  const [predictionHistory, setPredictionHistory] = useState([]);

  const [dashboardStats, setDashboardStats] = useState({
    total_flows: 0,
    benign_flows: 0,
    anomaly_flows: 0,
  });

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "online") {
          setBackendStatus("ONLINE");
        } else {
          setBackendStatus("OFFLINE");
        }
      })
      .catch(() => {
        setBackendStatus("OFFLINE");
      });
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/stats`)
      .then((response) => response.json())
      .then((data) => {
        setDashboardStats(data);
      })
      .catch((error) => {
        console.error("Failed to load statistics:", error);
      });
  }, []);

  const stats = [
    {
      title: "Total Flows",
      value: dashboardStats.total_flows.toLocaleString(),
      subtitle: "Captured traffic flows",
    },
    {
      title: "Anomalies",
      value: dashboardStats.anomaly_flows.toLocaleString(),
      subtitle: "Suspicious flows detected",
    },
    {
      title: "Benign Traffic",
      value: dashboardStats.benign_flows.toLocaleString(),
      subtitle: "Normal flows",
    },
    {
      title: "Detection Rate",
      value: "99.6%",
      subtitle: "Current model performance",
    },
  ];

  const alerts = [

  ];

  const testTraffic = async (sampleType) => {
    try {
      setPredictionLoading(true);
      setPrediction(null);

      // Get a demo traffic sample
      const sampleResponse = await fetch(
        `${API_URL}/sample/${sampleType}`
      );

      const sampleData = await sampleResponse.json();

      // Send the 77 features to the ML prediction endpoint
      const predictionResponse = await fetch(
        `${API_URL}/predict`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sampleData.features),
        }
      );

      const result = await predictionResponse.json();

      setPrediction(result);
      setPredictionHistory((previous) => [
        {
          time: new Date().toLocaleTimeString(),
          type: result.label,
          sample: sampleType,
          confidence: result.confidence,
        },
        ...previous,
      ]);
    }
    catch (error) {
      console.error("Prediction failed:", error);
      setPrediction({
        error: "Prediction request failed",
      });
    } finally {
      setPredictionLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Network Traffic Monitor</h1>
          <p>Network Anomaly Detection Platform</p>
        </div>

        <div className="status">
          <span
            className={`status-dot ${backendStatus === "ONLINE" ? "online" : "offline"
              }`}
          ></span>

          Backend {backendStatus}
        </div>
      </header>

      <main className="dashboard">
        <section className="stats-grid">
          {stats.map((stat) => (
            <div className="stat-card" key={stat.title}>
              <h3>{stat.title}</h3>
              <div className="stat-value">{stat.value}</div>
              <p>{stat.subtitle}</p>
            </div>
          ))}
        </section>

        <section className="content-grid">
          <div className="panel traffic-panel">
            <div className="panel-header">
              <div>
                <h2>Traffic Activity</h2>
                <p>Network flows over time</p>
              </div>
              <span className="live-badge">LIVE</span>
            </div>

            <div className="chart-placeholder">
              <div className="chart-line"></div>
              <div className="chart-labels">
                <span>10:00</span>
                <span>10:30</span>
                <span>11:00</span>
                <span>11:30</span>
                <span>12:00</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Protocol Distribution</h2>
                <p>Current traffic breakdown</p>
              </div>
            </div>

            <div className="protocol-list">
              <div className="protocol">
                <div>
                  <span>TCP</span>
                  <strong>68%</strong>
                </div>
                <div className="progress">
                  <div className="progress-fill tcp"></div>
                </div>
              </div>

              <div className="protocol">
                <div>
                  <span>UDP</span>
                  <strong>21%</strong>
                </div>
                <div className="progress">
                  <div className="progress-fill udp"></div>
                </div>
              </div>

              <div className="protocol">
                <div>
                  <span>ICMP</span>
                  <strong>7%</strong>
                </div>
                <div className="progress">
                  <div className="progress-fill icmp"></div>
                </div>
              </div>

              <div className="protocol">
                <div>
                  <span>Other</span>
                  <strong>4%</strong>
                </div>
                <div className="progress">
                  <div className="progress-fill other"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Recent Security Alerts</h2>
              <p>Latest traffic classifications</p>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Detection</th>
                  <th>Source</th>
                  <th>Severity</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {predictionHistory.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      No predictions yet
                    </td>
                  </tr>
                ) : (
                  predictionHistory.map((item, index) => (
                    <tr key={index}>
                      <td>{item.time}</td>

                      <td>{item.type}</td>

                      <td>
                        Demo {item.sample}
                      </td>

                      <td>
                        <span
                          className={`severity ${item.type === "ANOMALY" ? "high" : "low"
                            }`}
                        >
                          {item.type === "ANOMALY" ? "High" : "Low"}
                        </span>
                      </td>

                      <td>
                        {item.type === "ANOMALY"
                          ? `Detected (${(item.confidence * 100).toFixed(1)}%)`
                          : `Benign (${(item.confidence * 100).toFixed(1)}%)`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel detection-panel">
          <div className="panel-header">
            <div>
              <h2>Traffic Detection</h2>
              <p>Test the Random Forest anomaly detection model</p>
            </div>
          </div>

          <div className="detection-controls">
            <button
              onClick={() => testTraffic("benign")}
              disabled={predictionLoading}
            >
              Test Benign Traffic
            </button>

            <button
              onClick={() => testTraffic("anomaly")}
              disabled={predictionLoading}
            >
              Test Anomaly Traffic
            </button>
          </div>

          {predictionLoading && (
            <div className="prediction-result">
              <h3>Analyzing traffic...</h3>
            </div>
          )}

          {prediction && !predictionLoading && (
            <div className="prediction-result">
              {prediction.error ? (
                <h3>{prediction.error}</h3>
              ) : (
                <>
                  <h3>
                    Prediction:{" "}
                    <strong>{prediction.label}</strong>
                  </h3>

                  <p>
                    Confidence:{" "}
                    <strong>
                      {(prediction.confidence * 100).toFixed(1)}%
                    </strong>
                  </p>
                </>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;