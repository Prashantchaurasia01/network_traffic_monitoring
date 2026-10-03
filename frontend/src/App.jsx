import React, { useEffect, useState, useCallback } from "react";
import "./App.css";

import Header from "./components/Header";
import StatCard from "./components/StatCard";
import TrafficChart from "./components/TrafficChart";
import ProtocolDistribution from "./components/ProtocolDistribution";
import DetectionPanel from "./components/DetectionPanel";
import AlertsTable from "./components/AlertsTable";
import ModelInfo from "./components/ModelInfo";
import ConfusionMatrix from "./components/ConfusionMatrix";
import FeatureImportance from "./components/FeatureImportance";

// Preserve existing backend API URL resolution with resilient local fallback
const API_URL = import.meta.env.VITE_API_URL || "https://network-traffic-monitoring-0v26.onrender.com";

export function App() {
  const [backendStatus, setBackendStatus] = useState("CHECKING");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Model & System State
  const [modelInfo, setModelInfo] = useState({
    model: "Random Forest",
    status: "loaded",
    features: 77,
    feature_names: []
  });

  const [dashboardStats, setDashboardStats] = useState({
    total_flows: 2520798,
    benign_flows: 2095057,
    anomaly_flows: 425741,
    model: "Random Forest",
    model_status: "loaded"
  });

  // Inference & Detection Console State
  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState(null);
  const [lastSampleData, setLastSampleData] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(null);

  // Fetch model metrics
  const fetchModelMetrics = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/model-metrics`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setModelMetrics(data);
    } catch (err) {
      console.warn("Could not load /model-metrics from backend:", err);
    }
  }, []);

  // Real-time classification event history
  const [liveEvents, setLiveEvents] = useState([]);

  // Fetch health status
  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status === "online") {
        setBackendStatus("ONLINE");
      } else {
        setBackendStatus("OFFLINE");
      }
    } catch {
      setBackendStatus("OFFLINE");
    }
  }, []);

  // Fetch dataset statistics
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/stats`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDashboardStats(data);
    } catch (err) {
      console.warn("Could not load /stats from backend:", err);
    }
  }, []);

  // Fetch model specifications
  const fetchModelInfo = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/model-info`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setModelInfo(data);
    } catch (err) {
      console.warn("Could not load /model-info from backend:", err);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    fetchHealth();
    fetchStats();
    fetchModelInfo();
    fetchModelMetrics();
  }, [fetchHealth, fetchStats, fetchModelInfo, fetchModelMetrics]);

  // Periodic heartbeat poll
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHealth();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  // Manual refresh trigger
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchHealth(), fetchStats(), fetchModelInfo(), fetchModelMetrics()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Execute single-flow detection test
  const handleTestTraffic = async (sampleType) => {
    try {
      setPredictionLoading(true);
      setPredictionError(null);

      // 1. Fetch demo sample vector from backend
      const sampleResponse = await fetch(`${API_URL}/sample/${sampleType}`);
      if (!sampleResponse.ok) {
        throw new Error(`Failed to retrieve sample vector (${sampleResponse.status} ${sampleResponse.statusText})`);
      }
      const sampleData = await sampleResponse.json();

      if (sampleData.error) {
        throw new Error(sampleData.error);
      }

      setLastSampleData(sampleData.features);

      // 2. Submit extracted features to model prediction endpoint
      const predictionResponse = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sampleData.features),
      });

      if (!predictionResponse.ok) {
        throw new Error(`Inference engine rejected request (${predictionResponse.status} ${predictionResponse.statusText})`);
      }

      const result = await predictionResponse.json();

      if (result.error) {
        throw new Error(result.error);
      }

      const enrichedResult = {
        ...result,
        sample_type: sampleType
      };

      setPrediction(enrichedResult);

      // 3. Prepend security event to live audit log
      const newEvent = {
        id: `live-${Date.now()}`,
        time: new Date().toTimeString().slice(0, 8),
        type: enrichedResult.label,
        source: `Live Demo: ${sampleType.toUpperCase()} Vector`,
        severity: enrichedResult.label === "ANOMALY" ? "CRITICAL" : "LOW",
        status: enrichedResult.label === "ANOMALY" ? "Detected" : "Normal",
        confidence: enrichedResult.confidence,
      };

      setLiveEvents((prev) => [newEvent, ...prev]);
    } catch (err) {
      console.error("Prediction routine failed:", err);
      setPredictionError(err.message || "Connection to inference endpoint failed.");
    } finally {
      setPredictionLoading(false);
    }
  };

  // Derive metric ratios & stats
  const totalFlowsCount = dashboardStats.total_flows || 2520798;

  const stats = [
    {
      title: "Accuracy",
      value: modelMetrics
        ? `${(modelMetrics.accuracy * 100).toFixed(2)}%`
        : "--",
      subtitle: "Test-set accuracy",
      detailBadge: "MODEL",
      tone: "blue"
    },
    {
      title: "Precision",
      value: modelMetrics
        ? `${(modelMetrics.precision * 100).toFixed(2)}%`
        : "--",
      subtitle: "Anomaly precision",
      detailBadge: "PURITY",
      tone: "green"
    },
    {
      title: "Recall",
      value: modelMetrics
        ? `${(modelMetrics.recall * 100).toFixed(2)}%`
        : "--",
      subtitle: "Anomaly recall",
      detailBadge: "COVERAGE",
      tone: "red"
    },
    {
      title: "F1 Score",
      value: modelMetrics
        ? `${(modelMetrics.f1 * 100).toFixed(2)}%`
        : "--",
      subtitle: "Anomaly F1 score",
      detailBadge: "BALANCED",
      tone: "default"
    },
  ];

  return (
    <div className="soc-app">
      {/* Top Header */}
      <Header
        backendStatus={backendStatus}
        modelInfo={modelInfo}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Operations Dashboard */}
      <main className="soc-dashboard">
        {/* Section 1: Overview Metrics */}
        <section className="soc-stats-grid" aria-label="Operational Metrics">
          {stats.map((stat, idx) => (
            <StatCard
              key={idx}
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              detailBadge={stat.detailBadge}
              tone={stat.tone}
            />
          ))}
        </section>

        {/* Section 2 & 3: Traffic Monitoring & Composition */}
        <section className="soc-main-grid">
          <TrafficChart />
          <ProtocolDistribution totalFlows={totalFlowsCount} />
        </section>

        {/* Section 4: Detection Console */}
        <section>
          <DetectionPanel
            onTestTraffic={handleTestTraffic}
            prediction={prediction}
            isLoading={predictionLoading}
            error={predictionError}
            lastSampleData={lastSampleData}
          />
        </section>

        {modelMetrics && (
          <section className="model-performance-grid">
            <div className="performance-panel">
              <div className="panel-heading">
                <div>
                  <h2>Confusion Matrix</h2>
                  <p>Random Forest test-set classification</p>
                </div>
              </div>

              <div className="confusion-matrix">
                <div className="matrix-corner"></div>

                <div className="matrix-axis">
                  Predicted Benign
                </div>

                <div className="matrix-axis">
                  Predicted Anomaly
                </div>

                <div className="matrix-axis actual-label">
                  Actual Benign
                </div>

                <div className="matrix-cell true-negative">
                  <strong>
                    {modelMetrics.confusion_matrix.true_negative.toLocaleString()}
                  </strong>
                  <span>True Negative</span>
                </div>

                <div className="matrix-cell false-positive">
                  <strong>
                    {modelMetrics.confusion_matrix.false_positive.toLocaleString()}
                  </strong>
                  <span>False Positive</span>
                </div>

                <div className="matrix-axis actual-label">
                  Actual Anomaly
                </div>

                <div className="matrix-cell false-negative">
                  <strong>
                    {modelMetrics.confusion_matrix.false_negative.toLocaleString()}
                  </strong>
                  <span>False Negative</span>
                </div>

                <div className="matrix-cell true-positive">
                  <strong>
                    {modelMetrics.confusion_matrix.true_positive.toLocaleString()}
                  </strong>
                  <span>True Positive</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Section 5: Security Alerts & Incident Log */}
        <section>
          <AlertsTable liveEvents={liveEvents} />
        </section>

        {/* Section 6: Model Architecture & Telemetry */}
        <section className="soc-main-grid">
          <ConfusionMatrix metrics={modelMetrics} />
          <FeatureImportance metrics={modelMetrics} />
        </section>
        <section>
          <ModelInfo modelInfo={modelInfo} stats={dashboardStats} />
        </section>
      </main>
    </div>
  );
}

export default App;