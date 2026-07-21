import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

import { useWikimediaProjects } from "../hooks/useWikimediaProjects";

const categoryOrder = [
  "Reference",
  "Collections",
  "Technology",
  "Guides",
  "Collaboration",
  "Archive",
];

export function ProjectsPage() {
  const { projects, isLoading, error } = useWikimediaProjects();
  const [query, setQuery] = useState("");
  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return projects;
    return projects.filter((project) =>
      `${project.name} ${project.category} ${project.description}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [projects, query]);

  if (isLoading) {
    return (
      <main className="status-page" aria-live="polite">
        <p>Loading Wikimedia projects…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="status-page" role="alert">
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main className="projects-page">
      <header className="projects-intro">
        <p className="dashboard-kicker">Explore the movement</p>
        <h1>Discover Wikimedia projects</h1>
        <p>
          Find the free knowledge project that matches what you want to learn,
          preserve, organize, or contribute.
        </p>
        <label className="project-search">
          <span>Search projects</span>
          <input
            type="search"
            value={query}
            placeholder="Try “dictionary” or “data”"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </header>

      <div className="project-catalog" aria-live="polite">
        {filteredProjects.length === 0 ? (
          <div className="catalog-empty">
            <h2>No matching projects</h2>
            <p>Try a broader name, category, or contribution type.</p>
          </div>
        ) : (
          categoryOrder.map((category) => {
            const categoryProjects = filteredProjects.filter(
              (project) => project.category === category,
            );
            if (categoryProjects.length === 0) return null;

            return (
              <section className="catalog-section" key={category}>
                <div className="catalog-heading">
                  <h2>{category}</h2>
                  <span>{categoryProjects.length}</span>
                </div>
                <div className="catalog-grid">
                  {categoryProjects.map((project) => (
                    <article
                      className={`project-card ${
                        project.status === "archived" ? "is-archived" : ""
                      }`}
                      key={project.name}
                      style={{ "--project-accent": project.accent } as CSSProperties}
                    >
                      <div className="catalog-project-mark" aria-hidden="true">
                        {project.mark}
                      </div>
                      <div className="project-card-copy">
                        <div className="project-card-title">
                          <h3>{project.name}</h3>
                          {project.status === "archived" && <span>Archived</span>}
                        </div>
                        <p>{project.description}</p>
                        <a href={project.url} target="_blank" rel="noreferrer">
                          {project.status === "archived" ? "View archive" : "Visit project"}
                          <span aria-hidden="true"> ↗</span>
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </main>
  );
}
