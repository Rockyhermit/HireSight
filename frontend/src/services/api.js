import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (username, password) => {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  return api.post("/auth/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
};

export const register = (email, password) =>
  api.post("/auth/register", { email, password });

export const getJobs = () => api.get("/jobs/");

export const createJob = (data) => api.post("/jobs/", data);

export const getJobDetail = (id) => api.get(`/jobs/${id}`);

export const updateJobStatus = (id, status) =>
  api.patch(`/jobs/${id}`, { status });

export const deleteJob = (id) => api.delete(`/jobs/${id}`);

export const uploadResume = (formData) => api.post("/resumes/upload", formData);

export const getResumes = () => api.get("/resumes");

export const triggerAnalysis = (id) => api.post(`/jobs/${id}/analyze`);

export default api;
