import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import PriceWars from "./pages/PriceWars";
import Copilot from "./pages/Copilot";
import ProductDeepDive from "./pages/ProductDeepDive";
import Forecast from "./pages/Forecast";

import AdminDashboard from "./pages/AdminDashboard";

import MainLayout from "./components/MainLayout";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import axios from 'axios';
import { useEffect } from 'react';
import { auth } from './firebase';

// ── Simple in-memory cache so pages don't re-fetch on every navigation ──
export const pageCache = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
export function getCached(key) {
  const entry = pageCache[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { delete pageCache[key]; return null; }
  return entry.data;
}
export function setCached(key, data) {
  pageCache[key] = { data, ts: Date.now() };
}

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('172.') || h.startsWith('10.')) {
    return `http://${h}:8000`;
  }
  return 'https://sensaleapp.onrender.com';
};
const fallbackUrl = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: fallbackUrl,
  timeout: 60000, // 60 seconds to allow Render free tier instance to wake up
});

apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

function App() {
  // Keep-alive ping every 10 minutes so Render never goes cold
  useEffect(() => {
    const ping = () => axios.get('https://sensaleapp.onrender.com/health').catch(() => {});
    ping(); // ping on app load
    const id = setInterval(ping, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <AuthProvider>
      <PWAInstallPrompt />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route 
            element={
              <PrivateRoute>
                 <MainLayout />
              </PrivateRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pricewars" element={<PriceWars />} />
            <Route path="/copilot" element={<Copilot />} />
            <Route path="/product/:productName" element={<ProductDeepDive />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
