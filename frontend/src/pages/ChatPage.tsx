import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  askQuestion,
  deleteChatSession,
  getSessionMessages,
  listChatSessions,
} from "../api/chat";
import type { ChatMessageItem, ChatSessionItem, SourceItem } from "../api/chat";

export default function ChatPage() {
  const { projectId } = useParams();

  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [question, setQuestion] = useState("");
  const [topK, setTopK] = useState(3);

  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom
  function scrollToBottom() {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchSessions() {
    if (!projectId) return;
    try {
      setLoadingSessions(true);
      setError("");
      const data = await listChatSessions(projectId);
      setSessions(data);

      if (data.length > 0 && !activeSessionId) {
        // Default to the most recent session
        setActiveSessionId(data[0].id);
        await fetchMessages(data[0].id);
      }
    } catch (err) {
      setError("Could not load chat sessions.");
    } finally {
      setLoadingSessions(false);
    }
  }

  async function fetchMessages(sessionId: string) {
    if (!projectId) return;
    try {
      setError("");
      const data = await getSessionMessages(projectId, sessionId);
      setMessages(data);
    } catch (err) {
      setError("Could not load message history.");
    }
  }

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleSessionSelect(sessionId: string) {
    setActiveSessionId(sessionId);
    await fetchMessages(sessionId);
  }

  async function handleStartNewSession() {
    // Starting a new session is done implicitly when passing session_id = null to ask_question,
    // but we can also just clear the active state and let the first message create it!
    setActiveSessionId(null);
    setMessages([]);
  }

  async function handleDeleteSession(sessionId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!projectId) return;

    try {
      await deleteChatSession(projectId, sessionId);
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
      await fetchSessions();
    } catch (err) {
      setError("Failed to delete chat session.");
    }
  }

  async function handleSendQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !question.trim()) return;

    const currentQuestion = question.trim();
    setQuestion("");
    setSending(true);
    setError("");

    // Optimistically add user message to feed
    const tempUserMsg: ChatMessageItem = {
      id: "temp-user",
      session_id: activeSessionId || "",
      role: "user",
      content: currentQuestion,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await askQuestion(projectId, {
        question: currentQuestion,
        session_id: activeSessionId,
        top_k: topK,
      });

      // Update active session if it was a new session
      if (!activeSessionId) {
        setActiveSessionId(response.session_id);
        await fetchSessions();
      }

      // Replace temp/update messages list
      const updatedMessages = await getSessionMessages(projectId, response.session_id);
      setMessages(updatedMessages);
    } catch (err: any) {
      // Remove optimistic message if failed and show error
      setMessages((prev) => prev.filter((m) => m.id !== "temp-user"));
      setError(err?.response?.data?.detail || "RAG engine failed to generate answer.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Workspace <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">RAG Chat</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Query corporate documents in real time using semantic chunk search and contextual LLM generation.
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

      {/* Main Split Grid */}
      <div className="grid gap-6 lg:grid-cols-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Left Side: Sessions Sidebar */}
        <div className="lg:col-span-1 glass-panel rounded-3xl p-4 flex flex-col justify-between overflow-hidden">
          <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h2 className="text-sm font-extrabold text-slate-350 uppercase tracking-widest flex items-center gap-2">
                <svg className="h-4.5 w-4.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Conversations
              </h2>

              <button
                onClick={handleStartNewSession}
                className="p-1.5 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 hover:bg-violet-600/20 hover:text-white transition-all active:scale-95 shadow-sm"
                title="Start New Session"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Sessions Scroll list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {loadingSessions && (
                <div className="py-8 text-center text-slate-550 text-xs font-mono animate-pulse">
                  Syncing logs...
                </div>
              )}

              {!loadingSessions && sessions.length === 0 && (
                <div className="py-8 text-center text-slate-500 text-xs leading-relaxed">
                  No active logs. Write a query to create one!
                </div>
              )}

              {!loadingSessions &&
                sessions.map((session) => {
                  const isActive = activeSessionId === session.id;
                  return (
                    <div
                      key={session.id}
                      onClick={() => handleSessionSelect(session.id)}
                      className={`relative group cursor-pointer rounded-xl p-3 border transition-all duration-300 flex items-center justify-between ${
                        isActive
                          ? "bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-violet-500/50 text-white shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                          : "border-slate-850 hover:bg-slate-800/20 hover:border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex flex-col overflow-hidden mr-2">
                        <span className="font-semibold text-xs truncate max-w-[130px] sm:max-w-none">
                          {session.title || `Chat Session ${session.id.substring(0, 8)}`}
                        </span>
                        <span className="text-[9px] text-slate-500 font-medium mt-0.5">
                          {new Date(session.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 transition-all text-slate-500"
                        title="Delete Session"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Parameters configuration drawer inside sidebar */}
          <div className="mt-4 pt-4 border-t border-slate-850/80 space-y-3 shrink-0">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Retrieval depth (top_k)</span>
              <span className="text-violet-400 font-mono">{topK} Chunks</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-violet-500 transition-all"
            />
          </div>
        </div>

        {/* Right Side: Conversation Canvas */}
        <div className="lg:col-span-3 glass-panel rounded-3xl flex flex-col justify-between overflow-hidden relative">
          {/* Active Session Header bar */}
          <div className="bg-slate-950/60 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse"></span>
              <h3 className="font-bold text-sm text-slate-200">
                {activeSessionId
                  ? `Active Session: ${activeSessionId.substring(0, 8)}`
                  : "Drafting Fresh Session"}
              </h3>
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Gemini model validation
            </div>
          </div>

          {/* Message List area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-950/20">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
                <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.1)]">
                  <svg className="h-8 w-8 animate-pulse-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg tracking-tight">RAG Context Engine Ready</h3>
                  <p className="text-slate-450 text-xs mt-2 leading-relaxed">
                    Upload your enterprise documents in the **Documents** section, then prompt the bot here. 
                    The RAG engine automatically retrieves matching text segments and answers in context.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id || index}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-2`}
                >
                  <div className={`flex items-start gap-3 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Icon indicator */}
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border text-xs font-bold ${
                      isUser
                        ? "bg-slate-950 border-slate-800 text-slate-400"
                        : "bg-violet-600/10 border-violet-500/20 text-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.1)]"
                    }`}>
                      {isUser ? "U" : "AI"}
                    </div>

                    {/* Chat Bubble */}
                    <div className={`rounded-2xl p-4 shadow-xl border text-sm leading-relaxed ${
                      isUser
                        ? "bg-gradient-to-br from-indigo-950/70 to-slate-900 border-indigo-500/20 text-indigo-100"
                        : "bg-slate-900/60 border-slate-800/80 text-slate-100 backdrop-blur-xs"
                    }`}>
                      {msg.content}
                    </div>
                  </div>

                  {/* Sources collapse logic for assistant answers */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="ml-11 w-[80%]">
                      <CollapsibleSources sources={msg.sources} />
                    </div>
                  )}

                  {/* Timestamp tag */}
                  <span className={`text-[8px] text-slate-650 font-semibold font-mono ${isUser ? "mr-11" : "ml-11"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            {sending && (
              <div className="flex flex-col items-start space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center animate-pulse">
                    AI
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-slate-900/40 border border-slate-850 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-violet-400 animate-bounce"></div>
                    <div className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Form input bar */}
          <div className="bg-slate-950/50 border-t border-slate-800/80 p-4 shrink-0">
            <form onSubmit={handleSendQuestion} className="flex gap-3 items-center">
              <input
                className="input-premium flex-1 h-12 py-0 text-sm"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask corporate information..."
                disabled={sending}
                required
              />

              <button
                type="submit"
                disabled={sending || !question.trim()}
                className="h-12 w-12 btn-premium-gradient flex items-center justify-center shrink-0 rounded-xl disabled:opacity-40 disabled:pointer-events-none"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>

            {error && (
              <div className="mt-3 text-xs text-red-400 font-semibold px-2 py-1 rounded bg-red-950/10 border border-red-500/10 flex items-center gap-1.5 animate-pulse">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Collapsible helper sub-component for rendering chunks
function CollapsibleSources({ sources }: { sources: SourceItem[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-850 bg-slate-950/30 rounded-xl overflow-hidden transition-all duration-300">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest flex items-center justify-between focus:outline-none"
      >
        <span className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Audited {sources.length} Semantic Source {sources.length > 1 ? "Files" : "File"}
        </span>

        <svg
          className={`h-4.5 w-4.5 text-slate-550 transition-transform duration-300 ${expanded ? 'transform rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="p-3 border-t border-slate-850/80 bg-slate-950/60 space-y-3 animate-fade-in max-h-60 overflow-y-auto custom-scrollbar">
          {sources.map((source, idx) => (
            <div key={source.chunk_id || idx} className="p-3 rounded-lg border border-slate-800 bg-slate-900/10 space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-[10px] font-bold text-slate-300 truncate max-w-[200px]">
                  {source.document_name} <span className="text-violet-400/80 font-mono">(Chunk #{source.chunk_index})</span>
                </span>

                <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono tracking-wider shrink-0 self-start sm:self-auto uppercase">
                  SIMILARITY: {(source.score * 100).toFixed(1)}%
                </span>
              </div>

              <p className="text-[10px] text-slate-450 leading-relaxed font-mono select-all p-2 rounded bg-slate-950/70 border border-slate-850/40">
                {source.content_preview}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
