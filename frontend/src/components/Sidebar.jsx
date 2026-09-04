// src/components/Sidebar.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  DashboardIcon,
  TransactionsIcon,
  AlertIcon,
  RecoveryIcon,
  AuditIcon,
  MetricsIcon,
  SettingsIcon,
  LogoutIcon,
  ShieldCheckIcon,
} from "./Icons";

export default function Sidebar({ currentView, setView }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: DashboardIcon },
    { id: "transactions", label: "Transactions", icon: TransactionsIcon },
    { id: "at-risk", label: "At-Risk Payments", icon: AlertIcon, badge: "Risk" },
    { id: "recovery", label: "Recovery", icon: RecoveryIcon },
    { id: "audit", label: "Audit Trail", icon: AuditIcon },
    { id: "metrics", label: "Metrics", icon: MetricsIcon },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-slate-950/90 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg shadow-sm">
            R
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-100 tracking-tight text-base">
                RecoverAI
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Autonomous Payment Recovery</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-slate-800/90 text-amber-400 border border-slate-700/60 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? "text-amber-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
            {user?.email ? user.email.slice(0, 2).toUpperCase() : "RA"}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-slate-200 truncate">
              {user?.email || "Account"}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheckIcon className="w-3 h-3 text-emerald-400" />
              <span className="text-[11px] text-emerald-400 font-mono">Policy Verified</span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-all"
        >
          <LogoutIcon className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
