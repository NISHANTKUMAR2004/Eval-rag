import { apiClient } from "./client";

export type AskQuestionPayload = {
  question: string;
  session_id?: string | null;
  top_k?: number;
};

export type SourceItem = {
  chunk_id: string;
  document_id: string;
  document_name: string;
  chunk_index: number;
  content_preview: string;
  score: number;
};

export type AskQuestionResponse = {
  session_id: string;
  project_id: string;
  user_message_id: string;
  assistant_message_id: string;
  question: string;
  answer: string;
  sources: SourceItem[];
  created_at: string;
};

export type ChatSessionItem = {
  id: string;
  project_id: string;
  title?: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessageItem = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceItem[] | null;
  created_at: string;
};

export async function askQuestion(projectId: string, payload: AskQuestionPayload): Promise<AskQuestionResponse> {
  const response = await apiClient.post(`/projects/${projectId}/chat/ask`, payload);
  return response.data;
}

export async function listChatSessions(projectId: string): Promise<ChatSessionItem[]> {
  const response = await apiClient.get(`/projects/${projectId}/chat/sessions`);
  return response.data;
}

export async function getSessionMessages(projectId: string, sessionId: string): Promise<ChatMessageItem[]> {
  const response = await apiClient.get(`/projects/${projectId}/chat/sessions/${sessionId}/messages`);
  return response.data;
}

export async function deleteChatSession(projectId: string, sessionId: string): Promise<void> {
  await apiClient.delete(`/projects/${projectId}/chat/sessions/${sessionId}`);
}
