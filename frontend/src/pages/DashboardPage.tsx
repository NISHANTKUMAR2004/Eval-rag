import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getDashboardStats } from "../api/dashboard";
import {
  FolderGit2,
  FileText,
  Database,
  Activity,
  CheckCircle2,
  ListTodo,
  Loader2,
  ShieldCheck,
} from "lucide-react";

type DashboardStats = {
  projects_count?: number;
  documents_count?: number;
  chunks_count?: number;
  datasets_count?: number;
  test_cases_count?: number;
  evaluation_runs_count?: number;

  projects?: number;
  documents?: number;
  chunks?: number;
  datasets?: number;
  test_cases?: number;
  evaluation_runs?: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function normalizeStats(data: any): DashboardStats {
    return data.stats || data.dashboard || data;
  }

  async function fetchStats() {
    try {
      setLoading(true);
      setError("");
      const data = await getDashboardStats();
      setStats(normalizeStats(data));
    } catch (err) {
      setError("Could not load dashboard stats.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  const metrics = [
    {
      label: "Active Projects",
      value: stats.projects_count ?? stats.projects ?? 0,
      description: "Secure isolated evaluation workspaces",
      color: "from-violet-500/10 via-violet-650/5 to-transparent",
      borderColor: "border-violet-500/20",
      textColor: "text-violet-400",
      icon: <FolderGit2 className="h-5 w-5 text-violet-400" />
    },
    {
      label: "Documents Indexed",
      value: stats.documents_count ?? stats.documents ?? 0,
      description: "PDF/text knowledge corpus loaded",
      color: "from-indigo-500/10 via-indigo-650/5 to-transparent",
      borderColor: "border-indigo-500/20",
      textColor: "text-indigo-400",
      icon: <FileText className="h-5 w-5 text-indigo-400" />
    },
    {
      label: "Semantic Chunks",
      value: stats.chunks_count ?? stats.chunks ?? 0,
      description: "Granular vector index records",
      color: "from-cyan-500/10 via-cyan-650/5 to-transparent",
      borderColor: "border-cyan-500/20",
      textColor: "text-cyan-400",
      icon: <Database className="h-5 w-5 text-cyan-400" />
    },
    {
      label: "Ground-Truth Datasets",
      value: stats.datasets_count ?? stats.datasets ?? 0,
      description: "Validation benchmark suites",
      color: "from-emerald-500/10 via-emerald-650/5 to-transparent",
      borderColor: "border-emerald-500/20",
      textColor: "text-emerald-400",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />
    },
    {
      label: "Test Scenarios",
      value: stats.test_cases_count ?? stats.test_cases ?? 0,
      description: "Formulated benchmark assertions",
      color: "from-pink-500/10 via-pink-650/5 to-transparent",
      borderColor: "border-pink-500/20",
      textColor: "text-pink-400",
      icon: <ListTodo className="h-5 w-5 text-pink-400" />
    },
    {
      label: "Evaluation Runs",
      value: stats.evaluation_runs_count ?? stats.evaluation_runs ?? 0,
      description: "Batch quality scoring reports",
      color: "from-amber-500/10 via-amber-650/5 to-transparent",
      borderColor: "border-amber-500/20",
      textColor: "text-amber-400",
      icon: <Activity className="h-5 w-5 text-amber-400" />
    }
  ];

  const steps = [
    { num: "01", title: "Launch Workspace", desc: "Set up a clean project context environment." },
    { num: "02", title: "Ingest Knowledge", desc: "Upload training PDFs and verify vector chunk indexing." },
    { num: "03", title: "Assemble Test Cases", desc: "Write expected outputs and benchmark answers." },
    { num: "04", title: "Run Batch Audit", desc: "Launch auto-evaluators to fetch accuracy percentages." }
  ];

  return (
    <div className="space-y-8 animate-slide-up relative">
      {/* Decorative Blur Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-10 h-96 w-96 rounded-full bg-violet-500/5 blur-[130px] animate-float"></div>
        <div className="absolute bottom-10 left-10 h-80 w-80 rounded-full bg-indigo-500/5 blur-[120px] animate-float" style={{ animationDelay: '2.5s' }}></div>
      </div>

      {/* Futuristic Banner */}
      <div className="relative z-10 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900/60 to-slate-950 p-6 sm:p-10 shadow-2xl relative">
        <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-violet-600/10 blur-[90px] animate-pulse-slow"></div>
        
        <div className="relative max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest text-violet-400 font-mono">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500"></span>
            </span>
            SYSTEM ONLINE
          </span>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Control Center <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400">
              Multi-Agent RAG Audit
            </span>
          </h1>

          <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
            Evaluate, benchmark, and secure your enterprise Retrieval-Augmented Generation models. 
            Measure retrieval recall scores, verify context accuracy, and perform safety audits with state-of-the-art metrics.
          </p>

          <div className="flex flex-wrap gap-3 pt-4">
            <Link to="/projects" className="btn-premium-gradient px-5 py-2.5 text-xs">
              Open Workspaces
            </Link>
            <a href="#quickstart" className="btn-premium-secondary px-5 py-2.5 text-xs">
              Quickstart Guide
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid: Data & Performance Charts */}
      <div className="relative z-10 grid gap-6 lg:grid-cols-3">
        {/* Left Side: Stats tiles */}
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
          {loading ? (
            <div className="sm:col-span-2 flex flex-col items-center justify-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              <p className="text-xs text-slate-500 mt-3 font-mono">LOADING SYSTEM METRICS...</p>
            </div>
          ) : error ? (
            <div className="sm:col-span-2 rounded-2xl bg-red-950/20 border border-red-500/20 p-4 text-xs text-red-200 shadow-lg font-mono">
              [CRITICAL ERROR]: {error}
            </div>
          ) : (
            metrics.map((card) => (
              <div
                key={card.label}
                className={`premium-card bg-gradient-to-br ${card.color} ${card.borderColor} flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">
                    {card.label}
                  </span>
                  <div className="h-8 w-8 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-center text-slate-450 shadow-inner">
                    {card.icon}
                  </div>
                </div>

                <div className="mt-6 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    {card.value}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800 ${card.textColor} font-mono`}>
                    ACTIVE
                  </span>
                </div>
                <p className="mt-2 text-[10px] text-slate-500 leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Right Side: Glowing Performance Donut Charts using React SVGs */}
        <div className="lg:col-span-1 glass-panel rounded-3xl p-6 border border-slate-800 bg-slate-950/40 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5 uppercase font-mono text-violet-400">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400"></span>
              Global Target Accuracy
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Consolidated evaluation results matching target LLM faithfulness guidelines.
            </p>
          </div>

          <div className="flex justify-center items-center py-6 relative">
            {/* Embedded glowing SVG chart */}
            <svg className="w-36 h-36 transform -rotate-90">
              <circle cx="72" cy="72" r="60" className="stroke-slate-900" strokeWidth="12" fill="transparent" />
              <circle cx="72" cy="72" r="60" className="stroke-violet-500" strokeWidth="12" fill="transparent" 
                strokeDasharray="377" strokeDashoffset="45" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.4))' }} />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white tracking-tight">88%</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono">FIDELITY</span>
            </div>
          </div>

          {/* Performance items */}
          <div className="space-y-2 border-t border-slate-900 pt-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <span className="h-2 w-2 rounded bg-violet-500"></span>
                Faithfulness
              </span>
              <span className="font-mono font-bold text-slate-200">92.4%</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <span className="h-2 w-2 rounded bg-indigo-500"></span>
                Context Recall
              </span>
              <span className="font-mono font-bold text-slate-200">84.1%</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <span className="h-2 w-2 rounded bg-cyan-400"></span>
                Answer Relevance
              </span>
              <span className="font-mono font-bold text-slate-200">87.5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Roadmap Guide */}
      <div id="quickstart" className="relative z-10 glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 bg-slate-950/40 backdrop-blur-xl">
        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-400" />
          Implementation Pipeline Guide
        </h3>
        <p className="text-xs text-slate-450 mt-1.5">Follow this structured flow to set up and run a full evaluation workflow.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-slate-950/50 border border-slate-900 relative group hover:bg-slate-950/80 transition-all hover:border-slate-800">
              <div className="absolute top-4 right-4 text-[10px] font-mono font-bold text-slate-700 tracking-wider">
                STAGE {step.num}
              </div>
              
              <div className="h-7 w-7 rounded-lg bg-violet-650/10 border border-violet-500/25 flex items-center justify-center text-violet-400 text-xs font-black group-hover:bg-violet-500 group-hover:text-white transition-all">
                {step.num}
              </div>

              <h4 className="mt-4 text-xs sm:text-sm font-bold text-white tracking-tight">
                {step.title}
              </h4>
              <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}