import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { createDataset, listDatasets } from "../api/datasets";
import {
  ArrowLeft,
  Database,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FolderHeart,
  Sparkles,
  Layers,
} from "lucide-react";

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
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
      </div>

      {/* Structured Split Grid Layout */}
      <div className="relative z-10 grid gap-8 lg:grid-cols-3">
        {/* Left Column: Form Config */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-3xl p-6 shadow-2xl border border-slate-800/80 sticky top-28">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-4">
              <FolderHeart className="h-5 w-5 text-violet-400 animate-pulse" />
              Create Dataset
            </h2>

            <form onSubmit={handleCreateDataset} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Dataset Name
                </label>
                <input
                  className="input-premium text-sm"
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
                  className="input-premium text-sm resize-none"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Enter dataset description"
                  rows={3}
                />
              </div>

              <button
                disabled={creating}
                className="w-full btn-premium-gradient py-3 flex items-center justify-center gap-2 text-sm disabled:opacity-40"
              >
                {creating ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 text-white" />
                    <span>Creating Dataset...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4.5 w-4.5" />
                    <span>Create Dataset</span>
                  </>
                )}
              </button>
            </form>

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

        {/* Right Column: Datasets Listing */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            Available Datasets ({datasets.length})
          </h2>

          {loading && (
            <div className="flex flex-col items-center gap-3 py-16 justify-center bg-slate-900/10 border border-slate-900 rounded-3xl animate-pulse">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              <p className="text-xs text-slate-500 font-mono tracking-widest">LOADING DATASETS...</p>
            </div>
          )}

          {!loading && datasets.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/10 p-12 text-center shadow-inner">
              <Sparkles className="mx-auto h-12 w-12 text-slate-700 animate-pulse" />
              <h3 className="mt-4 text-sm font-bold text-slate-400">No Datasets Found</h3>
              <p className="mt-1 text-xs text-slate-500">Create your first evaluation dataset to register validation test cases.</p>
            </div>
          )}

          {!loading && datasets.length > 0 && (
            <div className="grid gap-4 animate-fade-in">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className="premium-card relative overflow-hidden group hover:border-violet-500/30 p-5 neon-border bg-slate-900/20"
                >
                  {/* Glowing left decor line */}
                  <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-indigo-500 to-cyan-500 opacity-60"></div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/25 text-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.1)]">
                        <Database className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base tracking-tight group-hover:text-violet-400 transition-colors duration-300">
                          {dataset.name}
                        </h3>
                        <p className="mt-1.5 text-sm text-slate-450 leading-relaxed">
                          {dataset.description || "No description provided."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer metadata details */}
                  <div className="mt-5 pt-4 border-t border-slate-850/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold tracking-widest uppercase font-mono">
                      DATASET ID: <span className="text-slate-350 select-all font-sans font-bold bg-slate-950 border border-slate-900 rounded px-1.5 py-0.5">{dataset.id}</span>
                    </div>

                    <Link
                      to={`/projects/${projectId}/datasets/${dataset.id}/test-cases`}
                      className="btn-premium-gradient px-4.5 py-2 text-xs flex items-center justify-center gap-1.5 self-end sm:self-auto"
                    >
                      <Plus className="h-4 w-4" />
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