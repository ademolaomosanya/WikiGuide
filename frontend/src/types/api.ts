export interface HealthResponse {
  status: string;
  service: string;
}

export interface GuideItem {
  title: string;
  body: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ProjectGuide {
  name: string;
  slug: string;
  shape: "circle" | "diamond" | "square" | "shield";
  mark: string;
  title: string;
  description: string;
  actions: GuideItem[];
  steps: GuideItem[];
  faqs: FAQItem[];
}

export interface ProjectGuidesResponse {
  projects: ProjectGuide[];
}

export interface AuthUser {
  id: number;
  username: string;
  editCount: number;
  wikimediaUserId: string | null;
}

export interface AuthResponse {
  authenticated: boolean;
  user: AuthUser | null;
}

export interface CSRFTokenResponse {
  csrfToken: string;
}
