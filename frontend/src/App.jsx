// src/App.jsx
import { useEffect, useState } from "react";
import RiskCard from "./components/RiskCard";
import AuditTrail from "./components/AuditTrail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useAuth } from "./context/AuthContext";

const API_BASE = "http://localhost:8000";

function Dashboard() {
  const { token, user, logout } = useAuth();
  const [atRisk, setAtRisk] = useState({ total_at_risk: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("risk"); // "risk" | "audit"

  useEffect(() => {
    fetch(`${API_BASE}/transactions/risk/at-risk`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setAtRisk(data);
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-700 px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">RecoverAI</h1>
          <p className="text-slate-400 text-sm mt-1">Revenue recovery, diagnosed and policy-bounded.</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user && <span className="text-slate-400">{user.email}</span>}
          <button
            onClick={logout}
            className="border border-slate-700 rounded px-3 py-1.5 hover:bg-slate-800 transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="px-8 py-8 max-w-4xl">
        <div className="mb-6 flex gap-1 border border-slate-700 rounded w-fit p-1">
          <button
            onClick={() => setView("risk")}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              view === "risk" ? "bg-slate-700 text-slate-100" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Risk queue
          </button>
          <button
            onClick={() => setView("audit")}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              view === "audit" ? "bg-slate-700 text-slate-100" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Audit trail
          </button>
        </div>

        {view === "risk" ? (
          <>
            <div className="mb-8">
              <p className="text-slate-400 text-sm">Total revenue at risk</p>
              <p className="font-mono text-4xl text-amber-400 mt-1">
                ₹{atRisk.total_at_risk.toLocaleString("en-IN")}
              </p>
            </div>

            {loading ? (
              <p className="text-slate-500">Loading transactions...</p>
            ) : atRisk.transactions.length === 0 ? (
              <p className="text-slate-500">No transactions currently at risk.</p>
            ) : (
              <div className="space-y-3">
                {atRisk.transactions.map((txn) => (
                  <RiskCard key={txn.id} transaction={txn} apiBase={API_BASE} token={token} />
                ))}
              </div>
            )}
          </>
        ) : (
          <AuditTrail apiBase={API_BASE} token={token} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  const { token, loading } = useAuth();
  const [authView, setAuthView] = useState("login"); // "login" | "register"

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!token) {
    return authView === "login" ? (
      <Login onSwitchToRegister={() => setAuthView("register")} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView("login")} />
    );
  }

  return <Dashboard />;
}
