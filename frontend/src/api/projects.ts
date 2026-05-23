import { apiClient } from "./client";

export type CreateProjectPayload = {
  name: string;
  description?: string;
};

export async function listProjects() {
  const response = await apiClient.get("/projects");
  return response.data;
}

export async function createProject(payload: CreateProjectPayload) {
  const response = await apiClient.post("/projects", payload);
  return response.data;
}

export async function getProjectDashboardSummary(projectId: string) {
  const response = await apiClient.get(`/projects/${projectId}/dashboard/summary`);
  return response.data;
}

export type UpdateProjectPayload = {
  name?: string;
  description?: string;
};

export async function updateProject(projectId: string, payload: UpdateProjectPayload) {
  const response = await apiClient.patch(`/projects/${projectId}`, payload);
  return response.data;
}

export async function deleteProject(projectId: string) {
  await apiClient.delete(`/projects/${projectId}`);
}