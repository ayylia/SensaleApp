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
import { auth } from './firebase';

const fallbackUrl = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://127.0.0.1:8000' 
    : 'https://fyp-alia.onrender.com' // Replace with your exact Render backend URL if different
);

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
