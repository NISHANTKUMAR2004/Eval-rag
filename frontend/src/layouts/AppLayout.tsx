import { Link, NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { logoutUser } from "../api/auth";
import {
  LayoutDashboard,
  FolderGit2,
  FileText,
  Database,
  Activity,
  MessageSquare,
  LogOut,
  FolderOpen,
} from "lucide-react";

export default function AppLayout() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  function handleLogout() {
    logoutUser();
    navigate("/login");
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
      isActive
        ? "bg-gradient-to-r from-violet-600/30 to-indigo-600/30 border border-violet-500/50 text-violet-200 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
        : "text-slate-450 hover:bg-slate-800/40 hover:text-slate-100 border border-transparent"
    }`;

  const subNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-300 border ${
      isActive
        ? "bg-violet-500/10 border-violet-500/30 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.1)]"
        : "text-slate-500 hover:bg-slate-900/40 hover:text-slate-350 border-transparent"
    }`;

  return (
    <div className="min-h-screen text-slate-100 font-sans selection:bg-violet-500/30 selection:text-violet-200 bg-slate-950 relative overflow-x-hidden">
      {/* Dynamic Background Glowing Mesh Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-violet-600/5 blur-[120px] animate-float"></div>
        <div className="absolute top-1/3 right-1/4 h-[500px] w-[500px] rounded-full bg-indigo-600/5 blur-[150px] animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Floating Glass Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/75 backdrop-blur-xl shadow-lg shadow-slate-950/10 relative">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="flex items-center gap-3.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-[0_0_20px_rgba(124,58,237,0.35)] transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(124,58,237,0.55)]">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 group-hover:text-white transition-colors duration-300">
              EvalGuard <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400 font-black">AI</span>
            </span>
          </Link>

          <nav className="flex items-center gap-3">
            <NavLink to="/dashboard" className={navLinkClass}>
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink to="/projects" className={navLinkClass}>
              <FolderGit2 className="h-4 w-4" />
              <span>Projects</span>
            </NavLink>

            {/* Health Monitor Pulse */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-2.5 text-xs font-semibold text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              System Active
            </div>

            <div className="h-6 w-px bg-slate-800"></div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/40 px-4 py-2 text-sm font-semibold text-slate-350 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30 transition-all duration-300 active:scale-95 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Secondary Project Contextual Bar */}
      {projectId && (
        <div className="border-b border-slate-900/60 bg-slate-950/60 backdrop-blur-md py-2.5 shadow-md shadow-black/10 relative z-40">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6">
            <div className="flex items-center gap-2 text-[10px] font-extrabold font-mono text-slate-500 tracking-wider">
              <FolderOpen className="h-4 w-4 text-violet-400" />
              <span className="uppercase text-[9px]">WORKSPACE ID:</span>
              <span className="text-slate-300 select-all font-sans font-bold bg-slate-900/60 border border-slate-800 rounded px-1.5 py-0.5">{projectId}</span>
            </div>

            <nav className="flex items-center gap-2">
              <NavLink
                to={`/projects/${projectId}/documents`}
                className={subNavLinkClass}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Documents</span>
              </NavLink>

              <NavLink
                to={`/projects/${projectId}/datasets`}
                className={subNavLinkClass}
              >
                <Database className="h-3.5 w-3.5" />
                <span>Datasets</span>
              </NavLink>

              <NavLink
                to={`/projects/${projectId}/evaluations`}
                className={subNavLinkClass}
              >
                <Activity className="h-3.5 w-3.5" />
                <span>Evaluations</span>
              </NavLink>

              <NavLink
                to={`/projects/${projectId}/chat`}
                className={subNavLinkClass}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>RAG Chat</span>
              </NavLink>
            </nav>
          </div>
        </div>
      )}

      {/* Page Entrance Slide-Up Animation */}
      <main className="mx-auto max-w-7xl px-6 py-8 animate-slide-up relative z-10">
        <Outlet />
      </main>
    </div>
  );
}