import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login, register } from "../services/api";

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isLogin = mode === "login";

  const handleToggleMode = () => {
    setMode((prev) => (prev === "login" ? "register" : "login"));
    setError("");
    setSuccess("");
  };

  const getApiError = (err, fallback) =>
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    fallback;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLogin) {
        const response = await login(email, password);
        localStorage.setItem("token", response.data.access_token);
        navigate("/dashboard");
      } else {
        await register(email, password);
        setMode("login");
        setSuccess("Registration successful. Please log in.");
      }
    } catch (err) {
      setError(
        getApiError(
          err,
          isLogin ? "Login failed. Please try again." : "Registration failed. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f3f6fb 0%, #eef2ff 100%)",
    padding: "24px",
  };

  const cardStyle = {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    borderRadius: "14px",
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.12)",
    padding: "32px",
    border: "1px solid #e5e7eb",
  };

  const titleStyle = {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
    color: "#111827",
    textAlign: "center",
  };

  const subtitleStyle = {
    marginTop: "8px",
    marginBottom: "24px",
    fontSize: "14px",
    color: "#6b7280",
    textAlign: "center",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "14px",
    marginBottom: "16px",
    outline: "none",
  };

  const buttonStyle = {
    width: "100%",
    border: "none",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "15px",
    fontWeight: 600,
    color: "#ffffff",
    background: loading ? "#93c5fd" : "#2563eb",
    cursor: loading ? "not-allowed" : "pointer",
    transition: "all 0.2s ease",
  };

  const secondaryButtonStyle = {
    marginTop: "14px",
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#1f2937",
    background: "#f9fafb",
    cursor: "pointer",
  };

  const messageBaseStyle = {
    borderRadius: "10px",
    padding: "10px 12px",
    marginBottom: "16px",
    fontSize: "14px",
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>HireSphere</h1>
        <p style={subtitleStyle}>
          {isLogin ? "Sign in to manage your job pipeline." : "Create your account to get started."}
        </p>

        {error && (
          <div
            style={{
              ...messageBaseStyle,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              ...messageBaseStyle,
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#065f46",
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="email" style={labelStyle}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={inputStyle}
            placeholder="you@example.com"
            required
          />

          <label htmlFor="password" style={labelStyle}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={inputStyle}
            placeholder="Enter your password"
            required
            minLength={6}
          />

          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Log In" : "Create Account"}
          </button>
        </form>

        <button type="button" style={secondaryButtonStyle} onClick={handleToggleMode}>
          {isLogin ? "Need an account? Register" : "Already have an account? Log In"}
        </button>
      </div>
    </div>
  );
}

export default Login;
