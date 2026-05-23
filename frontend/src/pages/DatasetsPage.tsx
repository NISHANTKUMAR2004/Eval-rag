import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { createDataset, listDatasets } from "../api/datasets";

type DatasetItem = {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
};

export default function DatasetsPage() {
  const { projectId } = useParams();

  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [name, setName] = useState("Demo Evaluation Dataset");
  const [description, setDescription] = useState(
    "Dataset for testing RAG answer quality"
  );
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function fetchDatasets() {
    if (!projectId) return;

    try {
      setError("");
      const data = await listDatasets(projectId);
      setDatasets(data.datasets || []);
    } catch (err) {
      setError("Could not load datasets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDatasets();
  }, [projectId]);

  async function handleCreateDataset(event: FormEvent) {
    event.preventDefault();

    if (!projectId) {
      setError("Project ID missing.");
      return;
    }

    setError("");
    setSuccess("");
    setCreating(true);

    try {
      await createDataset(projectId, {
        name,
        description,
      });

      setSuccess("Dataset created successfully.");
      setName("");
      setDescription("");
      await fetchDatasets();
    } catch (err) {
      setError("Could not create dataset.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Evaluation <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">Datasets</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Configure datasets, test suites, and expected ground-truth answers for pipeline validation.
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

      {/* Structured columns (similar to DocumentsPage) */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Form config */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-3xl p-6 shadow-2xl border border-slate-800/80 sticky top-24">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-4">
              <svg className="h-5 w-5 text-violet-400 animate-pulse-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Create Dataset
            </h2>

            <form onSubmit={handleCreateDataset} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Dataset Name
                </label>
                <input
                  className="input-premium"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter dataset name"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  className="input-premium resize-none"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Enter dataset description"
                  rows={3}
                />
              </div>

              <button
                disabled={creating}
                className="w-full btn-premium-gradient py-2.5 flex items-center justify-center gap-2 text-sm disabled:opacity-40"
              >
                {creating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Create Dataset</span>
                  </>
                )}
              </button>
            </form>

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

        {/* Right Column: Datasets List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-2">
            <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Available Datasets
          </h2>

          {loading && (
            <div className="flex items-center gap-3 py-6 justify-center bg-slate-900/20 border border-slate-800/40 rounded-2xl">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-800 border-t-violet-500"></div>
              <p className="text-sm text-slate-500 font-medium">Fetching datasets...</p>
            </div>
          )}

          {!loading && datasets.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 p-10 text-center shadow-inner">
              <svg className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-4 text-sm font-bold text-slate-400">No Datasets Found</h3>
              <p className="mt-1 text-xs text-slate-500">Create your first evaluation dataset to register validation test cases.</p>
            </div>
          )}

          {!loading && datasets.length > 0 && (
            <div className="grid gap-4">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className="premium-card relative overflow-hidden group hover:border-violet-500/30 p-5 bg-slate-900/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      {/* Custom Icon for Dataset Card */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4m0 5c0 2.21-3.58 4-8 4s-8-1.79-8-4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-white tracking-tight group-hover:text-violet-400 transition-colors">
                          {dataset.name}
                        </h3>
                        <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
                          {dataset.description || "No description provided."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ID & Footer metadata */}
                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                      DATASET ID: {dataset.id}
                    </div>

                    <Link
                      to={`/projects/${projectId}/datasets/${dataset.id}/test-cases`}
                      className="btn-premium-gradient px-4 py-2 text-xs flex items-center justify-center gap-1.5 self-end sm:self-auto"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Manage Test Cases</span>
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