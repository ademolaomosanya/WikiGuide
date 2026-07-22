import { useEffect, useState } from "react";

import { FAQList } from "../components/FAQList";
import { ProjectRail } from "../components/ProjectRail";
import { WikipediaQuickAccess } from "../components/WikipediaQuickAccess";
import { useProjectGuides } from "../hooks/useProjectGuides";
import { useLanguage } from "../i18n/LanguageContext";
import type { AuthUser } from "../types/api";

interface HomePageProps {
  user: AuthUser | null;
}

export function HomePage({ user }: HomePageProps) {
  const { t } = useLanguage();
  const { guides, isLoading, error, retry } = useProjectGuides();
  const [activeProject, setActiveProject] = useState("Wikipedia");

  useEffect(() => {
    if (guides.length === 0) return;
    if (!guides.some((guide) => guide.name === activeProject)) {
      setActiveProject(guides[0].name);
    }
  }, [activeProject, guides]);

  if (isLoading) {
    return (
      <main className="status-page" aria-live="polite">
        <p>{t("Loading Wikimedia project guides…")}</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="status-page" role="alert">
        <p>{error}</p>
        <button type="button" onClick={retry}>
          {t("Try again")}
        </button>
      </main>
    );
  }

  const guide = guides.find((item) => item.name === activeProject) ?? guides[0];

  if (!guide) {
    return (
      <main className="status-page" role="status">
        <p>{t("No project guides are available yet.")}</p>
      </main>
    );
  }

  const projects = guides.map((item) => item.name);

  const chooseProject = (project: string) => {
    setActiveProject(project);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className={`welcome-page theme-${guide.slug}`}>
      <ProjectRail
        projects={projects}
        activeProject={activeProject}
        onSelect={chooseProject}
      />

      <div className="page-content">
        <header className="welcome-hero">
          <div className={`project-mark shape-${guide.shape}`} aria-hidden="true">
            {guide.mark}
          </div>
          <div>
            <h1>{t(guide.title)}</h1>
            <p>{t(guide.description)}</p>
          </div>
        </header>

        {guide.slug === "wikipedia" && <WikipediaQuickAccess user={user} />}

        <section className="content-section" aria-labelledby="possibilities-title">
          <h2 id="possibilities-title">{t("What you can do here")}</h2>
          <div className="action-grid">
            {guide.actions.map((action) => (
              <article className="action-card" key={action.title}>
                <h3>{t(action.title)}</h3>
                <p>{t(action.body)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section steps-section" aria-labelledby="steps-title">
          <h2 id="steps-title">{t("How to, step by step")}</h2>
          <ol className="step-list">
            {guide.steps.map((step, index) => (
              <li key={step.title}>
                <span className="step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <h3>{t(step.title)}</h3>
                  <p>{t(step.body)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="content-section faq-section" aria-labelledby="faq-title">
          <h2 id="faq-title">{t("Quick FAQ")}</h2>
          <FAQList items={guide.faqs} />
        </section>
      </div>

    </main>
  );
}
