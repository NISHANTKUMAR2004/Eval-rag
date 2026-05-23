import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("nishant@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser({ email, password });

      const token = data.access_token || data.token;

      if (!token) {
        throw new Error("Token not found in login response");
      }

      localStorage.setItem("evalguard_token", token);
      navigate("/dashboard");
    } catch (err) {
      setError("Login failed. Check email/password or backend server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 text-slate-100">
      {/* Immersive Background Glows */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-violet-600/10 blur-[128px] animate-pulse-glow"></div>
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-[128px] animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo Branding */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-[0_0_30px_rgba(124,58,237,0.3)]">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">EvalGuard AI</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Securely access your RAG evaluation pipeline.
          </p>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="glass-panel w-full rounded-3xl p-8 shadow-2xl shadow-black/50 border border-slate-800/80">
          <h2 className="text-xl font-bold text-slate-100">Sign In</h2>
          <p className="mt-1 text-xs text-slate-500">Please enter your credentials below.</p>

          {error && (
            <div className="mt-4 rounded-xl bg-red-950/40 border border-red-500/30 px-4 py-3.5 text-sm text-red-200 shadow-lg shadow-red-950/20">
              <div className="flex gap-2">
                <svg className="h-5 w-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">Email Address</label>
              <input
                className="w-full input-premium"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="name@company.com"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">Password</label>
              <input
                className="w-full input-premium"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              disabled={loading}
              className="w-full btn-premium-gradient py-3 text-base flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verifying Identity...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800/80 pt-6 text-center">
            <p className="text-sm text-slate-400">
              Don't have an account yet?{" "}
              <Link className="font-semibold text-violet-400 hover:text-violet-300 transition-colors" to="/register">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}