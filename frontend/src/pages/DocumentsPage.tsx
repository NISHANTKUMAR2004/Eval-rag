import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { listDocuments, uploadDocument } from "../api/documents";

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
      setSuccess("Document uploaded successfully.");
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

  function getFileIcon(type: string) {
    const t = type.toLowerCase();
    if (t.includes("pdf")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
      );
    }
    if (t.includes("word") || t.includes("docx")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      );
    }
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Projects
        </Link>
      </div>

      {/* Structured Columns */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left column: Sleek Drag and drop Upload Zone */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-3xl p-6 shadow-2xl border border-slate-800/80 sticky top-24">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-4">
              <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload Document
            </h2>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="relative group rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/40 p-6 text-center transition-all duration-300 hover:border-violet-500/40 hover:bg-slate-950/80">
                <input
                  type="file"
                  accept=".txt,.md,.pdf,.docx"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setSelectedFile(file);
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />

                <svg className="mx-auto h-10 w-10 text-slate-600 group-hover:text-violet-400 transition-colors animate-pulse-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>

                <p className="mt-3 text-xs font-semibold text-slate-300">
                  {selectedFile ? selectedFile.name : "Select or drag file here"}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Supports PDF, TXT, DOCX, MD (Max 10MB)
                </p>
              </div>

              <button
                disabled={uploading || !selectedFile}
                className="w-full btn-premium-gradient py-2.5 flex items-center justify-center gap-2 text-sm disabled:opacity-40"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Parsing & Chunking...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Start Upload</span>
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

        {/* Right column: Document cards list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-2">
            <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Uploaded Materials
          </h2>

          {loading && (
            <div className="flex items-center gap-3 py-6 justify-center bg-slate-900/20 border border-slate-800/40 rounded-2xl">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-800 border-t-violet-500"></div>
              <p className="text-sm text-slate-500 font-medium">Fetching materials...</p>
            </div>
          )}

          {!loading && documents.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 p-10 text-center shadow-inner">
              <svg className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-4 text-sm font-bold text-slate-400">No Documents Uploaded</h3>
              <p className="mt-1 text-xs text-slate-500">Add reference material to trigger chunk parser indexing operations.</p>
            </div>
          )}

          {!loading && documents.length > 0 && (
            <div className="grid gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="premium-card relative overflow-hidden group hover:border-violet-500/30 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      {getFileIcon(doc.original_filename)}
                      <div>
                        <h3 className="font-bold text-white tracking-tight group-hover:text-violet-400 transition-colors">
                          {doc.original_filename}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                          Type: {doc.file_type.toUpperCase()} • Size: {formatBytes(doc.file_size_bytes)}
                        </p>
                      </div>
                    </div>

                    <span className="status-badge bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 uppercase text-[9px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                      {doc.status}
                    </span>
                  </div>

                  {/* ID tag */}
                  <div className="mt-3.5 flex items-center gap-1 text-[10px] text-slate-500 font-medium tracking-wider">
                    FILE ID: {doc.id}
                  </div>

                  {/* View chunks button */}
                  <div className="mt-4 border-t border-slate-800/80 pt-4 flex justify-end">
                    <Link
                      to={`/projects/${projectId}/documents/${doc.id}/chunks`}
                      className="btn-premium-gradient px-4 py-2 text-xs flex items-center gap-1.5"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
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