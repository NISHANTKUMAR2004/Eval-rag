import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { listDatasets } from "../api/datasets";
import {
  createEvaluationRun,
  listEvaluationRuns,
} from "../api/evaluations";
import {
  ArrowLeft,
  Play,
  History,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  TrendingUp,
} from "lucide-react";

type DatasetItem = {
  id: string;
  name: string;
  description?: string | null;
};

type EvaluationRunItem = {
  id: string;
  project_id?: string;
  dataset_id: string;
  name?: string | null;
  status?: string | null;
  total_test_cases?: number | null;
  passed_test_cases?: number | null;
  average_score?: number | null;
  created_at?: string;
  updated_at?: string;
};

export default function EvaluationsPage() {
  const { projectId } = useParams();

  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [runs, setRuns] = useState<EvaluationRunItem[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [runName, setRunName] = useState("Demo Evaluation Run");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [loadingRuns, setLoadingRuns] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function normalizeRuns(data: any): EvaluationRunItem[] {
    return (
      data.batch_runs ||
      data.batch_evaluations ||
      data.evaluation_runs ||
      data.runs ||
      []
    );
  }

  async function fetchRunsForDataset(datasetId: string) {
    if (!projectId || !datasetId) return;

    try {
      setLoadingRuns(true);
      setError("");

      const runsData = await listEvaluationRuns(projectId, datasetId);
      setRuns(normalizeRuns(runsData));
    } catch (err) {
      setRuns([]);
      setError("Could not load evaluation runs for selected dataset.");
    } finally {
      setLoadingRuns(false);
    }
  }

  async function fetchData() {
    if (!projectId) return;

    try {
      setLoading(true);
      setError("");

      const datasetsData = await listDatasets(projectId);
      const loadedDatasets = datasetsData.datasets || [];

      setDatasets(loadedDatasets);

      if (loadedDatasets.length === 0) {
        setSelectedDatasetId("");
        setRuns([]);
        return;
      }

      const datasetIdToUse = selectedDatasetId || loadedDatasets[0].id;
      setSelectedDatasetId(datasetIdToUse);

      const runsData = await listEvaluationRuns(projectId, datasetIdToUse);
      setRuns(normalizeRuns(runsData));
    } catch (err) {
      setError("Could not load evaluation data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleDatasetChange(datasetId: string) {
    setSelectedDatasetId(datasetId);
    setSuccess("");

    if (!datasetId) {
      setRuns([]);
      return;
    }

    await fetchRunsForDataset(datasetId);
  }

  async function handleCreateRun(event: FormEvent) {
    event.preventDefault();

    if (!projectId || !selectedDatasetId) {
      setError("Please create/select a dataset first.");
      return;
    }

    setError("");
    setSuccess("");
    setCreating(true);

    try {
      await createEvaluationRun(projectId, {
        dataset_id: selectedDatasetId,
        name: runName,
      });

      setSuccess("Evaluation run triggered successfully. Model audit live.");
      setRunName("Evaluation Run #" + Math.floor(Math.random() * 1000));

      await fetchRunsForDataset(selectedDatasetId);
    } catch (err) {
      setError("Could not create evaluation run.");
    } finally {
      setCreating(false);
    }
  }

  // Helper to color grade the average score
  function getScoreColorClass(score: number | null | undefined) {
    if (score === null || score === undefined) return "text-slate-400";
    if (score >= 0.7) return "text-emerald-450 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 0.4) return "text-amber-450 bg-amber-500/10 border-amber-500/20";
    return "text-red-450 bg-red-500/10 border-red-500/20";
  }

  function getScoreStatusText(score: number | null | undefined) {
    if (score === null || score === undefined) return "N/A";
    if (score >= 0.7) return "EXCELLENT";
    if (score >= 0.4) return "MODERATE";
    return "CRITICAL";
  }

  return (
    <div className="space-y-8 animate-slide-up relative">
      {/* Decorative Blur Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 right-1/4 h-80 w-80 rounded-full bg-violet-650/5 blur-[120px] animate-float"></div>
        <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-indigo-650/5 blur-[110px] animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Top Header Row */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            Evaluation <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">Runs</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Execute verification jobs against selected golden datasets and audit answer validation reports.
          </p>
        </div>

        <Link
          to="/projects"
          className="btn-premium-secondary px-5 py-2.5 flex items-center gap-2 text-sm self-start sm:self-center"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
      </div>

      {/* Structured Split Grid Layout */}
      <div className="relative z-10 grid gap-8 lg:grid-cols-3">
        {/* Left Column: Create Run panel */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-3xl p-6 shadow-2xl border border-slate-800/80 sticky top-28 bg-slate-950/40">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-4">
              <Play className="h-5 w-5 text-violet-400 animate-pulse" />
              Trigger Run
            </h2>

            <form onSubmit={handleCreateRun} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Run Name Label
                </label>
                <input
                  className="input-premium text-sm"
                  value={runName}
                  onChange={(event) => setRunName(event.target.value)}
                  placeholder="Enter run label"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Target Dataset
                </label>
                <select
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition-all duration-300 focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20 focus:shadow-[0_0_15px_rgba(139,92,246,0.1)] cursor-pointer text-sm"
                  value={selectedDatasetId}
                  onChange={(event) => handleDatasetChange(event.target.value)}
                  required
                >
                  {datasets.length === 0 && (
                    <option value="" className="bg-slate-950">No datasets found</option>
                  )}

                  {datasets.map((dataset) => (
                    <option key={dataset.id} value={dataset.id} className="bg-slate-950 text-slate-200 py-2">
                      {dataset.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                disabled={creating || datasets.length === 0}
                className="w-full btn-premium-gradient py-3 flex items-center justify-center gap-2 text-sm disabled:opacity-40"
              >
                {creating ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 text-white" />
                    <span>Running Evaluation...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4.5 w-4.5" />
                    <span>Execute Batch Run</span>
                  </>
                )}
              </button>
            </form>

            {datasets.length === 0 && (
              <div className="mt-4 rounded-xl bg-violet-500/10 border border-violet-500/20 px-4 py-3 text-xs text-violet-300 shadow-sm flex gap-2 animate-fade-in">
                <AlertCircle className="h-4.5 w-4.5 text-violet-400 shrink-0 mt-0.5" />
                <span>No datasets available. Please register a dataset and test suite first.</span>
              </div>
            )}

            {success && (
              <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-3 text-xs text-emerald-355 shadow-sm flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-3 text-xs text-red-355 shadow-sm flex items-center gap-2 animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: List of Evaluation Runs */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-2">
            <History className="h-5 w-5 text-indigo-400" />
            Audit Evaluation History ({runs.length})
          </h2>

          {loading && (
            <div className="flex flex-col items-center gap-3 py-16 justify-center bg-slate-900/10 border border-slate-900 rounded-3xl animate-pulse">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              <p className="text-xs text-slate-500 font-mono tracking-widest">LOADING HISTORICAL RUNS...</p>
            </div>
          )}

          {loadingRuns && !loading && (
            <div className="flex items-center gap-3 py-6 justify-center bg-slate-900/10 border border-slate-900 rounded-2xl animate-pulse">
              <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
              <p className="text-xs text-slate-450 font-mono tracking-wider">Synchronizing historical batch reports...</p>
            </div>
          )}

          {!loading && !loadingRuns && runs.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/10 p-12 text-center shadow-inner animate-fade-in">
              <Sparkles className="mx-auto h-12 w-12 text-slate-700 animate-pulse" />
              <h3 className="mt-4 text-sm font-bold text-slate-400">No Job Logs Discovered</h3>
              <p className="mt-1 text-xs text-slate-500">Select a dataset containing test cases and click "Execute Batch Run" to start.</p>
            </div>
          )}

          {!loading && !loadingRuns && runs.length > 0 && (
            <div className="grid gap-5 animate-fade-in">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="premium-card relative overflow-hidden group hover:border-violet-500/30 p-5 bg-slate-900/20 neon-border"
                >
                  <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-indigo-500 to-violet-500 opacity-60"></div>

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Metric icon */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/25 text-violet-400">
                        <TrendingUp className="h-5 w-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base tracking-tight group-hover:text-violet-400 transition-colors duration-300">
                          {run.name || "Evaluation Run"}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500 font-semibold font-mono tracking-widest uppercase">
                          <span>RUN ID: {run.id.substring(0, 8)}...</span>
                          <span>•</span>
                          <span>DATASET ID: {(run.dataset_id || selectedDatasetId).substring(0, 8)}...</span>
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="self-start sm:self-auto shrink-0">
                      <span className="status-badge bg-violet-500/10 border border-violet-500/20 text-violet-400 font-mono text-[9px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse"></span>
                        {run.status || "completed"}
                      </span>
                    </div>
                  </div>

                  {/* Core Metrics Visual Dials */}
                  <div className="mt-5 grid grid-cols-3 gap-4">
                    {/* Total Cases */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Total Cases</p>
                      <p className="text-xl font-extrabold text-white leading-none">
                        {run.total_test_cases ?? 0}
                      </p>
                    </div>

                    {/* Passed Cases */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Passed Cases</p>
                      <p className="text-xl font-extrabold text-emerald-400 leading-none">
                        {run.passed_test_cases ?? 0} <span className="text-xs text-slate-500 font-medium">/ {run.total_test_cases ?? 0}</span>
                      </p>
                    </div>

                    {/* Average score */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Avg Score</p>
                      <div className="flex items-baseline gap-1.5">
                        <p className="text-xl font-extrabold text-white leading-none font-mono">
                          {run.average_score ?? 0}
                        </p>
                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border leading-none shrink-0 ${getScoreColorClass(run.average_score)}`}>
                          {getScoreStatusText(run.average_score)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* View Details Action */}
                  <div className="mt-5 border-t border-slate-850/80 pt-4 flex justify-end">
                    <Link
                      to={`/projects/${projectId}/datasets/${
                        run.dataset_id || selectedDatasetId
                      }/batch-runs/${run.id}`}
                      className="btn-premium-gradient px-4.5 py-2 text-xs flex items-center gap-1.5"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Run Results</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}