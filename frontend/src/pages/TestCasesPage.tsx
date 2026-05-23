import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { createTestCase, listTestCases } from "../api/testCases";

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
    <div className="space-y-8 animate-slide-up">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
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
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Datasets
        </Link>
      </div>

      {/* Structured Split Grid Layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Form config */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-3xl p-6 shadow-2xl border border-slate-800/80 sticky top-24">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-4">
              <svg className="h-5 w-5 text-violet-400 animate-pulse-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Create Test Case
            </h2>

            <form onSubmit={handleCreateTestCase} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Question / Prompt
                </label>
                <textarea
                  className="input-premium resize-none"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Enter evaluation question"
                  rows={2}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Expected Ground-Truth
                </label>
                <textarea
                  className="input-premium resize-none"
                  value={expectedAnswer}
                  onChange={(event) => setExpectedAnswer(event.target.value)}
                  placeholder="Enter expected answer"
                  rows={2}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Reference Context
                </label>
                <textarea
                  className="input-premium resize-none"
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                  placeholder="Enter reference context"
                  rows={2}
                />
              </div>

              <button
                disabled={creating}
                className="w-full btn-premium-gradient py-2.5 flex items-center justify-center gap-2 text-sm disabled:opacity-40"
              >
                {creating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Register Test Case</span>
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

        {/* Right Column: Test Cases List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-2">
            <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
            </svg>
            Registered Cases ({testCases.length})
          </h2>

          {loading && (
            <div className="flex items-center gap-3 py-6 justify-center bg-slate-900/20 border border-slate-800/40 rounded-2xl">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-800 border-t-violet-500"></div>
              <p className="text-sm text-slate-500 font-medium">Fetching test cases...</p>
            </div>
          )}

          {!loading && testCases.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 p-10 text-center shadow-inner">
              <svg className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="mt-4 text-sm font-bold text-slate-400">No Test Cases</h3>
              <p className="mt-1 text-xs text-slate-500">Add queries above to build out this evaluation suite.</p>
            </div>
          )}

          {!loading && testCases.length > 0 && (
            <div className="grid gap-4">
              {testCases.map((testCase, idx) => (
                <div
                  key={testCase.id}
                  className="premium-card relative overflow-hidden group hover:border-violet-500/30 p-5 bg-slate-900/20"
                >
                  {/* Case Number Badge */}
                  <div className="absolute top-0 right-0 bg-slate-950/80 border-b border-l border-slate-800 text-[10px] text-violet-400 font-extrabold px-3 py-1 rounded-bl-xl tracking-widest">
                    CASE #{idx + 1}
                  </div>

                  <div className="space-y-4">
                    {/* Question Row */}
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Query / Input</span>
                      <h3 className="font-bold text-white text-base mt-0.5 tracking-tight group-hover:text-violet-400 transition-colors">
                        {testCase.question}
                      </h3>
                    </div>

                    {/* Output panels */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Expected */}
                      <div className="rounded-xl border border-slate-850 bg-slate-950/40 p-3.5 space-y-1">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400">Expected Ground-Truth</span>
                        <p className="text-xs text-slate-300 leading-relaxed font-mono select-all">
                          {testCase.expected_answer || "No ground-truth specified."}
                        </p>
                      </div>

                      {/* Context */}
                      <div className="rounded-xl border border-slate-850 bg-slate-950/40 p-3.5 space-y-1">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-400">Reference Context</span>
                        <p className="text-xs text-slate-300 leading-relaxed font-mono select-all">
                          {testCase.context || "No reference context specified."}
                        </p>
                      </div>
                    </div>

                    {/* File ID & meta details */}
                    <div className="pt-2 flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                      <svg className="h-3.5 w-3.5 text-slate-650" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      CASE ID: {testCase.id}
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