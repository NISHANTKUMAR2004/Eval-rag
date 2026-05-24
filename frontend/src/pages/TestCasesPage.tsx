import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { createTestCase, listTestCases } from "../api/testCases";
import {
  ArrowLeft,
  FileCode2,
  Lightbulb,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Brain,
  Quote,
} from "lucide-react";

type TestCaseItem = {
  id: string;
  project_id: string;
  dataset_id: string;
  question: string;
  expected_answer?: string | null;
  context?: string | null;
  created_at: string;
  updated_at: string;
};

export default function TestCasesPage() {
  const { projectId, datasetId } = useParams();

  const [testCases, setTestCases] = useState<TestCaseItem[]>([]);
  const [question, setQuestion] = useState(
    "What is the purpose of EvalGuard AI?"
  );
  const [expectedAnswer, setExpectedAnswer] = useState(
    "EvalGuard AI evaluates RAG systems using metrics like faithfulness and relevance."
  );
  const [context, setContext] = useState(
    "EvalGuard AI is a platform for evaluating RAG pipelines."
  );

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function fetchTestCases() {
    if (!projectId || !datasetId) return;

    try {
      setError("");
      const data = await listTestCases(projectId, datasetId);
      setTestCases(data.test_cases || []);
    } catch (err) {
      setError("Could not load test cases.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTestCases();
  }, [projectId, datasetId]);

  async function handleCreateTestCase(event: FormEvent) {
    event.preventDefault();

    if (!projectId || !datasetId) {
      setError("Project ID or Dataset ID missing.");
      return;
    }

    setError("");
    setSuccess("");
    setCreating(true);

    try {
      await createTestCase(projectId, datasetId, {
        question,
        expected_answer: expectedAnswer,
        context,
      });

      setSuccess("Test case created successfully.");
      setQuestion("");
      setExpectedAnswer("");
      setContext("");
      await fetchTestCases();
    } catch (err) {
      setError("Could not create test case.");
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
            Dataset <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">Test Cases</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Define system queries, ground-truth targets, and reference context scopes for evaluating performance.
          </p>
        </div>

        <Link
          to={`/projects/${projectId}/datasets`}
          className="btn-premium-secondary px-5 py-2.5 flex items-center gap-2 text-sm self-start sm:self-center"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Datasets
        </Link>
      </div>

      {/* Structured Split Grid Layout */}
      <div className="relative z-10 grid gap-8 lg:grid-cols-3">
        {/* Left Column: Form Config */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-3xl p-6 shadow-2xl border border-slate-800/80 sticky top-28">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-violet-400 animate-pulse" />
              Create Test Case
            </h2>

            <form onSubmit={handleCreateTestCase} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Question / Prompt
                </label>
                <textarea
                  className="input-premium text-sm resize-none"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Enter evaluation question..."
                  rows={2}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Expected Ground-Truth
                </label>
                <textarea
                  className="input-premium text-sm resize-none"
                  value={expectedAnswer}
                  onChange={(event) => setExpectedAnswer(event.target.value)}
                  placeholder="Enter expected answer..."
                  rows={2}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Reference Context
                </label>
                <textarea
                  className="input-premium text-sm resize-none"
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                  placeholder="Enter reference context..."
                  rows={2}
                />
              </div>

              <button
                disabled={creating}
                className="w-full btn-premium-gradient py-3 flex items-center justify-center gap-2 text-sm disabled:opacity-40"
              >
                {creating ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 text-white" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4.5 w-4.5" />
                    <span>Register Test Case</span>
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

        {/* Right Column: Registered Test Cases */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-2">
            <Brain className="h-5 w-5 text-indigo-400" />
            Registered Cases ({testCases.length})
          </h2>

          {loading && (
            <div className="flex flex-col items-center gap-3 py-16 justify-center bg-slate-900/10 border border-slate-900 rounded-3xl animate-pulse">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              <p className="text-xs text-slate-500 font-mono tracking-widest">LOADING TEST SUITES...</p>
            </div>
          )}

          {!loading && testCases.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/10 p-12 text-center shadow-inner">
              <HelpCircle className="mx-auto h-12 w-12 text-slate-750 animate-pulse" />
              <h3 className="mt-4 text-sm font-bold text-slate-400">No Test Cases Configured</h3>
              <p className="mt-1 text-xs text-slate-500">Add queries above to build out this evaluation suite.</p>
            </div>
          )}

          {!loading && testCases.length > 0 && (
            <div className="grid gap-4 animate-fade-in">
              {testCases.map((testCase, idx) => (
                <div
                  key={testCase.id}
                  className="premium-card relative overflow-hidden group hover:border-violet-500/30 p-5 bg-slate-900/20 neon-border"
                >
                  {/* Case Number Badge */}
                  <div className="absolute top-0 right-0 bg-slate-950 border-b border-l border-slate-800 text-[9px] text-violet-400 font-extrabold px-3 py-1 rounded-bl-xl tracking-widest font-mono">
                    CASE #{idx + 1}
                  </div>

                  <div className="space-y-4">
                    {/* Question Row */}
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 font-mono">Query / Input</span>
                      <h3 className="font-bold text-white text-base mt-1.5 leading-snug tracking-tight group-hover:text-violet-400 transition-colors duration-300">
                        {testCase.question}
                      </h3>
                    </div>

                    {/* Compare panels */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Expected */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 space-y-1">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="h-3 w-3" />
                          Expected Ground-Truth
                        </span>
                        <p className="text-xs text-slate-350 leading-relaxed font-mono select-all pt-1">
                          {testCase.expected_answer || "No ground-truth specified."}
                        </p>
                      </div>

                      {/* Context */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 space-y-1">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-1 font-mono">
                          <Quote className="h-3 w-3" />
                          Reference Context
                        </span>
                        <p className="text-xs text-slate-355 leading-relaxed font-mono select-all pt-1">
                          {testCase.context || "No reference context specified."}
                        </p>
                      </div>
                    </div>

                    {/* Metadata details */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold tracking-widest uppercase font-mono">
                      <FileCode2 className="h-3.5 w-3.5 text-slate-600" />
                      CASE ID: <span className="text-slate-350 select-all font-sans font-bold bg-slate-950 border border-slate-900 rounded px-1.5 py-0.5">{testCase.id}</span>
                    </div>
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