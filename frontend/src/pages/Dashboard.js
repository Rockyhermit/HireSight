import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import { createJob, deleteJob, getJobs, updateJobStatus, uploadResume } from "../services/api";

function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingJob, setSubmittingJob] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resumeFile, setResumeFile] = useState(null);

  const [jobForm, setJobForm] = useState({
    company_name: "",
    job_title: "",
    job_description: "",
    status: "Applied",
  });

  const loadJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getJobs();
      setJobs(response.data || []);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleJobInputChange = (event) => {
    const { name, value } = event.target;
    setJobForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateJob = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmittingJob(true);

    try {
      await createJob(jobForm);
      setSuccess("Job application added successfully.");
      setJobForm({
        company_name: "",
        job_title: "",
        job_description: "",
        status: "Applied",
      });
      await loadJobs();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to create job.");
    } finally {
      setSubmittingJob(false);
    }
  };

  const handleResumeUpload = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!resumeFile) {
      setError("Please choose a PDF file to upload.");
      return;
    }

    if (!resumeFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are allowed.");
      return;
    }

    const formData = new FormData();
    formData.append("file", resumeFile);

    setUploadingResume(true);
    try {
      await uploadResume(formData);
      setSuccess("Resume uploaded successfully.");
      setResumeFile(null);
      const fileInput = document.getElementById("resume-file-input");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to upload resume.");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDelete = async (job) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await deleteJob(job.id);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
    } catch (error) {
      alert("Failed to delete job");
    }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await updateJobStatus(jobId, newStatus);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, status: newStatus } : j
        )
      );
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const pageStyle = {
    marginLeft: "240px",
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "28px",
    boxSizing: "border-box",
  };

  const sectionGridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "24px",
  };

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    boxShadow: "0 6px 20px rgba(15, 23, 42, 0.06)",
    padding: "20px",
  };

  const titleStyle = {
    margin: "0 0 14px",
    fontSize: "20px",
    fontWeight: 700,
    color: "#0f172a",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    marginTop: "10px",
    fontWeight: 600,
    fontSize: "14px",
    color: "#334155",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: "90px",
    resize: "vertical",
  };

  const buttonStyle = {
    marginTop: "14px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
  };

  const thTdStyle = {
    textAlign: "left",
    borderBottom: "1px solid #e2e8f0",
    padding: "12px",
    fontSize: "14px",
    color: "#334155",
    verticalAlign: "top",
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
      padding: "4px 9px",
      borderRadius: "999px",
      background: bg,
      color,
      fontSize: "12px",
      fontWeight: 700,
    };
  };

  const statusSelectStyle = (status) => {
    let background = "#dbeafe";
    let color = "#1d4ed8";

    if (status === "Interviewing") {
      background = "#fef3c7";
      color = "#92400e";
    } else if (status === "Offered") {
      background = "#dcfce7";
      color = "#166534";
    } else if (status === "Rejected") {
      background = "#fee2e2";
      color = "#991b1b";
    }

    return {
      borderRadius: "999px",
      padding: "4px 8px",
      fontWeight: 700,
      fontSize: "12px",
      cursor: "pointer",
      border: "none",
      outline: "none",
      background,
      color,
    };
  };

  return (
    <div>
      <Sidebar />

      <main style={pageStyle}>
        <h1 style={{ marginTop: 0, marginBottom: "18px", color: "#0f172a" }}>Dashboard</h1>

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

        {success && (
          <div
            style={{
              marginBottom: "16px",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#065f46",
              borderRadius: "10px",
              padding: "10px 12px",
            }}
          >
            {success}
          </div>
        )}

        <section style={sectionGridStyle}>
          <div style={cardStyle}>
            <h2 style={titleStyle}>Add New Job</h2>
            <form onSubmit={handleCreateJob}>
              <label style={labelStyle} htmlFor="company_name">
                Company Name
              </label>
              <input
                id="company_name"
                name="company_name"
                value={jobForm.company_name}
                onChange={handleJobInputChange}
                style={inputStyle}
                required
              />

              <label style={labelStyle} htmlFor="job_title">
                Job Title
              </label>
              <input
                id="job_title"
                name="job_title"
                value={jobForm.job_title}
                onChange={handleJobInputChange}
                style={inputStyle}
                required
              />

              <label style={labelStyle} htmlFor="job_description">
                Job Description
              </label>
              <textarea
                id="job_description"
                name="job_description"
                value={jobForm.job_description}
                onChange={handleJobInputChange}
                style={textareaStyle}
              />

              <label style={labelStyle} htmlFor="status">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={jobForm.status}
                onChange={handleJobInputChange}
                style={inputStyle}
              >
                <option value="Applied">Applied</option>
                <option value="Interviewing">Interviewing</option>
                <option value="Offered">Offered</option>
                <option value="Rejected">Rejected</option>
              </select>

              <button type="submit" style={buttonStyle} disabled={submittingJob}>
                {submittingJob ? "Saving..." : "Add Job"}
              </button>
            </form>
          </div>

          <div style={cardStyle}>
            <h2 style={titleStyle}>Upload Resume</h2>
            <form onSubmit={handleResumeUpload}>
              <label style={labelStyle} htmlFor="resume-file-input">
                PDF Resume
              </label>
              <input
                id="resume-file-input"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                style={{ ...inputStyle, padding: "8px" }}
              />

              <button type="submit" style={buttonStyle} disabled={uploadingResume}>
                {uploadingResume ? "Uploading..." : "Upload Resume"}
              </button>
            </form>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={titleStyle}>Job Applications</h2>

          {loading ? (
            <p style={{ color: "#64748b", margin: 0 }}>Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <p style={{ color: "#64748b", margin: 0 }}>No job applications yet. Add your first job above.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thTdStyle}>Company</th>
                    <th style={thTdStyle}>Title</th>
                    <th style={thTdStyle}>Status</th>
                    <th style={thTdStyle}>Analysis Status</th>
                    <th style={thTdStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td style={thTdStyle}>{job.company_name}</td>
                      <td style={thTdStyle}>{job.job_title}</td>
                      <td style={thTdStyle}>
                        <select
                          value={job.status}
                          onChange={(event) => handleStatusChange(job.id, event.target.value)}
                          style={statusSelectStyle(job.status)}
                        >
                          <option value="Applied">Applied</option>
                          <option value="Interviewing">Interviewing</option>
                          <option value="Offered">Offered</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                      <td style={thTdStyle}>
                        <span style={badgeStyle(job.analysis_status)}>{job.analysis_status || "pending"}</span>
                      </td>
                      <td style={thTdStyle}>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <Link
                            to={`/jobs/${job.id}`}
                            style={{
                              textDecoration: "none",
                              background: "#0ea5e9",
                              color: "#ffffff",
                              borderRadius: "8px",
                              padding: "8px 10px",
                              fontSize: "13px",
                              fontWeight: 600,
                            }}
                          >
                            View & Analyze
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(job)}
                            style={{
                              background: "#ef4444",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "8px",
                              padding: "8px 10px",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
