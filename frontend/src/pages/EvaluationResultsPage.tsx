import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getEvaluationRun } from "../api/evaluations";

type EvaluationResultItem = {
  id: string;
  evaluation_run_id?: string;
  batch_run_id?: string;
  test_case_id?: string;
  question?: string | null;
  expected_answer?: string | null;
  generated_answer?: string | null;
  faithfulness_score?: number | null;
  relevance_score?: number | null;
  correctness_score?: number | null;
  overall_score?: number | null;
  passed?: boolean | null;
  created_at?: string;
};

type BatchRunDetail = {
  id?: string;
  name?: string | null;
  status?: string | null;
  dataset_id?: string;
  project_id?: string;
  total_test_cases?: number | null;
  passed_test_cases?: number | null;
  average_score?: number | null;
  results?: EvaluationResultItem[];
  evaluation_results?: EvaluationResultItem[];
  batch_results?: EvaluationResultItem[];
};

export default function EvaluationResultsPage() {
  const { projectId, datasetId, batchRunId } = useParams();

  const [run, setRun] = useState<BatchRunDetail | null>(null);
  const [results, setResults] = useState<EvaluationResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function normalizeResults(data: any): EvaluationResultItem[] {
    return data.results || data.evaluation_results || data.batch_results || [];
  }

  async function fetchRun() {
    if (!projectId || !datasetId || !batchRunId) return;

    try {
      setLoading(true);
      setError("");

      const data = await getEvaluationRun(projectId, datasetId, batchRunId);

      setRun(data);
      setResults(normalizeResults(data));
    } catch (err) {
      setError("Could not load evaluation run.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, datasetId, batchRunId]);

  // Color helpers for metrics
  function getMetricBadgeClass(score: number | null | undefined) {
    if (score === null || score === undefined) return "text-slate-400 bg-slate-500/10 border border-slate-800";
    if (score >= 0.7) return "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20";
    if (score >= 0.4) return "text-amber-400 bg-amber-500/10 border border-amber-500/20";
    return "text-red-400 bg-red-500/10 border border-red-500/20";
  }

  function getMetricStatusLabel(score: number | null | undefined) {
    if (score === null || score === undefined) return "N/A";
    if (score >= 0.7) return "High";
    if (score >= 0.4) return "Medium";
    return "Low";
  }

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Audit <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">Reports</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Audit ground-truth alignments, factual faithfulness metrics, and semantic accuracy aggregates.
          </p>
        </div>

        <Link
          to={`/projects/${projectId}/evaluations`}
          className="btn-premium-secondary px-5 py-2.5 flex items-center gap-2 text-sm self-start sm:self-center"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Evaluations
        </Link>
      </div>

      {loading && (
        <div className="flex items-center gap-3 py-12 justify-center bg-slate-900/20 border border-slate-800/40 rounded-2xl">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-800 border-t-violet-500"></div>
          <p className="text-sm text-slate-500 font-medium">Loading evaluation reports...</p>
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

      {!loading && !error && run && (
        <>
          {/* Top general statistics box */}
          <div className="glass-panel rounded-3xl p-6 shadow-2xl border border-slate-800/80 bg-slate-900/40">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">
                    {run.name || "Batch Evaluation Run"}
                  </h2>
                  <span className="status-badge bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase text-[9px] font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {run.status || "completed"}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500 font-semibold font-mono tracking-wide uppercase">
                  <span>RUN ID: {run.id || batchRunId}</span>
                  <span>•</span>
                  <span>DATASET ID: {run.dataset_id || datasetId}</span>
                </div>
              </div>
            </div>

            {/* Visual Dials Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-850/60 bg-slate-950/40 p-4 space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Test Cases</p>
                <p className="text-2xl font-extrabold text-white leading-none">
                  {run.total_test_cases ?? results.length ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-850/60 bg-slate-950/40 p-4 space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Passed Suite Cases</p>
                <p className="text-2xl font-extrabold text-emerald-400 leading-none">
                  {run.passed_test_cases ?? 0} <span className="text-sm text-slate-500 font-medium">/ {run.total_test_cases ?? results.length ?? 0}</span>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-850/60 bg-slate-950/40 p-4 space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average RAG Score</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-extrabold text-white leading-none">
                    {run.average_score ?? 0}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border leading-none shrink-0 ${run.average_score && run.average_score >= 0.7 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : run.average_score && run.average_score >= 0.4 ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"}`}>
                    {run.average_score && run.average_score >= 0.7 ? "EXCELLENT" : run.average_score && run.average_score >= 0.4 ? "MODERATE" : "CRITICAL"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Results details list */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-2">
              <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Inspection Reports ({results.length})
            </h2>

            {results.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 p-10 text-center shadow-inner">
                <svg className="mx-auto h-12 w-12 text-slate-650" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-sm font-bold text-slate-450">No Results Found</h3>
                <p className="mt-1 text-xs text-slate-550">Individual test cases evaluation results logs are empty.</p>
              </div>
            )}

            {results.length > 0 && (
              <div className="grid gap-6">
                {results.map((result, idx) => (
                  <div
                    key={result.id}
                    className="premium-card relative overflow-hidden group hover:border-violet-500/30 p-6 bg-slate-900/20"
                  >
                    {/* Header bar */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">QUERY PROMPT</span>
                        <h3 className="font-bold text-white text-base mt-0.5 leading-snug tracking-tight">
                          {result.question || "Test Case query prompt placeholder"}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Passed badge indicator */}
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1.5 uppercase shadow-sm border ${
                            result.passed
                              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                              : "bg-red-500/10 border-red-500/25 text-red-400"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${result.passed ? "bg-emerald-400" : "bg-red-400"} animate-pulse`}></span>
                          {result.passed ? "Passed" : "Failed"}
                        </span>

                        <span className="bg-slate-950/80 border border-slate-850 text-[9px] text-violet-400 font-extrabold px-2 py-1 rounded-md tracking-wider">
                          CASE #{idx + 1}
                        </span>
                      </div>
                    </div>

                    {/* Split comparison panels */}
                    <div className="grid gap-4 md:grid-cols-2 mt-4">
                      {/* Left: Expected Ground Truth */}
                      <div className="rounded-2xl border border-emerald-500/10 bg-slate-950/40 p-4 space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Expected Ground-Truth
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed font-mono select-all mt-2 max-h-48 overflow-y-auto">
                            {result.expected_answer || "No expected ground-truth configured."}
                          </p>
                        </div>
                      </div>

                      {/* Right: LLM Generated Answer */}
                      <div className="rounded-2xl border border-violet-500/10 bg-slate-950/40 p-4 space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                            <svg className="h-3 w-3 animate-pulse-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            LLM Generated Answer
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed font-mono select-all mt-2 max-h-48 overflow-y-auto">
                            {result.generated_answer || "No generated response captured."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quality metrics 4-column display */}
                    <div className="mt-5 space-y-2.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">RAG Alignment Quality Scores</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Faithfulness */}
                        <div className={`rounded-xl border p-3 flex flex-col justify-between space-y-1.5 ${getMetricBadgeClass(result.faithfulness_score)}`}>
                          <div>
                            <p className="text-[9px] font-extrabold uppercase tracking-wider opacity-60">Faithfulness</p>
                            <p className="text-[8px] font-medium leading-none opacity-50 mt-0.5">Fact checks ground truth</p>
                          </div>
                          <div className="flex items-baseline justify-between gap-1.5">
                            <p className="text-lg font-extrabold font-mono leading-none">
                              {result.faithfulness_score ?? 0}
                            </p>
                            <span className="text-[9px] font-bold uppercase leading-none opacity-85">
                              {getMetricStatusLabel(result.faithfulness_score)}
                            </span>
                          </div>
                        </div>

                        {/* Relevance */}
                        <div className={`rounded-xl border p-3 flex flex-col justify-between space-y-1.5 ${getMetricBadgeClass(result.relevance_score)}`}>
                          <div>
                            <p className="text-[9px] font-extrabold uppercase tracking-wider opacity-60">Relevance</p>
                            <p className="text-[8px] font-medium leading-none opacity-50 mt-0.5">Contextual alignment</p>
                          </div>
                          <div className="flex items-baseline justify-between gap-1.5">
                            <p className="text-lg font-extrabold font-mono leading-none">
                              {result.relevance_score ?? 0}
                            </p>
                            <span className="text-[9px] font-bold uppercase leading-none opacity-85">
                              {getMetricStatusLabel(result.relevance_score)}
                            </span>
                          </div>
                        </div>

                        {/* Correctness */}
                        <div className={`rounded-xl border p-3 flex flex-col justify-between space-y-1.5 ${getMetricBadgeClass(result.correctness_score)}`}>
                          <div>
                            <p className="text-[9px] font-extrabold uppercase tracking-wider opacity-60">Correctness</p>
                            <p className="text-[8px] font-medium leading-none opacity-50 mt-0.5">Semantic evaluation</p>
                          </div>
                          <div className="flex items-baseline justify-between gap-1.5">
                            <p className="text-lg font-extrabold font-mono leading-none">
                              {result.correctness_score ?? 0}
                            </p>
                            <span className="text-[9px] font-bold uppercase leading-none opacity-85">
                              {getMetricStatusLabel(result.correctness_score)}
                            </span>
                          </div>
                        </div>

                        {/* Overall */}
                        <div className={`rounded-xl border p-3 flex flex-col justify-between space-y-1.5 ${getMetricBadgeClass(result.overall_score)}`}>
                          <div>
                            <p className="text-[9px] font-extrabold uppercase tracking-wider opacity-60">Overall</p>
                            <p className="text-[8px] font-medium leading-none opacity-50 mt-0.5">Weighted composition</p>
                          </div>
                          <div className="flex items-baseline justify-between gap-1.5">
                            <p className="text-lg font-extrabold font-mono leading-none">
                              {result.overall_score ?? 0}
                            </p>
                            <span className="text-[9px] font-bold uppercase leading-none opacity-85">
                              {getMetricStatusLabel(result.overall_score)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Result ID tag */}
                    <div className="mt-4 pt-2 border-t border-slate-800/40 flex items-center gap-1.5 text-[9px] text-slate-500 font-semibold font-mono tracking-wider uppercase">
                      <svg className="h-3 w-3 text-slate-650" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      RESULT ID: {result.id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}