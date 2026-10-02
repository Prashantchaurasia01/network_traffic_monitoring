import React, { useEffect, useState, useCallback } from "react";
import "./App.css";

import Header from "./components/Header";
import StatCard from "./components/StatCard";
import TrafficChart from "./components/TrafficChart";
import ProtocolDistribution from "./components/ProtocolDistribution";
import DetectionPanel from "./components/DetectionPanel";
import AlertsTable from "./components/AlertsTable";
import ModelInfo from "./components/ModelInfo";

// Preserve existing backend API URL resolution with resilient local fallback
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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
  }, [fetchHealth, fetchStats, fetchModelInfo]);

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
    await Promise.all([fetchHealth(), fetchStats(), fetchModelInfo()]);
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

  // Derive metric ratios
  const totalFlowsCount = dashboardStats.total_flows || 2520798;
  const benignRatio = totalFlowsCount > 0 
    ? ((dashboardStats.benign_flows / totalFlowsCount) * 100).toFixed(1)
    : "83.1";
  const anomalyRatio = totalFlowsCount > 0 
    ? ((dashboardStats.anomaly_flows / totalFlowsCount) * 100).toFixed(1)
    : "16.9";

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
          <StatCard
            title="Total Evaluated Flows"
            value={totalFlowsCount.toLocaleString()}
            subtitle="CICIDS2017 Benchmark Dataset"
            detailBadge="100% CAPTURE"
            tone="default"
          />

          <StatCard
            title="Benign Baseline"
            value={dashboardStats.benign_flows.toLocaleString()}
            subtitle={`${benignRatio}% of total traffic volume`}
            detailBadge="NORMAL"
            tone="green"
          />

          <StatCard
            title="Intrusion Anomalies"
            value={dashboardStats.anomaly_flows.toLocaleString()}
            subtitle={`${anomalyRatio}% malicious attack vectors`}
            detailBadge="THREATS"
            tone="red"
          />

          <StatCard
            title="Model Validation Rate"
            value="99.6%"
            subtitle="Random Forest Test Accuracy"
            detailBadge="BALANCED"
            tone="blue"
          />
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

        {/* Section 5: Security Alerts & Incident Log */}
        <section>
          <AlertsTable liveEvents={liveEvents} />
        </section>

        {/* Section 6: Model Architecture & Telemetry */}
        <section>
          <ModelInfo modelInfo={modelInfo} stats={dashboardStats} />
        </section>
      </main>
    </div>
  );
}

export default App;