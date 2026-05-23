import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { logoutUser } from "../api/auth";

export default function AppLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    logoutUser();
    navigate("/login");
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
      isActive
        ? "bg-gradient-to-r from-violet-600/30 to-indigo-600/30 border border-violet-500/50 text-violet-200 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
        : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-100 border border-transparent"
    }`;

  return (
    <div className="min-h-screen text-slate-100 font-sans selection:bg-violet-500/30 selection:text-violet-200">
      {/* Floating Glass Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-900/75 backdrop-blur-md shadow-lg shadow-slate-950/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(124,58,237,0.5)]">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300 group-hover:text-white transition-colors">
              EvalGuard <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">AI</span>
            </span>
          </Link>

          <nav className="flex items-center gap-3">
            <NavLink to="/dashboard" className={navLinkClass}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
              </svg>
              Dashboard
            </NavLink>

            <NavLink to="/projects" className={navLinkClass}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Projects
            </NavLink>

            {/* Health Monitor Pulse */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs font-semibold text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              System Active
            </div>

            <div className="h-6 w-px bg-slate-800"></div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/40 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30 transition-all duration-300 active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Page Entrance Slide-Up Animation */}
      <main className="mx-auto max-w-7xl px-6 py-10 animate-slide-up">
        <Outlet />
      </main>
    </div>
  );
}