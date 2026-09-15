import axios from "axios";

// Use NEXT_PUBLIC_API_URL for production (e.g. Vercel), fallback to current host IP for local network testing
export const backendHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
const isProd = backendHost.includes("vercel.app") || backendHost.includes("rythujanasethu");
let apiEnv = process.env.NEXT_PUBLIC_API_URL;
if (isProd && apiEnv && apiEnv.includes("localhost")) apiEnv = null;
const defaultBackend = isProd ? "https://rythusethu96.onrender.com" : `http://${backendHost}:5000`;
export const BASE_URL = apiEnv || defaultBackend;

const API = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true, // Send HttpOnly cookies (refresh token) with every request
});

// Auto-attach authorization token if present
API.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Auto-Refresh Interceptor ───
// If a request fails with 401 (expired access token), automatically refresh
// the token using the HttpOnly refresh cookie and retry the original request.
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401 errors (not login/register/refresh requests themselves)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/register") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        // Queue requests while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (data.token) {
          localStorage.setItem("token", data.token);
          API.defaults.headers.common.Authorization = `Bearer ${data.token}`;
          processQueue(null, data.token);

          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return API(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed — clear stale token but do NOT clear saved profiles
        localStorage.removeItem("token");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;