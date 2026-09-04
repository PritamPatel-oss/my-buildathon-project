// src/pages/Login.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ShieldCheckIcon } from "../components/Icons";

export default function Login({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("test@recoverai.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Failed to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-2xl mx-auto shadow-sm">
            R
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            RecoverAI
          </h1>
          <p className="text-xs text-slate-400">
            Autonomous payment recovery platform with deterministic policy guards
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-7 space-y-4 shadow-xl backdrop-blur-md"
        >
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-slate-200">Merchant Sign In</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Enter your merchant credentials to access the recovery dashboard
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="merchant@example.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors rounded-lg py-2.5 text-xs font-bold tracking-wide disabled:opacity-50 shadow-sm"
          >
            {submitting ? "Authenticating..." : "Sign In to Dashboard"}
          </button>

          {/* Quick Demo Hint */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1 text-slate-300 font-medium">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Demo Account Credentials:</span>
            </div>
            <p className="font-mono text-slate-300">Email: test@recoverai.com</p>
            <p className="font-mono text-slate-300">Password: password123</p>
          </div>

          <p className="text-xs text-slate-400 text-center pt-2">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2"
            >
              Create Merchant Account
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

