import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import Sidebar from "../components/Sidebar";
import { getJobDetail, triggerAnalysis } from "../services/api";

function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState("");
  const [dotCount, setDotCount] = useState(0);

  const analysisStatus = job?.analysis_status || "pending";
  const isAnalyzing = analysisStatus === "processing";
  const latestFeedback = job?.history?.[0] || null;

  const fetchJobDetail = async () => {
    try {
      const response = await getJobDetail(id);
      setJob(response.data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load job details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchJobDetail();
  }, [id]);

  useEffect(() => {
    if (analysisStatus !== "processing") return undefined;

    const pollingInterval = setInterval(() => {
      fetchJobDetail();
    }, 3000);

    return () => clearInterval(pollingInterval);
  }, [analysisStatus, id]);

  useEffect(() => {
    if (!isAnalyzing) return undefined;

    const dotInterval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 450);

    return () => clearInterval(dotInterval);
  }, [isAnalyzing]);

  useEffect(() => {
    console.log("Job state updated:", job);
  }, [job]);

  const radarData = useMemo(() => {
    if (!latestFeedback) return [];
    return [
      { metric: "Match", score: Number(latestFeedback.match_score || 0) },
      { metric: "Keyword", score: Number(latestFeedback.keyword_score || 0) },
      { metric: "Semantic", score: Number(latestFeedback.semantic_score || 0) },
    ];
  }, [latestFeedback]);

  const handleTriggerAnalysis = async () => {
    setError("");
    setTriggering(true);
    try {
      console.log("Triggering analysis for job:", id);
      await triggerAnalysis(id);
      setJob((prev) => (prev ? { ...prev, analysis_status: "processing" } : prev));
    } catch (err) {
      console.log("Error triggering analysis:", err);
      setError(err?.response?.data?.detail || "Failed to trigger AI analysis.");
    } finally {
      setTriggering(false);
    }
  };

  const pageStyle = {
    marginLeft: "240px",
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "28px",
    boxSizing: "border-box",
  };

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    boxShadow: "0 6px 20px rgba(15, 23, 42, 0.06)",
    padding: "20px",
    marginBottom: "20px",
  };

  const badgeStyle = (value) => {
    const normalized = String(value || "").toLowerCase();
    let bg = "#e2e8f0";
    let color = "#334155";

    if (normalized === "applied") {
      bg = "#dbeafe";
      color = "#1d4ed8";
    } else if (normalized === "interviewing") {
      bg = "#fef3c7";
      color = "#92400e";
    } else if (normalized === "offered" || normalized === "completed") {
      bg = "#dcfce7";
      color = "#166534";
    } else if (normalized === "rejected" || normalized === "failed") {
      bg = "#fee2e2";
      color = "#991b1b";
    } else if (normalized === "processing" || normalized === "pending") {
      bg = "#e0e7ff";
      color = "#3730a3";
    }

    return {
      display: "inline-block",
      padding: "5px 10px",
      borderRadius: "999px",
      background: bg,
      color,
      fontSize: "12px",
      fontWeight: 700,
      marginRight: "8px",
    };
  };

  if (loading) {
    return (
      <div>
        <Sidebar />
        <main style={pageStyle}>
          <p style={{ margin: 0, color: "#64748b" }}>Loading job details...</p>
        </main>
      </div>
    );
  }

  if (!job) {
    return (
      <div>
        <Sidebar />
        <main style={pageStyle}>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            style={{
              marginBottom: "16px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              borderRadius: "8px",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Back to Dashboard
          </button>
          <p style={{ color: "#b91c1c", margin: 0 }}>{error || "Job not found."}</p>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Sidebar />

      <main style={pageStyle}>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          style={{
            marginBottom: "16px",
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            borderRadius: "8px",
            padding: "8px 12px",
            cursor: "pointer",
            fontWeight: 600,
            color: "#334155",
          }}
        >
          Back to Dashboard
        </button>

        {error && (
          <div
            style={{
              marginBottom: "16px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              borderRadius: "10px",
              padding: "10px 12px",
            }}
          >
            {error}
          </div>
        )}
        {analysisStatus === "failed" && (
          <div
            style={{
              marginBottom: "16px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              borderRadius: "10px",
              padding: "10px 12px",
            }}
          >
            Analysis failed. Please try again.
          </div>
        )}

        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", flexWrap: "wrap" }}>
            <div>
              <h1 style={{ margin: "0 0 8px", color: "#0f172a" }}>{job.job_title}</h1>
              <p style={{ margin: "0 0 10px", color: "#475569", fontSize: "16px", fontWeight: 600 }}>
                {job.company_name}
              </p>
              <div>
                <span style={badgeStyle(job.status)}>{job.status}</span>
                <span style={badgeStyle(job.analysis_status)}>{job.analysis_status}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleTriggerAnalysis()}
              disabled={triggering || isAnalyzing}
              style={{
                border: "none",
                borderRadius: "10px",
                background: triggering || isAnalyzing ? "#93c5fd" : "#2563eb",
                color: "#ffffff",
                padding: "10px 14px",
                fontWeight: 700,
                fontSize: "14px",
                height: "fit-content",
                cursor: triggering || isAnalyzing ? "not-allowed" : "pointer",
              }}
            >
              {triggering ? "Starting..." : "Trigger AI Analysis"}
            </button>
          </div>

          {isAnalyzing && (
            <p
              style={{
                marginTop: "14px",
                marginBottom: 0,
                color: "#1d4ed8",
                fontWeight: 600,
              }}
            >
              AI is analyzing your resume{".".repeat(dotCount)}
            </p>
          )}
        </section>

        {latestFeedback && (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>AI Analysis Results</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.1fr 1fr",
                gap: "20px",
                alignItems: "center",
              }}
            >
              <div style={{ width: "100%", height: "290px" }}>
                <ResponsiveContainer>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#2563eb"
                      fill="#3b82f6"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <p style={{ margin: 0, color: "#64748b", fontSize: "13px", fontWeight: 600 }}>Match Score</p>
                <p style={{ margin: "4px 0 14px", color: "#0f172a", fontSize: "44px", fontWeight: 800 }}>
                  {Math.round(Number(latestFeedback.match_score || 0))}
                </p>

                <p style={{ margin: "0 0 8px", color: "#334155", fontWeight: 700 }}>Missing Keywords</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {(latestFeedback.missing_keywords || []).length > 0 ? (
                    latestFeedback.missing_keywords.map((keyword, index) => (
                      <span
                        key={`${keyword}-${index}`}
                        style={{
                          background: "#fee2e2",
                          color: "#b91c1c",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: 700,
                          padding: "4px 8px",
                        }}
                      >
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: "#64748b", fontSize: "14px" }}>No critical keywords missing.</span>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                marginTop: "10px",
              }}
            >
              <div>
                <h3 style={{ marginBottom: "10px", color: "#0f172a" }}>Improvements</h3>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "#334155" }}>
                  {(latestFeedback.improvements || []).length > 0 ? (
                    latestFeedback.improvements.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)
                  ) : (
                    <li>No improvement suggestions available.</li>
                  )}
                </ul>
              </div>

              <div>
                <h3 style={{ marginBottom: "10px", color: "#0f172a" }}>ATS Tips</h3>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "#334155" }}>
                  {(latestFeedback.ats_tips || []).length > 0 ? (
                    latestFeedback.ats_tips.map((tip, index) => <li key={`${tip}-${index}`}>{tip}</li>)
                  ) : (
                    <li>No ATS tips available.</li>
                  )}
                </ul>
              </div>
            </div>

            <div
              style={{
                marginTop: "16px",
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                padding: "14px",
              }}
            >
              <h3 style={{ marginTop: 0, color: "#0f172a" }}>Rewritten Summary</h3>
              <p style={{ marginBottom: 0, color: "#334155", lineHeight: 1.6 }}>
                {latestFeedback.rewritten_summary || "No rewritten summary available yet."}
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default JobDetail;
