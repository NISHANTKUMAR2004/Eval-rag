import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getDashboardStats } from "../api/dashboard";

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

  const cards = [
    {
      label: "Projects",
      value: stats.projects_count ?? stats.projects ?? 0,
    },
    {
      label: "Documents",
      value: stats.documents_count ?? stats.documents ?? 0,
    },
    {
      label: "Chunks",
      value: stats.chunks_count ?? stats.chunks ?? 0,
    },
    {
      label: "Datasets",
      value: stats.datasets_count ?? stats.datasets ?? 0,
    },
    {
      label: "Test Cases",
      value: stats.test_cases_count ?? stats.test_cases ?? 0,
    },
    {
      label: "Evaluation Runs",
      value: stats.evaluation_runs_count ?? stats.evaluation_runs ?? 0,
    },
  ];

  const cardIcons = [
    // Projects
    <svg className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>,
    // Documents
    <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>,
    // Chunks
    <svg className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>,
    // Datasets
    <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>,
    // Test Cases
    <svg className="h-6 w-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>,
    // Evaluation Runs
    <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>,
  ];

  const cardsExtended = cards.map((card, index) => ({
    ...card,
    icon: cardIcons[index],
    bgClass: [
      "from-violet-500/10 to-transparent border-violet-500/20 hover:border-violet-500/40",
      "from-indigo-500/10 to-transparent border-indigo-500/20 hover:border-indigo-500/40",
      "from-cyan-500/10 to-transparent border-cyan-500/20 hover:border-cyan-500/40",
      "from-emerald-500/10 to-transparent border-emerald-500/20 hover:border-emerald-500/40",
      "from-pink-500/10 to-transparent border-pink-500/20 hover:border-pink-500/40",
      "from-amber-500/10 to-transparent border-amber-500/20 hover:border-amber-500/40",
    ][index],
  }));

  const steps = [
    { num: 1, title: "Create a Project", desc: "Initialize a secure workspace environment for your RAG model evaluation." },
    { num: 2, title: "Upload Documents", desc: "Import your text base, PDFs, or Markdown files to populate the knowledge store." },
    { num: 3, title: "Verify Extracted Chunks", desc: "Ensure documents are split perfectly into granular token blocks for precise retrieval." },
    { num: 4, title: "Establish Datasets", desc: "Build test datasets to validate LLM performance against specific metrics." },
    { num: 5, title: "Generate Test Cases", desc: "Input clear evaluation questions with corresponding ground-truth reference expected answers." },
    { num: 6, title: "Trigger Batch Evaluation", desc: "Execute automated runs to measure Faithfulness, Relevance, and Correctness scores." },
  ];

  return (
    <div className="space-y-8">
      {/* Dynamic Header Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 p-8 md:p-10 shadow-2xl">
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -top-10 -right-10 h-72 w-72 rounded-full bg-violet-600/20 blur-[96px] animate-pulse"></div>
          <div className="absolute top-20 left-1/3 h-56 w-56 rounded-full bg-indigo-600/10 blur-[80px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 px-3.5 py-1.5 text-xs font-semibold tracking-wider uppercase text-violet-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
            Next-Gen RAG Evaluation
          </span>

          <h1 className="mt-5 text-3xl font-extrabold tracking-tight md:text-4xl text-white">
            EvalGuard <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400">AI Platform</span>
          </h1>

          <p className="mt-4 text-base leading-7 text-slate-400">
            Take complete control of your Retrieval-Augmented Generation evaluation pipelines. 
            Measure retrieval quality, verify token chunk extractions, construct test cases, and analyze 
            LLM answer accuracy with comprehensive quantitative metrics.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/projects"
              className="btn-premium-gradient px-6 py-3 text-sm flex items-center gap-2"
            >
              <span>Explore Projects</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              to="/projects"
              className="btn-premium-secondary px-6 py-3 text-sm flex items-center gap-2"
            >
              <span>Launch Evaluation Flow</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-violet-500"></div>
            <p className="text-sm font-medium text-slate-500">Gathering statistics...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-950/40 border border-red-500/30 p-4 text-sm text-red-200 shadow-lg shadow-red-950/20 flex gap-3">
          <svg className="h-5 w-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Dynamic Metrics */}
      {!loading && !error && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cardsExtended.map((card) => (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-2xl border bg-slate-900/30 p-6 backdrop-blur-sm shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br ${card.bgClass}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold tracking-wide text-slate-400 uppercase">
                  {card.label}
                </p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950/60 border border-slate-800 shadow-inner">
                  {card.icon}
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <p className="text-4xl font-extrabold text-white tracking-tight">
                  {card.value}
                </p>
                <span className="text-xs font-semibold text-slate-500">Active Node</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Structured Evaluation Demo Timeline Roadmap */}
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6 md:p-8 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight md:text-xl">
            Recommended Evaluation Flow
          </h2>
        </div>
        <p className="mt-1 text-sm text-slate-400">Follow these key stages to execute and review a complete RAG system quality analysis.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => (
            <div key={step.num} className="relative group flex flex-col p-5 rounded-2xl bg-slate-950/40 border border-slate-800/60 transition-all duration-300 hover:border-slate-700/60 hover:bg-slate-950/80">
              <div className="absolute top-4 right-4 text-xs font-bold text-slate-700 tracking-widest uppercase">
                Step 0{step.num}
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600/10 border border-violet-500/25 text-violet-400 text-sm font-extrabold shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-violet-600/20">
                {step.num}
              </div>
              <h3 className="mt-4 font-bold text-white tracking-tight">{step.title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500 group-hover:text-slate-400 transition-colors">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}