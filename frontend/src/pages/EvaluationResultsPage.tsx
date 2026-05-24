import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getEvaluationRun } from "../api/evaluations";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Award,
  Zap,
} from "lucide-react";

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
    if (score === null || score === undefined) return "text-slate-400 bg-slate-900 border border-slate-800";
    if (score >= 0.7) return "text-emerald-450 bg-emerald-500/10 border border-emerald-500/20";
    if (score >= 0.4) return "text-amber-455 bg-amber-500/10 border border-amber-500/20";
    return "text-red-450 bg-red-500/10 border border-red-500/20";
  }

  function getMetricStatusLabel(score: number | null | undefined) {
    if (score === null || score === undefined) return "N/A";
    if (score >= 0.7) return "High";
    if (score >= 0.4) return "Medium";
    return "Low";
  }

  return (
    <div className="space-y-8 animate-slide-up relative">
      {/* Decorative Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 right-1/4 h-80 w-80 rounded-full bg-violet-650/5 blur-[120px] animate-float"></div>
        <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-indigo-650/5 blur-[110px] animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Top Header Row */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
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
          <ArrowLeft className="h-4 w-4" />
          Back to Evaluations
        </Link>
      </div>

      {loading && (
        <div className="relative z-10 flex flex-col items-center gap-3 py-20 justify-center bg-slate-900/10 border border-slate-900 rounded-3xl animate-pulse">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          <p className="text-xs text-slate-500 font-mono tracking-widest">LOADING AUDIT REPORTS...</p>
        </div>
      )}

      {error && (
        <div className="relative z-10 rounded-2xl bg-red-950/20 border border-red-500/20 p-4 text-sm text-red-200 shadow-lg flex gap-3 animate-fade-in">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && run && (
        <>
          {/* Top general statistics box */}
          <div className="relative z-10 glass-panel rounded-3xl p-6 shadow-2xl border border-slate-800/80 bg-slate-900/40">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">
                    {run.name || "Batch Evaluation Run"}
                  </h2>
                  <span className="status-badge bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {run.status || "completed"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500 font-semibold font-mono tracking-widest uppercase">
                  <span>RUN ID: {run.id?.substring(0, 8) || batchRunId?.substring(0, 8)}...</span>
                  <span>•</span>
                  <span>DATASET ID: {run.dataset_id?.substring(0, 8) || datasetId?.substring(0, 8)}...</span>
                </div>
              </div>
            </div>

            {/* Visual Dials Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Total Test Cases</p>
                <p className="text-2xl font-extrabold text-white leading-none">
                  {run.total_test_cases ?? results.length ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Passed Suite Cases</p>
                <p className="text-2xl font-extrabold text-emerald-400 leading-none">
                  {run.passed_test_cases ?? 0} <span className="text-sm text-slate-550 font-medium">/ {run.total_test_cases ?? results.length ?? 0}</span>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Average RAG Score</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-extrabold text-white leading-none font-mono">
                    {run.average_score ?? 0}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border leading-none shrink-0 ${run.average_score && run.average_score >= 0.7 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : run.average_score && run.average_score >= 0.4 ? "text-amber-405 bg-amber-500/10 border-amber-500/20" : "text-red-405 bg-red-500/10 border-red-500/20"}`}>
                    {run.average_score && run.average_score >= 0.7 ? "EXCELLENT" : run.average_score && run.average_score >= 0.4 ? "MODERATE" : "CRITICAL"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Results details list */}
          <div className="relative z-10 space-y-6">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-indigo-400 animate-pulse" />
              Inspection Reports ({results.length})
            </h2>

            {results.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/10 p-12 text-center shadow-inner">
                <Award className="mx-auto h-12 w-12 text-slate-700 animate-pulse" />
                <h3 className="mt-4 text-sm font-bold text-slate-450">No Results Found</h3>
                <p className="mt-1 text-xs text-slate-550">Individual test cases evaluation results logs are empty.</p>
              </div>
            )}

            {results.length > 0 && (
              <div className="grid gap-6 animate-fade-in">
                {results.map((result, idx) => (
                  <div
                    key={result.id}
                    className="premium-card relative overflow-hidden group hover:border-violet-500/30 p-6 bg-slate-900/20 neon-border"
                  >
                    <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-indigo-500 to-violet-500 opacity-60"></div>

                    {/* Header bar */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-850 pb-4 mb-4">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 font-mono">QUERY PROMPT</span>
                        <h3 className="font-bold text-white text-base mt-1.5 leading-snug tracking-tight">
                          {result.question || "Test Case query prompt placeholder"}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1.5 uppercase shadow-sm border font-mono ${
                            result.passed
                              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-450"
                              : "bg-red-500/10 border-red-500/25 text-red-450"
                          }`}
                        >
                          {result.passed ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          {result.passed ? "Passed" : "Failed"}
                        </span>

                        <span className="bg-slate-950 border border-slate-800 text-[9px] text-violet-400 font-extrabold px-2.5 py-1 rounded-md tracking-wider font-mono">
                          CASE #{idx + 1}
                        </span>
                      </div>
                    </div>

                    {/* Split comparison panels */}
                    <div className="grid gap-4 md:grid-cols-2 mt-4">
                      {/* Left: Expected Ground Truth */}
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-mono">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Expected Ground-Truth
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed font-mono select-all mt-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {result.expected_answer || "No expected ground-truth configured."}
                          </p>
                        </div>
                      </div>

                      {/* Right: LLM Generated Answer */}
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-violet-400 flex items-center gap-1.5 font-mono">
                            <Zap className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
                            LLM Generated Answer
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed font-mono select-all mt-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {result.generated_answer || "No generated response captured."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quality metrics 4-column display */}
                    <div className="mt-5 space-y-2.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 font-mono">RAG Alignment Quality Scores</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Faithfulness */}
                        <div className={`rounded-xl border p-3 flex flex-col justify-between space-y-1.5 ${getMetricBadgeClass(result.faithfulness_score)}`}>
                          <div>
                            <p className="text-[9px] font-extrabold uppercase tracking-wider opacity-60 font-mono">Faithfulness</p>
                            <p className="text-[8px] font-medium leading-none opacity-50 mt-0.5">Fact checks ground truth</p>
                          </div>
                          <div className="flex items-baseline justify-between gap-1.5 mt-2">
                            <p className="text-lg font-extrabold font-mono leading-none">
                              {result.faithfulness_score ?? 0}
                            </p>
                            <span className="text-[9px] font-bold uppercase leading-none opacity-85 font-mono">
                              {getMetricStatusLabel(result.faithfulness_score)}
                            </span>
                          </div>
                        </div>

                        {/* Relevance */}
                        <div className={`rounded-xl border p-3 flex flex-col justify-between space-y-1.5 ${getMetricBadgeClass(result.relevance_score)}`}>
                          <div>
                            <p className="text-[9px] font-extrabold uppercase tracking-wider opacity-60 font-mono">Relevance</p>
                            <p className="text-[8px] font-medium leading-none opacity-50 mt-0.5">Contextual alignment</p>
                          </div>
                          <div className="flex items-baseline justify-between gap-1.5 mt-2">
                            <p className="text-lg font-extrabold font-mono leading-none">
                              {result.relevance_score ?? 0}
                            </p>
                            <span className="text-[9px] font-bold uppercase leading-none opacity-85 font-mono">
                              {getMetricStatusLabel(result.relevance_score)}
                            </span>
                          </div>
                        </div>

                        {/* Correctness */}
                        <div className={`rounded-xl border p-3 flex flex-col justify-between space-y-1.5 ${getMetricBadgeClass(result.correctness_score)}`}>
                          <div>
                            <p className="text-[9px] font-extrabold uppercase tracking-wider opacity-60 font-mono">Correctness</p>
                            <p className="text-[8px] font-medium leading-none opacity-50 mt-0.5">Semantic evaluation</p>
                          </div>
                          <div className="flex items-baseline justify-between gap-1.5 mt-2">
                            <p className="text-lg font-extrabold font-mono leading-none">
                              {result.correctness_score ?? 0}
                            </p>
                            <span className="text-[9px] font-bold uppercase leading-none opacity-85 font-mono">
                              {getMetricStatusLabel(result.correctness_score)}
                            </span>
                          </div>
                        </div>

                        {/* Overall */}
                        <div className={`rounded-xl border p-3 flex flex-col justify-between space-y-1.5 ${getMetricBadgeClass(result.overall_score)}`}>
                          <div>
                            <p className="text-[9px] font-extrabold uppercase tracking-wider opacity-60 font-mono">Overall</p>
                            <p className="text-[8px] font-medium leading-none opacity-50 mt-0.5">Weighted composition</p>
                          </div>
                          <div className="flex items-baseline justify-between gap-1.5 mt-2">
                            <p className="text-lg font-extrabold font-mono leading-none">
                              {result.overall_score ?? 0}
                            </p>
                            <span className="text-[9px] font-bold uppercase leading-none opacity-85 font-mono">
                              {getMetricStatusLabel(result.overall_score)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Result ID tag */}
                    <div className="mt-5 pt-3 border-t border-slate-850/80 flex items-center gap-1.5 text-[9px] text-slate-500 font-semibold font-mono tracking-widest uppercase">
                      <FileText className="h-3.5 w-3.5 text-slate-655" />
                      RESULT ID: <span className="text-slate-350 select-all font-sans font-bold bg-slate-950 border border-slate-900 rounded px-1.5 py-0.5">{result.id}</span>
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