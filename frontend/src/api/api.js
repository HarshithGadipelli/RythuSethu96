import axios from "axios";

// Use VITE_API_URL for production (e.g. Vercel), fallback to current host IP for local network testing
export const backendHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
const isProd = backendHost.includes("vercel.app") || backendHost.includes("rythujanasethu");
let apiEnv = process.env.NEXT_PUBLIC_API_URL;
if (isProd && apiEnv && apiEnv.includes("localhost")) apiEnv = null;
const defaultBackend = isProd ? "https://rythusethu96.onrender.com" : `http://${backendHost}:5000`;
export const BASE_URL = apiEnv || defaultBackend;

const API = axios.create({
  baseURL: `${BASE_URL}/api`
});

// Auto-attach authorization token if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;