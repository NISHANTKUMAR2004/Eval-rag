import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { createProject, listProjects, updateProject, deleteProject } from "../api/projects";

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

      setSuccess("Project created successfully.");
      setName("");
      setDescription("");
      await fetchProjects();
    } catch (err) {
      setError("Could not create project.");
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
      setSuccess("Project updated successfully.");
      await fetchProjects();
    } catch (err) {
      setError("Could not update project.");
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
      setSuccess("Project deleted successfully.");
      await fetchProjects();
    } catch (err) {
      setError("Could not delete project.");
    }
  }

  return (
    <div className="space-y-8 animate-slide-up relative">
      {/* Premium Ambient Light Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-12 left-1/4 h-80 w-80 rounded-full bg-violet-600/10 blur-[130px] animate-float"></div>
        <div className="absolute top-1/2 right-12 h-96 w-96 rounded-full bg-indigo-600/10 blur-[150px] animate-float" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-cyan-500/5 blur-[120px] animate-float" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Page Header */}
      <div className="relative z-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Evaluation <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">Projects</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Create and orchestrate secure workspaces for your RAG evaluation pipelines.
        </p>
      </div>

      {/* Grid Layout: Config Form & Project Cards */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Create Project Form */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-3xl p-6 shadow-2xl border border-slate-800/80 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400">
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-9-4h18c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2zm0 0V5c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2H5z" />
                </svg>
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
                  className="w-full input-premium text-sm"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What are we evaluating in this project?"
                  rows={4}
                />
              </div>

              <button
                disabled={creating}
                className="w-full btn-premium-gradient py-2.5 flex items-center justify-center gap-2 text-sm"
              >
                {creating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Configuring...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Create Project</span>
                  </>
                )}
              </button>
            </form>

            {success && (
              <div className="mt-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 px-4 py-3 text-xs text-emerald-300 shadow-sm">
                {success}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Projects Listing */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-2">
            <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Active Workspaces
          </h2>

          {loading && (
            <div className="flex items-center gap-3 py-6 justify-center bg-slate-900/20 border border-slate-800/40 rounded-2xl">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-800 border-t-violet-500"></div>
              <p className="text-sm text-slate-500 font-medium">Fetching workspaces...</p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-950/40 border border-red-500/30 p-4 text-sm text-red-200 shadow-lg shadow-red-950/20 flex gap-3">
              <svg className="h-5 w-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && projects.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 p-10 text-center shadow-inner">
              <svg className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="mt-4 text-sm font-bold text-slate-400">No Projects Configured</h3>
              <p className="mt-1 text-xs text-slate-500">Use the workspace configuration panel to launch your first evaluation project.</p>
            </div>
          )}

          {!loading && !error && projects.map((project) => (
            <div
              key={project.id}
              className="premium-card relative overflow-hidden group hover:border-violet-500/30"
            >
              {/* Subtle dynamic decoration */}
              <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-violet-600 to-indigo-600 opacity-70"></div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-violet-400 transition-colors">
                    {project.name}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-400 leading-relaxed max-w-xl">
                    {project.description || "No description provided."}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleEditClick(project)}
                    className="p-1.5 rounded-lg bg-slate-800/40 border border-slate-700/55 text-slate-450 hover:bg-violet-600/20 hover:text-violet-300 hover:border-violet-500/30 transition-all active:scale-95 shadow-sm"
                    title="Rename / Edit Project"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id, project.name)}
                    className="p-1.5 rounded-lg bg-slate-800/40 border border-slate-700/55 text-slate-450 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all active:scale-95 shadow-sm"
                    title="Delete Project"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  <span className="status-badge bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase text-[10px] hidden sm:flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {project.status || "active"}
                  </span>
                </div>
              </div>

              {/* Unique ID Badge */}
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 tracking-wider">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                WORKSPACE ID: {project.id}
              </div>

              {/* Action Buttons Link Grid */}
              <div className="mt-6 border-t border-slate-800/80 pt-5 flex flex-wrap gap-3">
                <Link
                  to={`/projects/${project.id}/documents`}
                  className="btn-premium-gradient px-4 py-2 text-xs flex items-center gap-1.5"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Documents</span>
                </Link>

                <Link
                  to={`/projects/${project.id}/datasets`}
                  className="btn-premium-secondary px-4 py-2 text-xs flex items-center gap-1.5"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4" />
                  </svg>
                  <span>Datasets</span>
                </Link>

                <Link
                  to={`/projects/${project.id}/evaluations`}
                  className="btn-premium-secondary px-4 py-2 text-xs flex items-center gap-1.5"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Evaluations</span>
                </Link>

                <Link
                  to={`/projects/${project.id}/chat`}
                  className="btn-premium-secondary px-4 py-2 text-xs flex items-center gap-1.5 border-violet-500/20 text-violet-300 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-white"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>RAG Chat</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Project Modal Overlay */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-800/80 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Edit Project Workspace</h3>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
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
                  className="w-full input-premium text-sm"
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
                  className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white text-xs font-bold transition-all active:scale-95"
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
                      <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></div>
                      <span>Saving...</span>
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