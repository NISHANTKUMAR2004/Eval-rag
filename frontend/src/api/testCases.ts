import { apiClient } from "./client";

export type CreateTestCasePayload = {
  question: string;
  expected_answer?: string;
  context?: string;
};

export async function listTestCases(projectId: string, datasetId: string) {
  const response = await apiClient.get(
    `/projects/${projectId}/datasets/${datasetId}/test-cases`
  );
  return response.data;
}

export async function createTestCase(
  projectId: string,
  datasetId: string,
  payload: CreateTestCasePayload
) {
  const response = await apiClient.post(
    `/projects/${projectId}/datasets/${datasetId}/test-cases`,
    payload
  );
  return response.data;
}