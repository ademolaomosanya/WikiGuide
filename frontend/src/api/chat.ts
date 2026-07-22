import { getCSRFToken } from "./client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export interface ChatSource {
  title: string;
  url: string;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const csrfToken = await getCSRFToken();
  const response = await fetch(`${API_BASE_URL}/chat/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(result?.detail ?? "WikiGuide chat is unavailable.");
  }

  return response.json() as Promise<ChatResponse>;
}
