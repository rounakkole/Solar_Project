import { Routes, Route, Navigate } from "react-router-dom";
import { useState, createContext, useContext } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import StatsBar from "./components/StatsBar";
import Services from "./components/Services";
import Products from "./components/Products";
import Calculator from "./components/Calculator";
import MapSection from "./components/MapSection";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import Toast from "./components/Toast";

export const ToastCtx = createContext(null);
export function useToast() {
  return useContext(ToastCtx);
}

function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <Services />
      <Products />
      <Calculator />
      <MapSection />
      <Contact />
      <Footer />
    </>
  );
}

export default function App() {
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, icon = "✅") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, icon }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const [isAuth, setIsAuth] = useState(!!localStorage.getItem("token"));

  return (
    <ToastCtx.Provider value={addToast}>
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />

        {/* LOGIN */}
        <Route path="/login" element={<AdminLogin setIsAuth={setIsAuth} />} />

        <Route
          path="/admin"
          element={isAuth ? <AdminDashboard /> : <Navigate to="/login" />}
        />
      </Routes>

      <Toast toasts={toasts} />
    </ToastCtx.Provider>
  );
}