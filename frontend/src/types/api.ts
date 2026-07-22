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

export interface NotificationStatusResponse {
  available: boolean;
  hasUnread: boolean | null;
  url: string;
}

export interface CSRFTokenResponse {
  csrfToken: string;
}

export interface DashboardStats {
  wikimediaEdits: number;
  totalPoints: number;
  completedModules: number;
  activeModules: number;
}

export interface DashboardProgressItem {
  moduleSlug: string;
  completed: boolean;
  points: number;
  updatedAt: string;
}

export interface DashboardResponse {
  username: string;
  stats: DashboardStats;
  recentProgress: DashboardProgressItem[];
}

export interface WikimediaProject {
  name: string;
  mark: string;
  category: string;
  description: string;
  url: string;
  status: "active" | "archived";
  accent: string;
}

export interface WikimediaProjectsResponse {
  projects: WikimediaProject[];
}

export type LearningLessonState = "completed" | "available" | "locked";

export interface LearningLesson {
  slug: string;
  title: string;
  description: string;
  order: number;
  points: number;
  state: LearningLessonState;
}

export interface LearningPath {
  slug: string;
  name: string;
  mark: string;
  completedLessons: number;
  totalLessons: number;
  lessons: LearningLesson[];
}

export interface LearningQuest {
  slug: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  unit: string;
  completed: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  points: number;
  completedLessons: number;
  isCurrentUser: boolean;
}

export interface LearningFlowResponse {
  username: string;
  stats: {
    wikimediaEdits: number;
    totalPoints: number;
    completedLessons: number;
    availableLessons: number;
  };
  paths: LearningPath[];
  quests: LearningQuest[];
  leaderboard: {
    unlocked: boolean;
    unlockRequirement: number;
    entries: LeaderboardEntry[];
  };
  communities: WikimediaCommunity[];
}

export interface WikimediaCommunity {
  projectSlug: string;
  name: string;
  description: string;
  url: string;
}

export interface MentorRequest {
  id: number;
  project_slug: string;
  projectName: string;
  topic: string;
  topicName: string;
  experience_level: string;
  experienceName: string;
  goals: string;
  status: "pending" | "matched" | "closed";
  created_at: string;
}

export interface MentorshipResponse {
  request: MentorRequest | null;
}

export interface MentorRequestInput {
  project_slug: string;
  topic: string;
  experience_level: string;
  goals: string;
}

export interface OnboardingProfile {
  id: number;
  primaryGoal: string;
  preferredProject: string;
  experienceLevel: string;
  supportPreference: string;
  dismissed: boolean;
  completedAt: string;
}

export interface OnboardingResponse {
  completed: boolean;
  profile: OnboardingProfile | null;
}

export interface OnboardingInput {
  primaryGoal: string;
  preferredProject: string;
  experienceLevel: string;
  supportPreference: string;
  dismissed: boolean;
}

export type SuggestedEditTaskType = "copyedit" | "references" | "links" | "expand";
export type SuggestedEditTopic = "all" | "culture" | "history" | "science" | "society";

export interface SuggestedEditResponse {
  taskType: SuggestedEditTaskType;
  taskName: string;
  guidance: string;
  topic: SuggestedEditTopic;
  topicMatched: boolean;
  isFallback: boolean;
  nextOffset: number;
  article: {
    title: string;
    excerpt: string;
    url: string;
    editUrl: string;
  };
}
