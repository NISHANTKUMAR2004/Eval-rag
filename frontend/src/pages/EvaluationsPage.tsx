import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { listDatasets } from "../api/datasets";
import {
  createEvaluationRun,
  listEvaluationRuns,
} from "../api/evaluations";

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

      setSuccess("Evaluation run created successfully.");
      setRunName("");

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
    if (score >= 0.7) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 0.4) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-red-400 bg-red-500/10 border-red-500/20";
  }

  function getScoreStatusText(score: number | null | undefined) {
    if (score === null || score === undefined) return "N/A";
    if (score >= 0.7) return "EXCELLENT";
    if (score >= 0.4) return "MODERATE";
    return "CRITICAL";
  }

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
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
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Projects
        </Link>
      </div>

      {/* Structured Split Grid Layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Create Run panel */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-3xl p-6 shadow-2xl border border-slate-800/80 sticky top-24">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-4">
              <svg className="h-5 w-5 text-violet-400 animate-pulse-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Trigger Run
            </h2>

            <form onSubmit={handleCreateRun} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Run Name Label
                </label>
                <input
                  className="input-premium"
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
                  className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition-all duration-300 focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20 focus:shadow-[0_0_15px_rgba(139,92,246,0.1)] cursor-pointer text-sm"
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
                className="w-full btn-premium-gradient py-2.5 flex items-center justify-center gap-2 text-sm disabled:opacity-40"
              >
                {creating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Running Evaluation...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Execute Batch Run</span>
                  </>
                )}
              </button>
            </form>

            {datasets.length === 0 && (
              <div className="mt-4 rounded-xl bg-violet-950/20 border border-violet-500/20 px-4 py-3 text-xs text-violet-300 shadow-sm flex gap-2">
                <svg className="h-4.5 w-4.5 text-violet-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>No datasets available. Please register a dataset and test suite first.</span>
              </div>
            )}

            {success && (
              <div className="mt-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 px-4 py-3 text-xs text-emerald-300 shadow-sm flex gap-2">
                <svg className="h-4 w-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl bg-red-950/40 border border-red-500/30 px-4 py-3 text-xs text-red-300 shadow-sm flex gap-2">
                <svg className="h-4 w-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: List of Evaluation Runs */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-2">
            <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Audit Evaluation History ({runs.length})
          </h2>

          {loading && (
            <div className="flex items-center gap-3 py-6 justify-center bg-slate-900/20 border border-slate-800/40 rounded-2xl">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-800 border-t-violet-500"></div>
              <p className="text-sm text-slate-500 font-medium">Fetching evaluation data...</p>
            </div>
          )}

          {loadingRuns && !loading && (
            <div className="flex items-center gap-3 py-6 justify-center bg-slate-900/20 border border-slate-800/40 rounded-2xl animate-pulse">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-800 border-t-violet-500"></div>
              <p className="text-sm text-slate-500 font-medium font-mono">Synchronizing historical batch reports...</p>
            </div>
          )}

          {!loading && !loadingRuns && runs.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 p-10 text-center shadow-inner">
              <svg className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-4 text-sm font-bold text-slate-400">No Job Logs Discovered</h3>
              <p className="mt-1 text-xs text-slate-500">Select a dataset containing test cases and click "Execute Batch Run" to start.</p>
            </div>
          )}

          {!loading && !loadingRuns && runs.length > 0 && (
            <div className="grid gap-5">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="premium-card relative overflow-hidden group hover:border-violet-500/30 p-5 bg-slate-900/20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Metric icon */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base tracking-tight group-hover:text-violet-400 transition-colors">
                          {run.name || "Evaluation Run"}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500 font-semibold font-mono tracking-wide uppercase">
                          <span>RUN ID: {run.id}</span>
                          <span>•</span>
                          <span>DATASET ID: {run.dataset_id || selectedDatasetId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="self-start sm:self-auto shrink-0">
                      <span className="status-badge bg-violet-500/10 border border-violet-500/20 text-violet-400 uppercase text-[9px] font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse"></span>
                        {run.status || "created"}
                      </span>
                    </div>
                  </div>

                  {/* Core Metrics Visual Dials */}
                  <div className="mt-5 grid grid-cols-3 gap-4">
                    {/* Total Cases */}
                    <div className="rounded-xl border border-slate-850/60 bg-slate-950/40 p-3 space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Cases</p>
                      <p className="text-xl font-extrabold text-white leading-none">
                        {run.total_test_cases ?? 0}
                      </p>
                    </div>

                    {/* Passed Cases */}
                    <div className="rounded-xl border border-slate-850/60 bg-slate-950/40 p-3 space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Passed Cases</p>
                      <p className="text-xl font-extrabold text-emerald-400 leading-none">
                        {run.passed_test_cases ?? 0} <span className="text-xs text-slate-500 font-medium">/ {run.total_test_cases ?? 0}</span>
                      </p>
                    </div>

                    {/* Average score */}
                    <div className="rounded-xl border border-slate-850/60 bg-slate-950/40 p-3 space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Score</p>
                      <div className="flex items-baseline gap-1.5">
                        <p className="text-xl font-extrabold text-white leading-none">
                          {run.average_score ?? 0}
                        </p>
                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border leading-none shrink-0 ${getScoreColorClass(run.average_score)}`}>
                          {getScoreStatusText(run.average_score)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* View Details Action */}
                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-end">
                    <Link
                      to={`/projects/${projectId}/datasets/${
                        run.dataset_id || selectedDatasetId
                      }/batch-runs/${run.id}`}
                      className="btn-premium-gradient px-4.5 py-2 text-xs flex items-center gap-1.5"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
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