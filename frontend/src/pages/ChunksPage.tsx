import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { listDocumentChunks } from "../api/chunks";
import {
  ArrowLeft,
  Database,
  Cpu,
  Loader2,
  AlertCircle,
  FileSearch,
} from "lucide-react";

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
    <div className="space-y-8 animate-slide-up relative">
      {/* Decorative Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 right-10 h-72 w-72 rounded-full bg-violet-600/5 blur-[120px] animate-float"></div>
      </div>

      {/* Top Header Row */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
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
          <ArrowLeft className="h-4 w-4" />
          Back to Documents
        </Link>
      </div>

      {loading && (
        <div className="relative z-10 flex flex-col items-center gap-3 py-20 justify-center bg-slate-900/10 border border-slate-900 rounded-3xl animate-pulse">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          <p className="text-xs text-slate-500 font-mono tracking-widest">PARSING DOCUMENT SEGMENTS...</p>
        </div>
      )}

      {error && (
        <div className="relative z-10 rounded-2xl bg-red-950/20 border border-red-500/20 p-4 text-sm text-red-205 shadow-lg flex gap-3 animate-fade-in">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && chunks.length === 0 && (
        <div className="relative z-10 rounded-3xl border border-dashed border-slate-800 bg-slate-950/10 p-12 text-center shadow-inner">
          <FileSearch className="mx-auto h-12 w-12 text-slate-700" />
          <h3 className="mt-4 text-sm font-bold text-slate-400">No Chunks Discovered</h3>
          <p className="mt-1 text-xs text-slate-500">Document extraction pipeline returned empty. Ensure file content length is sufficient.</p>
        </div>
      )}

      {!loading && !error && chunks.length > 0 && (
        <div className="relative z-10 grid gap-6 animate-fade-in">
          {chunks.map((chunk) => (
            <div
              key={chunk.id}
              className="premium-card overflow-hidden group hover:border-violet-500/30 p-0 rounded-2xl bg-slate-900/20 neon-border"
            >
              {/* Card Code Editor Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {/* Miniature window controls */}
                  <div className="flex gap-1.5 shrink-0">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/30"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/30"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500/30"></span>
                  </div>
                  <div className="h-4 w-px bg-slate-800"></div>
                  <h3 className="font-bold text-sm text-slate-200 tracking-tight flex items-center gap-1.5 font-mono">
                    <span className="text-violet-400">Segment</span> #{chunk.chunk_index}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-indigo-500/10 border border-indigo-500/25 px-3 py-1 text-xs font-bold text-indigo-400 shadow-sm flex items-center gap-1 font-mono">
                    <Cpu className="h-3 w-3 animate-pulse" />
                    {chunk.token_count ?? "N/A"} Tokens
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Monospace Code Editor Box */}
                <div className="relative rounded-xl border border-slate-800/60 bg-slate-950/80 p-4 font-mono text-xs leading-relaxed text-slate-300 shadow-inner max-h-72 overflow-y-auto select-all custom-scrollbar">
                  <span className="absolute top-2.5 right-2.5 text-[9px] font-extrabold uppercase tracking-widest text-slate-500 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5">TEXT BLOCK</span>
                  {chunk.content}
                </div>

                {/* ID Tag */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-550 font-semibold tracking-widest uppercase font-mono">
                  <Database className="h-3.5 w-3.5 text-slate-600" />
                  SEGMENT ID: <span className="text-slate-350 select-all font-sans font-bold bg-slate-950 border border-slate-900 rounded px-1.5 py-0.5">{chunk.id}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}