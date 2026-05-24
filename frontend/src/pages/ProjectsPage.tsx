import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { createProject, listProjects, updateProject, deleteProject } from "../api/projects";
import {
  FolderPlus,
  Trash2,
  Edit3,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  FileText,
  Database,
  Activity,
  MessageSquare,
  Sparkles,
  Plus
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("EvalGuard Demo Project");
  const [description, setDescription] = useState(
    "Demo project for RAG evaluation"
  );
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit project states
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [updating, setUpdating] = useState(false);

  async function fetchProjects() {
    try {
      setError("");
      const data = await listProjects();
      setProjects(data.projects || []);
    } catch (err) {
      setError("Could not load projects. Please login again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  async function handleCreateProject(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setCreating(true);

    try {
      await createProject({
        name,
        description,
      });

      setSuccess("Workspace created successfully.");
      setName("");
      setDescription("");
      await fetchProjects();
    } catch (err) {
      setError("Could not create project workspace.");
    } finally {
      setCreating(false);
    }
  }

  async function handleEditClick(project: Project) {
    setEditingProject(project);
    setEditName(project.name);
    setEditDescription(project.description || "");
  }

  async function handleUpdateProject(event: FormEvent) {
    event.preventDefault();
    if (!editingProject) return;
    setError("");
    setUpdating(true);

    try {
      await updateProject(editingProject.id, {
        name: editName,
        description: editDescription,
      });
      setEditingProject(null);
      setSuccess("Project workspace updated successfully.");
      await fetchProjects();
    } catch (err) {
      setError("Could not update project workspace.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteProject(projectId: string, name: string) {
    if (
      !window.confirm(
        `Are you sure you want to delete the project "${name}"?\nAll documents, datasets, test cases, and chat sessions inside this project will be deleted permanently.`
      )
    ) {
      return;
    }
    setError("");
    setSuccess("");

    try {
      await deleteProject(projectId);
      setSuccess("Project workspace deleted successfully.");
      await fetchProjects();
    } catch (err) {
      setError("Could not delete project workspace.");
    }
  }

  return (
    <div className="space-y-8 animate-slide-up relative">
      {/* Premium Ambient Light Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-12 left-1/4 h-80 w-80 rounded-full bg-violet-600/10 blur-[130px] animate-float"></div>
        <div className="absolute top-1/2 right-12 h-96 w-96 rounded-full bg-indigo-600/10 blur-[150px] animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Page Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            Evaluation <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">Projects</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Create and orchestrate secure workspaces for your RAG evaluation pipelines.
          </p>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="relative z-10 grid gap-8 lg:grid-cols-3">
        {/* Left Column: Create Workspace Form */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-3xl p-6 shadow-2xl border border-slate-800/80 sticky top-28">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400">
                <FolderPlus className="h-4.5 w-4.5" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Create Workspace
              </h2>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">Project Name</label>
                <input
                  className="w-full input-premium text-sm"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Chatbot Quality Audit"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">Description</label>
                <textarea
                  className="w-full input-premium text-sm resize-none"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What are we evaluating in this project?"
                  rows={4}
                />
              </div>

              <button
                disabled={creating}
                className="w-full btn-premium-gradient py-3 flex items-center justify-center gap-2 text-sm"
              >
                {creating ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 text-white" />
                    <span>Configuring Workspace...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4.5 w-4.5" />
                    <span>Create Project</span>
                  </>
                )}
              </button>
            </form>

            {success && (
              <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-3 text-xs text-emerald-350 shadow-sm flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Projects List */}
        <div className="lg:col-span-2 space-y-5">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-2">
            <Briefcase className="h-5 w-5 text-indigo-400 animate-pulse-slow" />
            Active Workspaces ({projects.length})
          </h2>

          {loading && (
            <div className="flex flex-col items-center gap-3 py-16 justify-center bg-slate-900/10 border border-slate-900 rounded-3xl">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              <p className="text-xs text-slate-500 font-mono tracking-widest">FETCHING WORKSPACES...</p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-950/20 border border-red-500/20 p-4 text-sm text-red-200 shadow-lg flex gap-3 animate-fade-in">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && projects.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/10 p-12 text-center shadow-inner">
              <Sparkles className="mx-auto h-12 w-12 text-slate-700" />
              <h3 className="mt-4 text-sm font-bold text-slate-400">No Projects Configured</h3>
              <p className="mt-1 text-xs text-slate-500">Use the workspace configuration panel to launch your first evaluation project.</p>
            </div>
          )}

          {!loading && !error && projects.map((project) => (
            <div
              key={project.id}
              className="premium-card relative overflow-hidden group hover:border-violet-500/30 p-6 neon-border"
            >
              {/* Vibrant Decorative Left Accent */}
              <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-violet-600 via-indigo-500 to-cyan-500 opacity-60"></div>

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-white tracking-tight group-hover:text-violet-400 transition-colors duration-300">
                    {project.name}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                    {project.description || "No description provided."}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => handleEditClick(project)}
                    className="p-2 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-450 hover:bg-violet-600/20 hover:text-violet-300 hover:border-violet-500/30 transition-all active:scale-95 cursor-pointer"
                    title="Rename / Edit Project"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id, project.name)}
                    className="p-2 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-450 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all active:scale-95 cursor-pointer"
                    title="Delete Project"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <span className="status-badge bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono hidden sm:flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {project.status || "active"}
                  </span>
                </div>
              </div>

              {/* Workspace ID */}
              <div className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 tracking-widest uppercase font-mono">
                WORKSPACE ID: <span className="text-slate-350 select-all font-sans font-bold bg-slate-950 border border-slate-900 rounded px-1.5 py-0.5">{project.id}</span>
              </div>

              {/* Action Buttons Link Grid */}
              <div className="mt-6 border-t border-slate-850/80 pt-5 flex flex-wrap gap-3">
                <Link
                  to={`/projects/${project.id}/documents`}
                  className="btn-premium-gradient px-4.5 py-2 text-xs flex items-center gap-1.5"
                >
                  <FileText className="h-4 w-4" />
                  <span>Documents</span>
                </Link>

                <Link
                  to={`/projects/${project.id}/datasets`}
                  className="btn-premium-secondary px-4.5 py-2 text-xs flex items-center gap-1.5"
                >
                  <Database className="h-4 w-4" />
                  <span>Datasets</span>
                </Link>

                <Link
                  to={`/projects/${project.id}/evaluations`}
                  className="btn-premium-secondary px-4.5 py-2 text-xs flex items-center gap-1.5"
                >
                  <Activity className="h-4 w-4" />
                  <span>Evaluations</span>
                </Link>

                <Link
                  to={`/projects/${project.id}/chat`}
                  className="btn-premium-secondary px-4.5 py-2 text-xs flex items-center gap-1.5 border-violet-500/15 text-violet-350 hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-white"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>RAG Chat</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Project Modal Overlay */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-800/80 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400">
                  <Edit3 className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Edit Project Workspace</h3>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">Project Name</label>
                <input
                  className="w-full input-premium text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Rename project..."
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">Description</label>
                <textarea
                  className="w-full input-premium text-sm resize-none"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Update project description..."
                  rows={4}
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-premium-gradient px-5 py-2.5 text-xs font-bold flex items-center gap-1.5"
                >
                  {updating ? (
                    <>
                      <Loader2 className="animate-spin h-3.5 w-3.5" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}