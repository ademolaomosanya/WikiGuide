interface ProjectRailProps {
  projects: readonly string[];
  activeProject: string;
  onSelect: (project: string) => void;
}

export function ProjectRail({ projects, activeProject, onSelect }: ProjectRailProps) {
  const projectSlug = (project: string) =>
    project === "Wikimedia Commons" ? "commons" : project.toLowerCase();

  return (
    <nav className="project-rail" aria-label="Wikimedia projects">
      {projects.map((project) => (
        <button
          type="button"
          className={project === activeProject ? "is-active" : ""}
          data-project={projectSlug(project)}
          aria-current={project === activeProject ? "page" : undefined}
          key={project}
          onClick={() => onSelect(project)}
        >
          {project}
        </button>
      ))}
    </nav>
  );
}
