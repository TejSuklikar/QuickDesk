import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./App.css";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Contracts from "./pages/Contracts";
import ContractDetail from "./pages/ContractDetail";
import Invoices from "./pages/Invoices";
import InvoiceDetail from "./pages/InvoiceDetail";
import Inbox from "./pages/Inbox";
import Templates from "./pages/Templates";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('freeflow_user');
    const savedSession = localStorage.getItem('freeflow_session');
    
    if (savedUser && savedSession) {
      const sessionData = JSON.parse(savedSession);
      const now = Date.now();
      
      // Check if session is still valid (24 hours)
      if (now - sessionData.timestamp < 24 * 60 * 60 * 1000) {
        setUser(JSON.parse(savedUser));
      } else {
        // Session expired, clear data
        localStorage.removeItem('freeflow_user');
        localStorage.removeItem('freeflow_session');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('freeflow_user', JSON.stringify(userData));
    localStorage.setItem('freeflow_session', JSON.stringify({
      timestamp: Date.now(),
      userId: userData.id
    }));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('freeflow_user');
    localStorage.removeItem('freeflow_session');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-xl text-slate-600">Loading FreeFlow...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={login} />;
  }

  return (
    <BrowserRouter>
      <Layout user={user} onLogout={logout}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail user={user} />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/contracts/:id" element={<ContractDetail />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;