import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { listDocumentChunks } from "../api/chunks";

type ChunkItem = {
  id: string;
  project_id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  token_count?: number | null;
  created_at: string;
};

export default function ChunksPage() {
  const { projectId, documentId } = useParams();

  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchChunks() {
    if (!projectId || !documentId) {
      setError("Project ID or Document ID missing.");
      setLoading(false);
      return;
    }

    try {
      setError("");
      const data = await listDocumentChunks(projectId, documentId);
      setChunks(data.chunks || []);
    } catch (err) {
      setError("Could not load chunks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchChunks();
  }, [projectId, documentId]);

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Document <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">Chunks</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Verify text segmentations, index levels, and corresponding token densities extracted from your file.
          </p>
        </div>

        <Link
          to={`/projects/${projectId}/documents`}
          className="btn-premium-secondary px-5 py-2.5 flex items-center gap-2 text-sm self-start sm:self-center"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Documents
        </Link>
      </div>

      {loading && (
        <div className="flex items-center gap-3 py-12 justify-center bg-slate-900/20 border border-slate-800/40 rounded-2xl">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-800 border-t-violet-500"></div>
          <p className="text-sm text-slate-500 font-medium">Extracting document segments...</p>
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

      {!loading && !error && chunks.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 p-10 text-center shadow-inner">
          <svg className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          <h3 className="mt-4 text-sm font-bold text-slate-400">No Chunks Discovered</h3>
          <p className="mt-1 text-xs text-slate-500">Document extraction pipeline returned empty. Ensure file content length is sufficient.</p>
        </div>
      )}

      {!loading && !error && chunks.length > 0 && (
        <div className="grid gap-6">
          {chunks.map((chunk) => (
            <div
              key={chunk.id}
              className="premium-card overflow-hidden group hover:border-violet-500/30 p-0 rounded-2xl bg-slate-900/20"
            >
              {/* Card Code Editor Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {/* Miniature window controls */}
                  <div className="flex gap-1.5 shrink-0">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/40"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/40"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500/40"></span>
                  </div>
                  <div className="h-4 w-px bg-slate-850"></div>
                  <h3 className="font-bold text-sm text-slate-200 tracking-tight flex items-center gap-1.5">
                    <span className="text-violet-400">Segment</span> #{chunk.chunk_index}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 text-xs font-bold text-indigo-400 shadow-sm flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {chunk.token_count ?? "N/A"} Tokens
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Monospace Code Editor Box */}
                <div className="relative rounded-xl border border-slate-800/60 bg-slate-950/80 p-4 font-mono text-xs leading-relaxed text-slate-300 shadow-inner max-h-72 overflow-y-auto select-all">
                  <span className="absolute top-2 right-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-650 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5">TEXT BLOCK</span>
                  {chunk.content}
                </div>

                {/* ID Tag */}
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold tracking-wider">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  SEGMENT ID: {chunk.id}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}