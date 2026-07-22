import { useState, type ReactNode } from "react";

import type { OnboardingInput, OnboardingProfile } from "../types/api";
import { useLanguage } from "../i18n/LanguageContext";

interface OnboardingFlowProps {
  username: string;
  isSaving: boolean;
  error: string | null;
  onFinish: (input: OnboardingInput) => Promise<OnboardingProfile | null>;
}

const goals = [
  { value: "learn-editing", icon: "✎", title: "Learn how to edit", body: "Make confident, policy-aware changes." },
  { value: "add-knowledge", icon: "+", title: "Add or improve knowledge", body: "Expand articles and improve information." },
  { value: "share-media", icon: "▣", title: "Share media", body: "Contribute freely licensed images and files." },
  { value: "structured-data", icon: "◇", title: "Work with structured data", body: "Improve reusable facts on Wikidata." },
  { value: "join-community", icon: "◎", title: "Join a community", body: "Learn how Wikimedia collaboration works." },
];

const projects = [
  { value: "wikipedia", mark: "W", title: "Wikipedia", body: "Articles, sources, and encyclopedia editing." },
  { value: "wikidata", mark: "D", title: "Wikidata", body: "Structured facts shared across projects." },
  { value: "commons", mark: "C", title: "Wikimedia Commons", body: "Free images, video, and audio." },
  { value: "wiktionary", mark: "T", title: "Wiktionary", body: "Words, meanings, pronunciations, and translations." },
];

const experienceOptions = [
  { value: "new", title: "I’m completely new", body: "Start with the essentials and explain the terminology." },
  { value: "beginner", title: "I’ve tried a few contributions", body: "Reinforce the basics and build confidence." },
  { value: "experienced", title: "I already contribute", body: "Let me move quickly to the relevant path." },
];

const supportOptions = [
  { value: "self-guided", icon: "→", title: "Learn at my own pace", body: "Follow lessons and quests independently." },
  { value: "mentor", icon: "↔", title: "Get help from a mentor", body: "Prepare a volunteer mentor matching request." },
  { value: "community", icon: "◎", title: "Connect with a community", body: "Discover official Wikimedia discussion spaces." },
];

export function OnboardingFlow({ username, isSaving, error, onFinish }: OnboardingFlowProps) {
  const { language, t } = useLanguage();
  const [step, setStep] = useState(0);
  const [primaryGoal, setPrimaryGoal] = useState("learn-editing");
  const [preferredProject, setPreferredProject] = useState("wikipedia");
  const [experienceLevel, setExperienceLevel] = useState("new");
  const [supportPreference, setSupportPreference] = useState("self-guided");

  const input = (dismissed = false): OnboardingInput => ({
    primaryGoal,
    preferredProject,
    experienceLevel,
    supportPreference,
    dismissed,
  });

  const handleSkip = () => onFinish(input(true));
  const handleFinish = () => onFinish(input(false));
  const progress = step === 0 ? 0 : (step / 5) * 100;

  return (
    <main className="onboarding-page">
      <header className="onboarding-header">
        <strong>{t("Set up your WikiGuide journey")}</strong>
        <button disabled={isSaving} type="button" onClick={handleSkip}>{t("Skip setup")}</button>
      </header>
      <div className="onboarding-progress" aria-label={language === "fr" ? `Étape d’intégration ${step} sur 5` : `Onboarding step ${step} of 5`}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <section className="onboarding-card" aria-live="polite">
        {error && step !== 5 && <p className="onboarding-error" role="alert">{error}</p>}
        {step === 0 && (
          <div className="onboarding-welcome">
            <span aria-hidden="true">W</span>
            <p className="dashboard-kicker">{language === "fr" ? `Bienvenue, ${username}` : `Welcome, ${username}`}</p>
            <h1>{t("Your path into Wikimedia starts here.")}</h1>
            <p>
              {t("Answer four short questions and WikiGuide will recommend where to begin. You can change direction at any time.")}
            </p>
            <button type="button" onClick={() => setStep(1)}>{t("Personalize my path")}</button>
          </div>
        )}

        {step === 1 && (
          <OnboardingQuestion title="What would you most like to do?" subtitle="Choose the closest goal—we’ll use it as a starting point.">
            <OptionGrid options={goals} value={primaryGoal} onChange={setPrimaryGoal} />
          </OnboardingQuestion>
        )}

        {step === 2 && (
          <OnboardingQuestion title="Which project interests you first?" subtitle="Each project has its own contribution culture and learning path.">
            <OptionGrid options={projects} value={preferredProject} onChange={setPreferredProject} />
          </OnboardingQuestion>
        )}

        {step === 3 && (
          <OnboardingQuestion title="How familiar are you with Wikimedia?" subtitle="This helps us set the right amount of guidance.">
            <OptionGrid options={experienceOptions} value={experienceLevel} onChange={setExperienceLevel} singleColumn />
          </OnboardingQuestion>
        )}

        {step === 4 && (
          <OnboardingQuestion title="How would you like support?" subtitle="No choice locks you in; all support tools stay available.">
            <OptionGrid options={supportOptions} value={supportPreference} onChange={setSupportPreference} singleColumn />
          </OnboardingQuestion>
        )}

        {step === 5 && (
          <div className="onboarding-summary">
            <span aria-hidden="true">✓</span>
            <p className="dashboard-kicker">Your path is ready</p>
            <h1>{language === "fr" ? `Commencez par ${projects.find((item) => item.value === preferredProject)?.title}.` : `Start with ${projects.find((item) => item.value === preferredProject)?.title}.`}</h1>
            <p>
              {t("We’ll open its first unlocked lesson. Your mentor and community options remain available from the dashboard side panel.")}
            </p>
            {error && <p className="onboarding-error" role="alert">{error}</p>}
            <button disabled={isSaving} type="button" onClick={handleFinish}>
              {isSaving ? t("Saving your path…") : t("Go to my learning path")}
            </button>
          </div>
        )}

        {step > 0 && step < 5 && (
          <footer className="onboarding-controls">
            <button type="button" onClick={() => setStep((current) => current - 1)}>{t("Back")}</button>
            <span>{language === "fr" ? `Étape ${step} sur 4` : `Step ${step} of 4`}</span>
            <button type="button" onClick={() => setStep((current) => current + 1)}>{t("Continue")}</button>
          </footer>
        )}
      </section>
    </main>
  );
}

interface Option {
  value: string;
  title: string;
  body: string;
  icon?: string;
  mark?: string;
}

function OptionGrid({ options, value, onChange, singleColumn = false }: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  singleColumn?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className={`onboarding-options ${singleColumn ? "is-single" : ""}`}>
      {options.map((option) => (
        <button
          aria-pressed={value === option.value}
          className={value === option.value ? "is-selected" : ""}
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
        >
          {(option.icon || option.mark) && <span>{option.icon ?? option.mark}</span>}
          <div><strong>{t(option.title)}</strong><small>{t(option.body)}</small></div>
          <b aria-hidden="true">{value === option.value ? "✓" : ""}</b>
        </button>
      ))}
    </div>
  );
}

function OnboardingQuestion({ title, subtitle, children }: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <div className="onboarding-question">
      <p className="dashboard-kicker">{t("Personalize your journey")}</p>
      <h1>{t(title)}</h1>
      <p>{t(subtitle)}</p>
      {children}
    </div>
  );
}
