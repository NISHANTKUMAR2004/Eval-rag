import { apiClient } from "./client";

export type CreateDatasetPayload = {
  name: string;
  description?: string;
};

export async function listDatasets(projectId: string) {
  const response = await apiClient.get(`/projects/${projectId}/datasets`);
  return response.data;
}

export async function createDataset(
  projectId: string,
  payload: CreateDatasetPayload
) {
  const response = await apiClient.post(`/projects/${projectId}/datasets`, payload);
  return response.data;
}