import { useEffect, useState } from "react";

import { FAQList } from "../components/FAQList";
import { ProjectRail } from "../components/ProjectRail";
import { useProjectGuides } from "../hooks/useProjectGuides";

export function HomePage() {
  const { guides, isLoading, error, retry } = useProjectGuides();
  const [activeProject, setActiveProject] = useState("Wikipedia");
  const [projectsOpen, setProjectsOpen] = useState(false);

  useEffect(() => {
    if (guides.length === 0) return;
    if (!guides.some((guide) => guide.name === activeProject)) {
      setActiveProject(guides[0].name);
    }
  }, [activeProject, guides]);

  if (isLoading) {
    return (
      <main className="status-page" aria-live="polite">
        <p>Loading Wikimedia project guides…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="status-page" role="alert">
        <p>{error}</p>
        <button type="button" onClick={retry}>
          Try again
        </button>
      </main>
    );
  }

  const guide = guides.find((item) => item.name === activeProject) ?? guides[0];

  if (!guide) {
    return (
      <main className="status-page" role="status">
        <p>No project guides are available yet.</p>
      </main>
    );
  }

  const projects = guides.map((item) => item.name);

  const chooseProject = (project: string) => {
    setActiveProject(project);
    setProjectsOpen(false);
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
            <h1>{guide.title}</h1>
            <p>{guide.description}</p>
          </div>
        </header>

        <section className="content-section" aria-labelledby="possibilities-title">
          <h2 id="possibilities-title">What you can do here</h2>
          <div className="action-grid">
            {guide.actions.map((action) => (
              <article className="action-card" key={action.title}>
                <h3>{action.title}</h3>
                <p>{action.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section steps-section" aria-labelledby="steps-title">
          <h2 id="steps-title">How to, step by step</h2>
          <ol className="step-list">
            {guide.steps.map((step, index) => (
              <li key={step.title}>
                <span className="step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="content-section faq-section" aria-labelledby="faq-title">
          <h2 id="faq-title">Quick FAQ</h2>
          <FAQList items={guide.faqs} />
        </section>
      </div>

      <button
        className="discover-button"
        type="button"
        aria-expanded={projectsOpen}
        aria-controls="project-picker"
        onClick={() => setProjectsOpen((open) => !open)}
      >
        <span aria-hidden="true" />
        Discover Wikimedia Projects
      </button>

      {projectsOpen && (
        <div className="project-picker" id="project-picker">
          <p>Explore a project</p>
          {projects.map((project) => (
            <button
              type="button"
              className={project === activeProject ? "is-active" : ""}
              key={project}
              onClick={() => chooseProject(project)}
            >
              {project}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
