import { apiClient } from "./client";

export async function listProjectChunks(projectId: string) {
  const response = await apiClient.get(`/projects/${projectId}/chunks`);
  return response.data;
}

export async function listDocumentChunks(projectId: string, documentId: string) {
  const response = await apiClient.get(
    `/projects/${projectId}/documents/${documentId}/chunks`
  );
  return response.data;
}