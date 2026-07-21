import { useEffect, useMemo, useState, type FormEvent } from "react";

import { getWikimediaLoginUrl } from "../api/client";
import { OnboardingFlow } from "../components/OnboardingFlow";
import { useLearningFlow } from "../hooks/useLearningFlow";
import { useMentorship } from "../hooks/useMentorship";
import { useOnboarding } from "../hooks/useOnboarding";
import type {
  AuthUser,
  LearningLesson,
  MentorRequestInput,
  WikimediaCommunity,
} from "../types/api";

interface DashboardPageProps {
  user: AuthUser | null;
  authIsLoading: boolean;
}

type DashboardSection =
  | "learn"
  | "leaderboard"
  | "quests"
  | "mentor"
  | "communities"
  | "profile";

const sections: { id: DashboardSection; label: string; icon: string }[] = [
  { id: "learn", label: "Learn", icon: "⌂" },
  { id: "leaderboard", label: "Leaderboard", icon: "◆" },
  { id: "quests", label: "Quests", icon: "✓" },
  { id: "mentor", label: "Find a mentor", icon: "↔" },
  { id: "communities", label: "Communities", icon: "◎" },
  { id: "profile", label: "Profile", icon: "●" },
];

export function DashboardPage({ user, authIsLoading }: DashboardPageProps) {
  const { flow, isLoading, completingSlug, error, completeLesson } = useLearningFlow(
    Boolean(user),
  );
  const mentorship = useMentorship(Boolean(user));
  const onboarding = useOnboarding(Boolean(user));
  const [section, setSection] = useState<DashboardSection>("learn");
  const [activePathSlug, setActivePathSlug] = useState("wikipedia");
  const [selectedLessonSlug, setSelectedLessonSlug] = useState<string | null>(null);

  const activePath = useMemo(
    () => flow?.paths.find((path) => path.slug === activePathSlug) ?? flow?.paths[0],
    [activePathSlug, flow],
  );
  const selectedLesson = activePath?.lessons.find(
    (lesson) => lesson.slug === selectedLessonSlug,
  );

  useEffect(() => {
    if (!activePath) return;
    const selectedStillExists = activePath.lessons.some(
      (lesson) => lesson.slug === selectedLessonSlug,
    );
    if (!selectedStillExists) {
      const nextLesson = activePath.lessons.find((lesson) => lesson.state === "available");
      setSelectedLessonSlug(nextLesson?.slug ?? activePath.lessons[0]?.slug ?? null);
    }
  }, [activePath, selectedLessonSlug]);

  useEffect(() => {
    if (onboarding.profile) {
      setActivePathSlug(onboarding.profile.preferredProject);
    }
  }, [onboarding.profile]);

  if (authIsLoading) {
    return <Status message="Checking your session…" />;
  }

  if (!user) {
    return (
      <main className="dashboard-auth-gate">
        <p className="dashboard-kicker">Personal learning path</p>
        <h1>Sign in to start your contributor journey.</h1>
        <p>
          Your Wikimedia identity keeps lesson progress, XP, and contribution statistics
          attached to the right account.
        </p>
        <a className="dashboard-primary-action" href={getWikimediaLoginUrl()}>
          Continue with Wikimedia
        </a>
      </main>
    );
  }

  if (isLoading) return <Status message="Building your learning path…" />;
  if (!flow) return <Status message={error ?? "Your learning path is unavailable."} />;
  if (onboarding.isLoading) return <Status message="Preparing your welcome…" />;
  if (!onboarding.completed) {
    return (
      <OnboardingFlow
        error={onboarding.error}
        isSaving={onboarding.isSaving}
        username={flow.username}
        onFinish={async (input) => {
          const profile = await onboarding.save(input);
          if (profile) {
            setActivePathSlug(profile.preferredProject);
            setSection("learn");
          }
          return profile;
        }}
      />
    );
  }

  return (
    <main className="learning-shell">
      <aside className="learning-sidebar" aria-label="Dashboard sections">
        <div className="learning-sidebar-title">
          <span>WG</span>
          <strong>Learning</strong>
        </div>
        <nav>
          {sections.map((item) => (
            <button
              className={section === item.id ? "is-active" : ""}
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="learning-workspace">
        <header className="learning-topbar">
          <div>
            <p className="dashboard-kicker">Welcome back</p>
            <strong>{flow.username}</strong>
          </div>
          <div className="learning-quick-stats" aria-label="Learning summary">
            <span><b>{flow.stats.totalPoints}</b> XP</span>
            <span><b>{flow.stats.completedLessons}</b> lessons</span>
            <span><b>{flow.stats.wikimediaEdits.toLocaleString()}</b> edits</span>
          </div>
        </header>

        {error && <p className="learning-error" role="alert">{error}</p>}

        {section === "learn" && activePath && (
          <LearnSection
            paths={flow.paths}
            activePathSlug={activePath.slug}
            selectedLesson={selectedLesson}
            completingSlug={completingSlug}
            onChoosePath={setActivePathSlug}
            onChooseLesson={setSelectedLessonSlug}
            onComplete={completeLesson}
          />
        )}
        {section === "leaderboard" && (
          <LeaderboardSection leaderboard={flow.leaderboard} />
        )}
        {section === "quests" && <QuestsSection quests={flow.quests} />}
        {section === "mentor" && (
          <MentorSection
            {...mentorship}
            defaultProject={activePath?.slug ?? "wikipedia"}
          />
        )}
        {section === "communities" && (
          <CommunitiesSection communities={flow.communities} />
        )}
        {section === "profile" && (
          <ProfileSection username={flow.username} stats={flow.stats} />
        )}
      </div>
    </main>
  );
}

function Status({ message }: { message: string }) {
  return <main className="status-page" aria-live="polite"><p>{message}</p></main>;
}

interface LearnSectionProps {
  paths: NonNullable<ReturnType<typeof useLearningFlow>["flow"]>["paths"];
  activePathSlug: string;
  selectedLesson: LearningLesson | undefined;
  completingSlug: string | null;
  onChoosePath: (slug: string) => void;
  onChooseLesson: (slug: string) => void;
  onComplete: (slug: string) => Promise<void>;
}

function LearnSection({
  paths,
  activePathSlug,
  selectedLesson,
  completingSlug,
  onChoosePath,
  onChooseLesson,
  onComplete,
}: LearnSectionProps) {
  const activePath = paths.find((path) => path.slug === activePathSlug) ?? paths[0];
  const percent = Math.round(
    (activePath.completedLessons / activePath.totalLessons) * 100,
  );

  return (
    <section className="workflow-section">
      <div className="workflow-heading">
        <div>
          <p className="dashboard-kicker">Contributor curriculum</p>
          <h1>Choose a Wikimedia learning path</h1>
        </div>
        <span>{activePath.completedLessons}/{activePath.totalLessons} complete</span>
      </div>

      <div className="path-tabs" role="tablist" aria-label="Wikimedia learning paths">
        {paths.map((path) => (
          <button
            aria-selected={path.slug === activePath.slug}
            className={path.slug === activePath.slug ? "is-active" : ""}
            key={path.slug}
            role="tab"
            type="button"
            onClick={() => onChoosePath(path.slug)}
          >
            <span>{path.mark}</span>
            {path.name}
          </button>
        ))}
      </div>

      <div className="path-progress" aria-label={`${percent}% complete`}>
        <span style={{ width: `${percent}%` }} />
      </div>

      <div className="learn-layout">
        <ol className="lesson-path">
          {activePath.lessons.map((lesson) => (
            <li className={`lesson-step is-${lesson.state}`} key={lesson.slug}>
              <button
                aria-current={selectedLesson?.slug === lesson.slug ? "step" : undefined}
                aria-label={`${lesson.title}, ${lesson.state}`}
                className={selectedLesson?.slug === lesson.slug ? "is-selected" : ""}
                disabled={lesson.state === "locked"}
                type="button"
                onClick={() => onChooseLesson(lesson.slug)}
              >
                {lesson.state === "completed" ? "✓" : lesson.state === "locked" ? "×" : lesson.order}
              </button>
              <div>
                <strong>{lesson.title}</strong>
                <span>{lesson.state === "completed" ? "Completed" : lesson.state === "locked" ? "Locked" : `${lesson.points} XP`}</span>
              </div>
            </li>
          ))}
        </ol>

        <aside className="lesson-detail">
          {selectedLesson ? (
            <>
              <span className={`lesson-state is-${selectedLesson.state}`}>
                {selectedLesson.state}
              </span>
              <p className="dashboard-kicker">Lesson {selectedLesson.order}</p>
              <h2>{selectedLesson.title}</h2>
              <p>{selectedLesson.description}</p>
              {selectedLesson.state === "available" && (
                <button
                  type="button"
                  disabled={completingSlug === selectedLesson.slug}
                  onClick={() => onComplete(selectedLesson.slug)}
                >
                  {completingSlug === selectedLesson.slug
                    ? "Saving progress…"
                    : `Complete lesson · +${selectedLesson.points} XP`}
                </button>
              )}
              {selectedLesson.state === "completed" && <strong className="lesson-done">Lesson complete</strong>}
            </>
          ) : (
            <p>Select an unlocked lesson to begin.</p>
          )}
        </aside>
      </div>
    </section>
  );
}

function LeaderboardSection({
  leaderboard,
}: {
  leaderboard: NonNullable<ReturnType<typeof useLearningFlow>["flow"]>["leaderboard"];
}) {
  return (
    <section className="workflow-section compact">
      <div className="workflow-heading">
        <div><p className="dashboard-kicker">Community</p><h1>Leaderboard</h1></div>
      </div>
      {!leaderboard.unlocked ? (
        <div className="locked-feature">
          <span aria-hidden="true">◆</span>
          <h2>Unlock the leaderboard</h2>
          <p>Complete one lesson to compare your XP with other WikiGuide learners.</p>
        </div>
      ) : (
        <ol className="leaderboard-list">
          {leaderboard.entries.map((entry) => (
            <li className={entry.isCurrentUser ? "is-current" : ""} key={`${entry.rank}-${entry.username}`}>
              <b>{entry.rank}</b>
              <span className="leaderboard-avatar">{entry.username.slice(0, 1).toUpperCase()}</span>
              <div><strong>{entry.username}</strong><span>{entry.completedLessons} lessons</span></div>
              <strong>{entry.points} XP</strong>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function QuestsSection({
  quests,
}: {
  quests: NonNullable<ReturnType<typeof useLearningFlow>["flow"]>["quests"];
}) {
  return (
    <section className="workflow-section compact">
      <div className="workflow-heading"><div><p className="dashboard-kicker">Milestones</p><h1>Your quests</h1></div></div>
      <div className="quest-list">
        {quests.map((quest) => {
          const percent = Math.round((quest.progress / quest.target) * 100);
          return (
            <article className={quest.completed ? "is-complete" : ""} key={quest.slug}>
              <span className="quest-icon">{quest.completed ? "✓" : "◎"}</span>
              <div>
                <h2>{quest.title}</h2>
                <p>{quest.description}</p>
                <div className="quest-progress"><span style={{ width: `${percent}%` }} /></div>
              </div>
              <strong>{quest.progress}/{quest.target} {quest.unit}</strong>
            </article>
          );
        })}
      </div>
    </section>
  );
}

interface MentorSectionProps {
  request: ReturnType<typeof useMentorship>["request"];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  defaultProject: string;
  submitRequest: (input: MentorRequestInput) => Promise<boolean>;
}

function MentorSection({
  request,
  isLoading,
  isSubmitting,
  error,
  defaultProject,
  submitRequest,
}: MentorSectionProps) {
  const [project, setProject] = useState(defaultProject);
  const [topic, setTopic] = useState("getting-started");
  const [experience, setExperience] = useState("new");
  const [goals, setGoals] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitRequest({
      project_slug: project,
      topic,
      experience_level: experience,
      goals: goals.trim(),
    });
  };

  return (
    <section className="workflow-section compact">
      <div className="workflow-heading">
        <div>
          <p className="dashboard-kicker">Guidance from people</p>
          <h1>Match with a mentor</h1>
        </div>
      </div>

      {isLoading ? (
        <p className="section-loading">Loading your matching status…</p>
      ) : request && request.status !== "closed" ? (
        <article className={`mentor-status is-${request.status}`}>
          <span aria-hidden="true">{request.status === "matched" ? "✓" : "…"}</span>
          <div>
            <p className="dashboard-kicker">{request.status === "matched" ? "Match ready" : "Request received"}</p>
            <h2>{request.projectName} · {request.topicName}</h2>
            <p>
              {request.status === "matched"
                ? "Your request has been matched. A coordinator can now connect you with the assigned mentor."
                : "Your request is waiting for an appropriate volunteer mentor. WikiGuide will not claim a match until one is actually assigned."}
            </p>
            <small>Submitted {new Date(request.created_at).toLocaleDateString()}</small>
          </div>
        </article>
      ) : (
        <form className="mentor-form" onSubmit={handleSubmit}>
          <p>
            Tell us where you need help. This creates a matching request; it does not
            guarantee immediate volunteer availability.
          </p>
          <div className="mentor-form-grid">
            <label>
              <span>Wikimedia project</span>
              <select value={project} onChange={(event) => setProject(event.target.value)}>
                <option value="wikipedia">Wikipedia</option>
                <option value="wikidata">Wikidata</option>
                <option value="commons">Wikimedia Commons</option>
                <option value="wiktionary">Wiktionary</option>
              </select>
            </label>
            <label>
              <span>Help topic</span>
              <select value={topic} onChange={(event) => setTopic(event.target.value)}>
                <option value="getting-started">Getting started</option>
                <option value="editing">Editing and formatting</option>
                <option value="sources">Sources and citations</option>
                <option value="community">Community participation</option>
                <option value="technical">Technical contribution</option>
              </select>
            </label>
            <label>
              <span>Your experience</span>
              <select value={experience} onChange={(event) => setExperience(event.target.value)}>
                <option value="new">New contributor</option>
                <option value="beginner">Some contribution experience</option>
                <option value="experienced">Experienced contributor</option>
              </select>
            </label>
            <label className="is-wide">
              <span>What would you like to achieve? <small>Optional</small></span>
              <textarea
                maxLength={500}
                placeholder="For example: I want help adding my first reliable citation."
                value={goals}
                onChange={(event) => setGoals(event.target.value)}
              />
            </label>
          </div>
          {error && <p className="mentor-form-error" role="alert">{error}</p>}
          <button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Submitting request…" : "Request a mentor match"}
          </button>
        </form>
      )}
    </section>
  );
}

function CommunitiesSection({ communities }: { communities: WikimediaCommunity[] }) {
  return (
    <section className="workflow-section compact">
      <div className="workflow-heading">
        <div>
          <p className="dashboard-kicker">Wikimedia is collaborative</p>
          <h1>Connect with communities</h1>
        </div>
      </div>
      <p className="communities-intro">
        These links open official public Wikimedia discussion spaces. Read each space’s
        guidance before posting, and remember that your contributions will be public.
      </p>
      <div className="community-list">
        {communities.map((community) => (
          <article className={`community-card theme-${community.projectSlug}`} key={community.url}>
            <span>{community.name.slice(0, 1)}</span>
            <div>
              <h2>{community.name}</h2>
              <p>{community.description}</p>
              <a href={community.url} rel="noreferrer" target="_blank">
                Visit official community <span aria-hidden="true">↗</span>
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProfileSection({
  username,
  stats,
}: {
  username: string;
  stats: NonNullable<ReturnType<typeof useLearningFlow>["flow"]>["stats"];
}) {
  return (
    <section className="workflow-section compact">
      <div className="profile-card">
        <span className="profile-avatar">{username.slice(0, 1).toUpperCase()}</span>
        <p className="dashboard-kicker">Wikimedia learner</p>
        <h1>{username}</h1>
        <div className="profile-stats">
          <span><b>{stats.totalPoints}</b> XP earned</span>
          <span><b>{stats.completedLessons}</b> lessons completed</span>
          <span><b>{stats.wikimediaEdits.toLocaleString()}</b> Wikimedia edits</span>
        </div>
      </div>
    </section>
  );
}
