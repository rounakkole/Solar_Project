import axios from "axios";

const api = axios.create({
  baseURL: "${import.meta.env.VITE_BACKEND_URL}/api",
});

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API ERROR:", err.response?.data || err.message);

    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(err);
  }
);

export default api;