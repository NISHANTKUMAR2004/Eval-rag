import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { listDocuments, uploadDocument } from "../api/documents";
import {
  FileText,
  UploadCloud,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileCode,
  Files,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

type DocumentItem = {
  id: string;
  project_id: string;
  original_filename: string;
  file_type: string;
  file_size_bytes: number;
  status: string;
  error_message?: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export default function DocumentsPage() {
  const { projectId } = useParams();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function fetchDocuments() {
    if (!projectId) return;

    try {
      setError("");
      const data = await listDocuments(projectId);
      setDocuments(data.documents || []);
    } catch (err) {
      setError("Could not load documents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  async function handleUpload(event: FormEvent) {
    event.preventDefault();

    if (!projectId || !selectedFile) {
      setError("Please select a file first.");
      return;
    }

    setError("");
    setSuccess("");
    setUploading(true);

    try {
      await uploadDocument(projectId, selectedFile);
      setSuccess("Document uploaded successfully. Vector parser launched.");
      setSelectedFile(null);
      await fetchDocuments();
    } catch (err) {
      setError("Document upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function getFileIcon(filename: string) {
    const name = filename.toLowerCase();
    if (name.endsWith(".pdf")) {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.1)] animate-float">
          <FileText className="h-5 w-5" />
        </div>
      );
    }
    if (name.endsWith(".docx") || name.endsWith(".doc")) {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.1)] animate-float" style={{ animationDelay: '1s' }}>
          <FileText className="h-5 w-5" />
        </div>
      );
    }
    if (name.endsWith(".json") || name.endsWith(".js") || name.endsWith(".ts")) {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)] animate-float" style={{ animationDelay: '1.5s' }}>
          <FileCode className="h-5 w-5" />
        </div>
      );
    }
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.1)] animate-float" style={{ animationDelay: '2s' }}>
        <FileText className="h-5 w-5" />
      </div>
    );
  }

  function getStatusBadge(status: string) {
    const s = status.toLowerCase();
    if (s.includes("process") || s.includes("index") || s.includes("load")) {
      return (
        <span className="status-badge bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1.5 font-mono text-[9px]">
          <Clock className="h-3 w-3 animate-spin" />
          {status}
        </span>
      );
    }
    if (s.includes("fail") || s.includes("error")) {
      return (
        <span className="status-badge bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-1.5 font-mono text-[9px]">
          <XCircle className="h-3 w-3" />
          {status}
        </span>
      );
    }
    return (
      <span className="status-badge bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5 font-mono text-[9px]">
        <CheckCircle className="h-3 w-3" />
        {status}
      </span>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up relative">
      {/* Dynamic light glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 right-1/4 h-80 w-80 rounded-full bg-violet-650/5 blur-[120px] animate-float"></div>
        <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-indigo-650/5 blur-[110px] animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Top Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Workspace <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">Documents</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Upload text materials, reference documentation, or PDFs for parsing and chunk extraction.
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

      {/* Main Split Grid */}
      <div className="relative z-10 grid gap-8 lg:grid-cols-3">
        {/* Left Column: Drag & Drop Upload Zone */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-3xl p-6 shadow-2xl border border-slate-800/80 sticky top-28">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-4">
              <UploadCloud className="h-5 w-5 text-violet-400" />
              Upload Document
            </h2>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="relative group rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/40 p-6 text-center transition-all duration-300 hover:border-violet-500/40 hover:bg-slate-950/80 cursor-pointer">
                <input
                  type="file"
                  accept=".txt,.md,.pdf,.docx"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setSelectedFile(file);
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />

                <UploadCloud className="mx-auto h-10 w-10 text-slate-650 group-hover:text-violet-400 transition-colors duration-300 animate-pulse-glow" />

                <p className="mt-3 text-xs font-semibold text-slate-350">
                  {selectedFile ? selectedFile.name : "Select or drag file here"}
                </p>
                <p className="mt-1 text-[10px] text-slate-500 font-mono">
                  Supports PDF, TXT, DOCX, MD (Max 10MB)
                </p>
              </div>

              <button
                disabled={uploading || !selectedFile}
                className="w-full btn-premium-gradient py-3 flex items-center justify-center gap-2 text-sm disabled:opacity-40"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 text-white" />
                    <span>Parsing & Chunking...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4.5 w-4.5" />
                    <span>Start Upload</span>
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

            {error && (
              <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-3 text-xs text-red-350 shadow-sm flex items-center gap-2 animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Uploaded Materials List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-2">
            <Files className="h-5 w-5 text-indigo-400" />
            Uploaded Materials ({documents.length})
          </h2>

          {loading && (
            <div className="flex flex-col items-center gap-3 py-16 justify-center bg-slate-900/10 border border-slate-900 rounded-3xl">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              <p className="text-xs text-slate-500 font-mono tracking-widest">LOADING DOCUMENTS...</p>
            </div>
          )}

          {!loading && documents.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/10 p-12 text-center shadow-inner">
              <FileText className="mx-auto h-12 w-12 text-slate-700 animate-pulse-glow" />
              <h3 className="mt-4 text-sm font-bold text-slate-400">No Documents Uploaded</h3>
              <p className="mt-1 text-xs text-slate-500">Add reference material to trigger chunk parser indexing operations.</p>
            </div>
          )}

          {!loading && documents.length > 0 && (
            <div className="grid gap-4 animate-fade-in">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="premium-card relative overflow-hidden group hover:border-violet-500/30 p-5 neon-border bg-slate-900/20"
                >
                  {/* Colorful decoration accent */}
                  <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-indigo-500 to-cyan-500 opacity-60"></div>

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex gap-4">
                      {getFileIcon(doc.original_filename)}
                      <div>
                        <h3 className="font-bold text-white text-base tracking-tight group-hover:text-violet-400 transition-colors duration-300">
                          {doc.original_filename}
                        </h3>
                        <p className="mt-1 text-xs text-slate-450 font-semibold uppercase tracking-wider font-mono">
                          Type: {doc.file_type.toUpperCase()} • Size: {formatBytes(doc.file_size_bytes)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 self-start sm:self-auto">
                      {getStatusBadge(doc.status)}
                    </div>
                  </div>

                  {/* ID Tag */}
                  <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold tracking-widest uppercase font-mono">
                    FILE ID: <span className="text-slate-350 select-all font-sans font-bold bg-slate-950 border border-slate-900 rounded px-1.5 py-0.5">{doc.id}</span>
                  </div>

                  {/* View Chunks Link */}
                  <div className="mt-5 border-t border-slate-850/80 pt-4 flex justify-end">
                    <Link
                      to={`/projects/${projectId}/documents/${doc.id}/chunks`}
                      className="btn-premium-gradient px-4.5 py-2 text-xs flex items-center gap-1.5"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Inspect Extracted Chunks</span>
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