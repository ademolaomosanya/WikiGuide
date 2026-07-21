import type {
  AuthResponse,
  CSRFTokenResponse,
  HealthResponse,
  ProjectGuidesResponse,
} from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health/`, { signal });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<HealthResponse>;
}

export async function getProjectGuides(
  signal?: AbortSignal,
): Promise<ProjectGuidesResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/guides/`, { signal });

  if (!response.ok) {
    throw new Error(`Guide request failed with status ${response.status}`);
  }

  return response.json() as Promise<ProjectGuidesResponse>;
}

export function getWikimediaLoginUrl(): string {
  return `${API_BASE_URL}/auth/wikimedia/login/`;
}

export async function getCurrentUser(signal?: AbortSignal): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/me/`, {
    credentials: "include",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Session request failed with status ${response.status}`);
  }

  return response.json() as Promise<AuthResponse>;
}

async function getCSRFToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/csrf/`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`CSRF request failed with status ${response.status}`);
  }

  const result = (await response.json()) as CSRFTokenResponse;
  return result.csrfToken;
}

export async function logoutCurrentUser(): Promise<AuthResponse> {
  const csrfToken = await getCSRFToken();
  const response = await fetch(`${API_BASE_URL}/auth/logout/`, {
    method: "POST",
    credentials: "include",
    headers: { "X-CSRFToken": csrfToken },
  });

  if (!response.ok) {
    throw new Error(`Logout request failed with status ${response.status}`);
  }

  return response.json() as Promise<AuthResponse>;
}
