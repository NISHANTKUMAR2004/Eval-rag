import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import DocumentsPage from "./pages/DocumentsPage";
import ChunksPage from "./pages/ChunksPage";
import DatasetsPage from "./pages/DatasetsPage";
import TestCasesPage from "./pages/TestCasesPage";
import EvaluationsPage from "./pages/EvaluationsPage";
import EvaluationResultsPage from "./pages/EvaluationResultsPage";
import ChatPage from "./pages/ChatPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />

            <Route path="/projects/:projectId/documents" element={<DocumentsPage />} />

            <Route
              path="/projects/:projectId/documents/:documentId/chunks"
              element={<ChunksPage />}
            />

            <Route path="/projects/:projectId/datasets" element={<DatasetsPage />} />

            <Route
              path="/projects/:projectId/datasets/:datasetId/test-cases"
              element={<TestCasesPage />}
            />

            <Route
              path="/projects/:projectId/evaluations"
              element={<EvaluationsPage />}
            />

            <Route
              path="/projects/:projectId/chat"
              element={<ChatPage />}
            />

            <Route
              path="/projects/:projectId/datasets/:datasetId/batch-runs/:batchRunId"
              element={<EvaluationResultsPage />}
            />
          </Route>
        </Route>

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;