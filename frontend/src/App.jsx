// src/App.jsx
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import DashboardView from "./pages/DashboardView";
import TransactionsView from "./pages/TransactionsView";
import AtRiskView from "./pages/AtRiskView";
import RecoveryView from "./pages/RecoveryView";
import AuditTrailView from "./pages/AuditTrailView";
import MetricsView from "./pages/MetricsView";
import SettingsView from "./pages/SettingsView";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TransactionDetailModal from "./components/TransactionDetailModal";
import NewTransactionModal from "./components/NewTransactionModal";

function DashboardLayout() {
  const { authFetch } = useAuth();
  const [currentView, setView] = useState("dashboard");

  // Data states
  const [transactions, setTransactions] = useState([]);
  const [atRisk, setAtRisk] = useState({ total_at_risk: 0, transactions: [] });
  const [metrics, setMetrics] = useState(null);
  const [auditAttempts, setAuditAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal / Interaction states
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [runningTxnId, setRunningTxnId] = useState(null);

  const loadAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [txnsRes, riskRes, metricsRes, auditRes] = await Promise.all([
        authFetch("/transactions/"),
        authFetch("/transactions/risk/at-risk"),
        authFetch("/transactions/metrics/summary"),
        authFetch("/transactions/audit/all"),
      ]);

      const [txnsData, riskData, metricsData, auditData] = await Promise.all([
        txnsRes.json().catch(() => []),
        riskRes.json().catch(() => ({ total_at_risk: 0, transactions: [] })),
        metricsRes.json().catch(() => null),
        auditRes.json().catch(() => []),
      ]);

      if (Array.isArray(txnsData)) setTransactions(txnsData);
      if (riskData && typeof riskData === "object") setAtRisk(riskData);
      if (metricsData && typeof metricsData === "object") setMetrics(metricsData);
      if (Array.isArray(auditData)) setAuditAttempts(auditData);
    } catch (err) {
      console.error("Data load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Quick 1-click recovery handler from tables/cards
  const handleRunRecovery = async (txnId) => {
    setRunningTxnId(txnId);
    try {
      const res = await authFetch(`/transactions/${txnId}/process-recovery`, {
        method: "POST",
      });
      const data = await res.json();
      await loadAllData(true);
      // Open transaction in detail view to inspect result
      const updatedTxn = transactions.find((t) => t.id === txnId) || { id: txnId, status: "processing" };
      setSelectedTxn(updatedTxn);
    } catch (err) {
      alert(`Recovery execution failed: ${err.message}`);
    } finally {
      setRunningTxnId(null);
    }
  };

  const handleSelectTxnId = (id) => {
    const found = transactions.find((t) => t.id === id);
    if (found) setSelectedTxn(found);
    else setSelectedTxn({ id, status: "unknown", customer_email: "Loading..." });
  };

  const viewTitles = {
    dashboard: {
      title: "Recovery Command Center",
      subtitle: "Autonomous revenue protection, policy bounding, and gateway telemetry",
    },
    transactions: {
      title: "Transaction Ledger",
      subtitle: "Universal merchant ledger with error classifications and recovery state",
    },
    "at-risk": {
      title: "At-Risk Capital Queue",
      subtitle: "Prioritized orders leaking revenue requiring immediate AI recovery",
    },
    recovery: {
      title: "Autonomous Recovery Pipeline",
      subtitle: "Interactive execution sandbox with live Razorpay payment link generation",
    },
    audit: {
      title: "Regulatory Audit Trail",
      subtitle: "Verifiable algorithmic logs, confidence metrics, and policy guard decisions",
    },
    metrics: {
      title: "Executive Analytics",
      subtitle: "Performance indicators, yield rates, and policy block classifications",
    },
    settings: {
      title: "Policy & System Settings",
      subtitle: "Safety caps, retry boundaries, allowed actions, and gateway bindings",
    },
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Sidebar */}
      <Sidebar currentView={currentView} setView={setView} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          title={viewTitles[currentView]?.title || "RecoverAI"}
          subtitle={viewTitles[currentView]?.subtitle}
          onRefresh={() => loadAllData(true)}
          onNewTransaction={() => setShowNewModal(true)}
          refreshing={refreshing}
        />

        <main className="flex-1 overflow-y-auto p-8 bg-slate-950/40">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span>Loading RecoverAI workspace...</span>
              </div>
            </div>
          ) : (
            <>
              {currentView === "dashboard" && (
                <DashboardView
                  metrics={metrics}
                  transactions={transactions}
                  atRiskTransactions={atRisk.transactions || []}
                  recentAttempts={auditAttempts}
                  onSelectTxn={setSelectedTxn}
                  onRunRecovery={handleRunRecovery}
                  runningTxnId={runningTxnId}
                  setView={setView}
                />
              )}

              {currentView === "transactions" && (
                <TransactionsView
                  transactions={transactions}
                  onSelectTxn={setSelectedTxn}
                  onRunRecovery={handleRunRecovery}
                  runningTxnId={runningTxnId}
                />
              )}

              {currentView === "at-risk" && (
                <AtRiskView
                  transactions={atRisk.transactions || []}
                  totalAtRisk={atRisk.total_at_risk}
                  onSelectTxn={setSelectedTxn}
                  onRunRecovery={handleRunRecovery}
                  runningTxnId={runningTxnId}
                />
              )}

              {currentView === "recovery" && (
                <RecoveryView
                  transactions={transactions}
                  onRefreshAll={() => loadAllData(true)}
                />
              )}

              {currentView === "audit" && (
                <AuditTrailView
                  auditAttempts={auditAttempts}
                  loading={refreshing}
                  onSelectTxnId={handleSelectTxnId}
                />
              )}

              {currentView === "metrics" && (
                <MetricsView
                  metrics={metrics}
                  auditAttempts={auditAttempts}
                  transactions={transactions}
                />
              )}

              {currentView === "settings" && <SettingsView />}
            </>
          )}
        </main>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTxn && (
        <TransactionDetailModal
          transaction={selectedTxn}
          onClose={() => setSelectedTxn(null)}
          onRunRecovery={handleRunRecovery}
          runningRecovery={runningTxnId === selectedTxn.id}
        />
      )}

      {/* New Test Transaction Modal */}
      {showNewModal && (
        <NewTransactionModal
          onClose={() => setShowNewModal(false)}
          onSuccess={() => loadAllData(true)}
        />
      )}
    </div>
  );
}

export default function App() {
  const { token, loading } = useAuth();
  const [authView, setAuthView] = useState("login"); // "login" | "register"

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span>Authenticating RecoverAI session...</span>
        </div>
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

  return <DashboardLayout />;
}

