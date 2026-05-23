import { apiClient } from "./client";

export type CreateEvaluationRunPayload = {
  dataset_id: string;
  name?: string;
};

export async function listEvaluationRuns(projectId: string, datasetId: string) {
  const response = await apiClient.get(
    `/projects/${projectId}/datasets/${datasetId}/batch-runs`
  );

  return response.data;
}

export async function createEvaluationRun(
  projectId: string,
  payload: CreateEvaluationRunPayload
) {
  const response = await apiClient.post(
    `/projects/${projectId}/datasets/${payload.dataset_id}/batch-runs`,
    {
      name: payload.name,
    }
  );

  return response.data;
}

export async function getEvaluationRun(
  projectId: string,
  datasetId: string,
  batchRunId: string
) {
  const response = await apiClient.get(
    `/projects/${projectId}/datasets/${datasetId}/batch-runs/${batchRunId}`
  );

  return response.data;
}