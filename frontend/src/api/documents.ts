import { apiClient } from "./client";

export async function listDocuments(projectId: string) {
  const response = await apiClient.get(`/projects/${projectId}/documents`);
  return response.data;
}

export async function uploadDocument(projectId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post(
    `/projects/${projectId}/documents/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}