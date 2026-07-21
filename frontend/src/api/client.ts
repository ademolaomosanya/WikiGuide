import type {
  AuthResponse,
  CSRFTokenResponse,
  DashboardResponse,
  HealthResponse,
  LearningFlowResponse,
  MentorRequestInput,
  MentorshipResponse,
  OnboardingInput,
  OnboardingResponse,
  ProjectGuidesResponse,
  WikimediaProjectsResponse,
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

export async function getWikimediaProjects(
  signal?: AbortSignal,
): Promise<WikimediaProjectsResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/`, { signal });

  if (!response.ok) {
    throw new Error(`Project catalog request failed with status ${response.status}`);
  }

  return response.json() as Promise<WikimediaProjectsResponse>;
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

export async function getDashboard(signal?: AbortSignal): Promise<DashboardResponse> {
  const response = await fetch(`${API_BASE_URL}/dashboard/`, {
    credentials: "include",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Dashboard request failed with status ${response.status}`);
  }

  return response.json() as Promise<DashboardResponse>;
}

export async function getLearningFlow(
  signal?: AbortSignal,
): Promise<LearningFlowResponse> {
  const response = await fetch(`${API_BASE_URL}/learning/`, {
    credentials: "include",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Learning request failed with status ${response.status}`);
  }

  return response.json() as Promise<LearningFlowResponse>;
}

export async function completeLearningLesson(
  lessonSlug: string,
): Promise<LearningFlowResponse> {
  const csrfToken = await getCSRFToken();
  const response = await fetch(
    `${API_BASE_URL}/learning/lessons/${encodeURIComponent(lessonSlug)}/complete/`,
    {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRFToken": csrfToken },
    },
  );

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(result?.detail ?? "The lesson could not be completed.");
  }

  return response.json() as Promise<LearningFlowResponse>;
}

export async function getMentorship(
  signal?: AbortSignal,
): Promise<MentorshipResponse> {
  const response = await fetch(`${API_BASE_URL}/mentorship/`, {
    credentials: "include",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Mentorship request failed with status ${response.status}`);
  }

  return response.json() as Promise<MentorshipResponse>;
}

export async function createMentorRequest(
  input: MentorRequestInput,
): Promise<MentorshipResponse> {
  const csrfToken = await getCSRFToken();
  const response = await fetch(`${API_BASE_URL}/mentorship/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(result?.detail ?? "Your mentor request could not be submitted.");
  }

  return response.json() as Promise<MentorshipResponse>;
}

export async function getOnboarding(
  signal?: AbortSignal,
): Promise<OnboardingResponse> {
  const response = await fetch(`${API_BASE_URL}/onboarding/`, {
    credentials: "include",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Onboarding request failed with status ${response.status}`);
  }

  return response.json() as Promise<OnboardingResponse>;
}

export async function completeOnboarding(
  input: OnboardingInput,
): Promise<OnboardingResponse> {
  const csrfToken = await getCSRFToken();
  const response = await fetch(`${API_BASE_URL}/onboarding/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Your onboarding choices could not be saved.");
  }

  return response.json() as Promise<OnboardingResponse>;
}
