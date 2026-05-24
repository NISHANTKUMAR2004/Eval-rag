import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  askQuestion,
  deleteChatSession,
  getSessionMessages,
  listChatSessions,
} from "../api/chat";
import type { ChatMessageItem, ChatSessionItem, SourceItem } from "../api/chat";
import {
  ArrowLeft,
  MessagesSquare,
  Plus,
  Trash2,
  Send,
  AlertCircle,
  FolderOpen,
  ChevronDown,
  Copy,
  Check,
  Bot,
  User,
  Sliders,
} from "lucide-react";

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
    <div className="space-y-8 animate-slide-up relative">
      {/* Dynamic backgrounds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 right-10 h-72 w-72 rounded-full bg-violet-650/5 blur-[120px] animate-float"></div>
      </div>

      {/* Top Header Row */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
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
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
      </div>

      {/* Main Split Grid */}
      <div className="relative z-10 grid gap-6 lg:grid-cols-4 h-[calc(100vh-220px)] min-h-[520px]">
        {/* Left Side: Sessions Sidebar */}
        <div className="lg:col-span-1 glass-panel rounded-3xl p-4 flex flex-col justify-between overflow-hidden bg-slate-950/40">
          <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                <MessagesSquare className="h-4.5 w-4.5 text-violet-400" />
                Conversations
              </h2>

              <button
                onClick={handleStartNewSession}
                className="p-1.5 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 hover:bg-violet-600/20 hover:text-white transition-all active:scale-95 shadow-sm cursor-pointer"
                title="Start New Session"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Sessions Scroll list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {loadingSessions && (
                <div className="py-8 text-center text-slate-500 text-xs font-mono animate-pulse">
                  Syncing logs...
                </div>
              )}

              {!loadingSessions && sessions.length === 0 && (
                <div className="py-8 text-center text-slate-500 text-xs leading-relaxed font-mono">
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
                          : "border-slate-900 hover:bg-slate-900/40 hover:border-slate-800 text-slate-450 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex flex-col overflow-hidden mr-2">
                        <span className="font-semibold text-xs truncate max-w-[130px] sm:max-w-none">
                          {session.title || `Chat Session ${session.id.substring(0, 8)}`}
                        </span>
                        <span className="text-[9px] text-slate-500 font-medium mt-0.5 font-mono">
                          {new Date(session.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 transition-all text-slate-500 cursor-pointer"
                        title="Delete Session"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Parameters configuration drawer inside sidebar */}
          <div className="mt-4 pt-4 border-t border-slate-900 space-y-3 shrink-0">
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
              <span className="flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-slate-650" />
                Retrieval depth (top_k)
              </span>
              <span className="text-violet-400 font-bold">{topK} Chunks</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-violet-500 transition-all"
            />
          </div>
        </div>

        {/* Right Side: Conversation Canvas */}
        <div className="lg:col-span-3 glass-panel rounded-3xl flex flex-col justify-between overflow-hidden relative bg-slate-950/40">
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
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
              Gemini model validation
            </div>
          </div>

          {/* Message List area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-950/10">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
                <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.1)]">
                  <Bot className="h-8 w-8 animate-float" />
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
                        : "bg-violet-600/10 border-violet-500/20 text-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.05)]"
                    }`}>
                      {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 animate-float" />}
                    </div>

                    {/* Chat Bubble */}
                    <div className={`rounded-2xl p-4 shadow-xl border text-sm leading-relaxed ${
                      isUser
                        ? "bg-gradient-to-br from-indigo-950/70 to-slate-900 border-indigo-500/20 text-indigo-100"
                        : "bg-slate-900/60 border-slate-800/80 text-slate-100 backdrop-blur-xs"
                    }`}>
                      {isUser ? msg.content : formatMessageContent(msg.content)}
                    </div>
                  </div>

                  {/* Sources collapse logic for assistant answers */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="ml-11 w-[80%]">
                      <CollapsibleSources sources={msg.sources} />
                    </div>
                  )}

                  {/* Timestamp tag */}
                  <span className={`text-[8px] text-slate-600 font-semibold font-mono ${isUser ? "mr-11" : "ml-11"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            {sending && (
              <div className="flex flex-col items-start space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center animate-pulse">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-slate-900/40 border border-slate-800 flex items-center gap-2">
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
                className="h-12 w-12 btn-premium-gradient flex items-center justify-center shrink-0 rounded-xl disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>

            {error && (
              <div className="mt-3 text-xs text-red-450 font-semibold px-3.5 py-2 rounded bg-red-950/10 border border-red-500/10 flex items-center gap-1.5 animate-pulse">
                <AlertCircle className="h-4 w-4 shrink-0" />
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
    <div className="border border-slate-800 bg-slate-950/40 rounded-xl overflow-hidden transition-all duration-300">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 text-[9px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-widest flex items-center justify-between focus:outline-none cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <FolderOpen className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
          Audited {sources.length} Semantic Source {sources.length > 1 ? "Files" : "File"}
        </span>

        <ChevronDown
          className={`h-4.5 w-4.5 text-slate-500 transition-transform duration-300 ${expanded ? 'transform rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="p-3 border-t border-slate-850/80 bg-slate-950/60 space-y-3 animate-fade-in max-h-60 overflow-y-auto custom-scrollbar">
          {sources.map((source, idx) => (
            <div key={source.chunk_id || idx} className="p-3 rounded-lg border border-slate-800 bg-slate-900/10 space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-[10px] font-bold text-slate-350 truncate max-w-[200px]">
                  {source.document_name} <span className="text-violet-400/80 font-mono">(Chunk #{source.chunk_index})</span>
                </span>

                <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono tracking-wider shrink-0 self-start sm:self-auto uppercase">
                  SIMILARITY: {(source.score * 100).toFixed(1)}%
                </span>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed font-mono select-all p-2 rounded bg-slate-950/70 border border-slate-850/40">
                {source.content_preview}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface MarkdownBlock {
  type: 'heading' | 'code' | 'list' | 'blockquote' | 'table' | 'paragraph';
  depth?: number;
  language?: string;
  items?: string[];
  ordered?: boolean;
  headers?: string[];
  rows?: string[][];
  text?: string;
}

function parseMarkdown(content: string): MarkdownBlock[] {
  const lines = content.split('\n');
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Code blocks
    if (line.trim().startsWith('```')) {
      const lang = line.trim().substring(3).trim();
      let code = '';
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code += lines[i] + '\n';
        i++;
      }
      blocks.push({ type: 'code', language: lang || 'text', text: code.trim() });
      i++; // skip closing ```
      continue;
    }

    // 2. Blockquotes
    if (line.trim().startsWith('>')) {
      let quoteText = '';
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        const cleanQuote = lines[i].trim().substring(1).trim();
        quoteText += (quoteText ? '\n' : '') + cleanQuote;
        i++;
      }
      blocks.push({ type: 'blockquote', text: quoteText });
      continue;
    }

    // 3. Lists
    const isUnordered = line.trim().startsWith('- ') || line.trim().startsWith('* ');
    const isOrdered = /^\d+\.\s/.test(line.trim());
    if (isUnordered || isOrdered) {
      const items: string[] = [];
      const ordered = isOrdered;
      
      while (i < lines.length) {
        const currentLine = lines[i].trim();
        const currentIsUnordered = currentLine.startsWith('- ') || currentLine.startsWith('* ');
        const currentIsOrdered = /^\d+\.\s/.test(currentLine);
        
        if (ordered && currentIsOrdered) {
          const dotIdx = currentLine.indexOf('.');
          items.push(currentLine.substring(dotIdx + 1).trim());
          i++;
        } else if (!ordered && currentIsUnordered) {
          items.push(currentLine.substring(2).trim());
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    // 4. Tables
    if (line.trim().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const headers = tableLines[0]
          .split('|')
          .map(s => s.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        const separatorLine = tableLines[1];
        const isSeparator = separatorLine.includes('-') && separatorLine.includes('|');
        
        const startRowIdx = isSeparator ? 2 : 1;
        const rows: string[][] = [];
        for (let r = startRowIdx; r < tableLines.length; r++) {
          const cols = tableLines[r]
            .split('|')
            .map(s => s.trim())
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          rows.push(cols);
        }
        blocks.push({ type: 'table', headers, rows });
        continue;
      } else {
        blocks.push({ type: 'paragraph', text: line });
        i++;
        continue;
      }
    }

    // 5. Headings
    if (line.startsWith('# ')) {
      blocks.push({ type: 'heading', depth: 1, text: line.substring(2) });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', depth: 2, text: line.substring(3) });
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push({ type: 'heading', depth: 3, text: line.substring(4) });
      i++;
      continue;
    }

    // 6. Paragraph spacing (empty lines)
    if (line.trim() === '') {
      blocks.push({ type: 'paragraph', text: '' });
      i++;
      continue;
    }

    // Default: paragraph line
    blocks.push({ type: 'paragraph', text: line });
    i++;
  }

  return blocks;
}

function formatInlineContent(text: string): React.ReactNode {
  if (!text) return null;

  const elements: React.ReactNode[] = [];
  let index = 0;
  
  while (index < text.length) {
    const remaining = text.substring(index);
    
    // 1. Inline code: `code`
    if (remaining.startsWith('`')) {
      const closeIdx = remaining.indexOf('`', 1);
      if (closeIdx !== -1) {
        const codeText = remaining.substring(1, closeIdx);
        elements.push(
          <code key={`code-${index}`} className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-950 border border-slate-900 text-violet-300 font-semibold mx-0.5 select-all">
            {codeText}
          </code>
        );
        index += closeIdx + 1;
        continue;
      }
    }
    
    // 2. Bold: **bold**
    if (remaining.startsWith('**')) {
      const closeIdx = remaining.indexOf('**', 2);
      if (closeIdx !== -1) {
        const boldText = remaining.substring(2, closeIdx);
        elements.push(
          <strong key={`bold-${index}`} className="font-extrabold text-violet-200 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20 shadow-xs">
            {boldText}
          </strong>
        );
        index += closeIdx + 2;
        continue;
      }
    }
    
    // 3. Italic: *italic*
    if (remaining.startsWith('*')) {
      const closeIdx = remaining.indexOf('*', 1);
      if (closeIdx !== -1) {
        const italicText = remaining.substring(1, closeIdx);
        elements.push(
          <em key={`italic-${index}`} className="italic text-slate-350 font-medium">
            {italicText}
          </em>
        );
        index += closeIdx + 1;
        continue;
      }
    }

    // 4. Italic: _italic_
    if (remaining.startsWith('_')) {
      const closeIdx = remaining.indexOf('_', 1);
      if (closeIdx !== -1) {
        const italicText = remaining.substring(1, closeIdx);
        elements.push(
          <em key={`italic-under-${index}`} className="italic text-slate-350 font-medium">
            {italicText}
          </em>
        );
        index += closeIdx + 1;
        continue;
      }
    }
    
    // Plain text scan
    let nextSpecial = remaining.length;
    const specialTokens = ['`', '**', '*', '_'];
    for (const token of specialTokens) {
      const idx = remaining.indexOf(token);
      if (idx !== -1 && idx > 0 && idx < nextSpecial) {
        nextSpecial = idx;
      }
    }
    
    elements.push(remaining.substring(0, nextSpecial));
    index += nextSpecial;
  }
  
  return <>{elements}</>;
}

// Custom Markdown formatter with Copy state support
function formatMessageContent(content: string) {
  if (!content) return "";
  
  const blocks = parseMarkdown(content);
  
  return (
    <div className="space-y-3.5 text-xs sm:text-sm leading-relaxed text-slate-200">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading':
            if (block.depth === 1) {
              return (
                <h1 key={idx} className="text-base sm:text-lg font-black text-white mt-4 mb-2 tracking-tight">
                  {formatInlineContent(block.text || '')}
                </h1>
              );
            }
            if (block.depth === 2) {
              return (
                <h2 key={idx} className="text-sm sm:text-base font-extrabold text-white mt-4 mb-2 border-b border-slate-850 pb-1.5 tracking-tight flex items-center gap-2">
                  <span className="h-2 w-2 rounded-sm bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
                  {formatInlineContent(block.text || '')}
                </h2>
              );
            }
            return (
              <h3 key={idx} className="text-xs sm:text-sm font-bold text-violet-400 mt-3 mb-1.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.5)]"></span>
                {formatInlineContent(block.text || '')}
              </h3>
            );
            
          case 'code':
            return <CodeBlockContainer key={idx} block={block} />;
            
          case 'list':
            if (block.ordered) {
              return (
                <ol key={idx} className="list-decimal ml-6 space-y-1.5 my-2 text-slate-300 font-mono text-xs leading-relaxed">
                  {block.items?.map((item, itemIdx) => (
                    <li key={itemIdx} className="leading-relaxed pl-1">
                      {formatInlineContent(item)}
                    </li>
                  ))}
                </ol>
              );
            }
            return (
              <ul key={idx} className="list-disc ml-6 space-y-1.5 my-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
                {block.items?.map((item, itemIdx) => (
                  <li key={itemIdx} className="leading-relaxed pl-1">
                    {formatInlineContent(item)}
                  </li>
                ))}
              </ul>
            );
            
          case 'blockquote':
            return (
              <blockquote key={idx} className="my-3.5 border-l-4 border-violet-500/80 bg-violet-950/10 px-4 py-3 rounded-r-xl text-slate-350 italic shadow-sm">
                {formatInlineContent(block.text || '')}
              </blockquote>
            );
            
          case 'table':
            return (
              <div key={idx} className="my-3.5 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40 shadow-sm max-w-full custom-scrollbar">
                <table className="min-w-full divide-y divide-slate-800/80 text-[11px] sm:text-xs text-left">
                  <thead className="bg-slate-900/60 font-bold text-slate-300 tracking-wider">
                    <tr>
                      {block.headers?.map((header, hIdx) => (
                        <th key={hIdx} className="px-3 py-2 font-bold border-r border-slate-900 last:border-r-0">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40 bg-slate-950/10">
                    {block.rows?.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-900/20 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-1.5 text-slate-350 border-r border-slate-900 last:border-r-0 leading-normal">
                            {formatInlineContent(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
            
          case 'paragraph':
            if (block.text === '') {
              return <div key={idx} className="h-1.5"></div>;
            }
            return (
              <p key={idx} className="text-slate-200 leading-relaxed tracking-wide">
                {formatInlineContent(block.text || '')}
              </p>
            );
            
          default:
            return null;
        }
      })}
    </div>
  );
}

// Inline custom interactive sub-component for copy feedback
function CodeBlockContainer({ block }: { block: MarkdownBlock }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!block.text) return;
    navigator.clipboard.writeText(block.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="my-3.5 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80 shadow-md animate-fade-in relative z-20">
      <div className="flex items-center justify-between bg-slate-900/60 px-4 py-2.5 text-[10px] font-bold text-slate-400 font-mono tracking-wider border-b border-slate-800 uppercase shrink-0">
        <span>{block.language}</span>
        <button 
          onClick={handleCopy}
          className="hover:text-violet-400 transition-colors duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 text-[10px]"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-450" />
              <span className="text-emerald-450">COPIED!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>COPY CODE</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[11px] font-mono text-slate-350 leading-normal custom-scrollbar bg-slate-950/20 select-all">
        <code>{block.text}</code>
      </pre>
    </div>
  );
}
