import { useState } from "react";

import { FAQList } from "../components/FAQList";
import { ProjectRail } from "../components/ProjectRail";

type ProjectKey = "Wikipedia" | "Wikidata" | "Wikimedia Commons" | "Wiktionary";

const projects: ProjectKey[] = [
  "Wikipedia",
  "Wikidata",
  "Wikimedia Commons",
  "Wiktionary",
];

interface GuideItem {
  title: string;
  body: string;
}

interface ProjectGuide {
  slug: string;
  shape: "circle" | "diamond" | "square" | "shield";
  mark: string;
  title: string;
  description: string;
  actions: GuideItem[];
  steps: GuideItem[];
}

const projectGuides: Record<ProjectKey, ProjectGuide> = {
  Wikipedia: {
    slug: "wikipedia",
    shape: "circle",
    mark: "W",
    title: "Welcome to Wikipedia",
    description:
      "Wikipedia is the free encyclopedia anyone can edit — written to summarize what reliable, published sources already say, not to introduce new ideas or opinions.",
    actions: [
      {
        title: "Fix a typo or broken sentence",
        body: "The fastest first edit. Click Edit on any page.",
      },
      {
        title: "Add a citation",
        body: "Found a claim with no source? Add a reference to back it up.",
      },
      {
        title: "Expand a short article",
        body: 'Add a paragraph to a "stub" article that only has a few lines.',
      },
      {
        title: "Patrol recent changes",
        body: "Watch the Recent Changes feed and revert obvious vandalism.",
      },
    ],
    steps: [
      {
        title: "Practice in your Sandbox",
        body: "Every account gets a personal sandbox page — a safe place to try edits before touching a real article.",
      },
      {
        title: "Use the Visual Editor",
        body: 'Click "Edit" on any article to open a Word-like editor — no wiki markup required to get started.',
      },
      {
        title: "Add references with the Cite tool",
        body: 'Highlight a claim, click "Cite", and paste the source. This is how facts get verified.',
      },
      {
        title: "Check the Talk page before big changes",
        body: "Every article has a discussion page — propose larger changes there first.",
      },
      {
        title: 'Read "Your first article" before creating a new page',
        body: "New articles have a higher bar for sourcing and notability than edits to existing ones.",
      },
    ],
  },
  Wikidata: {
    slug: "wikidata",
    shape: "diamond",
    mark: "D",
    title: "Welcome to Wikidata",
    description:
      "Wikidata is a free, structured knowledge base — a giant database of facts, organized as items and statements, that Wikipedia and outside apps reuse automatically.",
    actions: [
      {
        title: "Add a missing statement",
        body: "Open an item and add a fact it’s missing, like a birth date or a population figure.",
      },
      {
        title: "Link an item to its Wikipedia article",
        body: "Connect an item to the matching page in any language Wikipedia.",
      },
      {
        title: "Create a new item",
        body: "If something genuinely has no item yet, create one with a label and description.",
      },
      {
        title: "Merge duplicate items",
        body: "Spot two items describing the same thing? Flag or merge them.",
      },
    ],
    steps: [
      {
        title: "Search before you create",
        body: 'Search by label and by "also known as" aliases — the item may already exist under a different name.',
      },
      {
        title: "Learn the four building blocks",
        body: "Items are things; properties are relationships; statements combine them; references show where facts came from.",
      },
      {
        title: "Start with a sourced statement",
        body: "Add one clear fact and include a reliable reference so other editors can verify it.",
      },
      {
        title: "Use precise values",
        body: "Choose the correct date precision, units, language, and qualifiers when entering structured data.",
      },
      {
        title: "Review the item history",
        body: "Check recent changes and discussion before altering a well-established statement.",
      },
    ],
  },
  "Wikimedia Commons": {
    slug: "commons",
    shape: "square",
    mark: "C",
    title: "Welcome to Wikimedia Commons",
    description:
      "Wikimedia Commons is the shared media library — freely licensed photos, video, and audio that anyone can reuse, on any Wikimedia project or anywhere else.",
    actions: [
      {
        title: "Upload a photo you took",
        body: "Original photos, especially of underrepresented subjects, are always welcome.",
      },
      {
        title: "Add categories to a file",
        body: "Categories are how files get found — a good upload with no categories is nearly invisible.",
      },
      {
        title: "Add a file to an article",
        body: "If a Wikipedia article has no image, add a relevant one from Commons.",
      },
      {
        title: "Improve an existing file’s description",
        body: "Add location, date, or better identification to a file that’s already been uploaded.",
      },
    ],
    steps: [
      {
        title: "Use the Upload Wizard",
        body: "A guided step-by-step tool that walks you through licensing and description.",
      },
      {
        title: "Choose a license for your own work",
        body: "Most contributors choose CC BY-SA 4.0 — it requires attribution and keeps the file free to reuse.",
      },
      {
        title: "Write a useful description",
        body: "Explain what the file shows, where and when it was created, and why it may be useful.",
      },
      {
        title: "Add specific categories",
        body: "Place the file in the narrowest accurate categories so people can discover it.",
      },
      {
        title: "Respect copyright and privacy",
        body: "Upload only media you can freely license and consider identifiable people before publishing.",
      },
    ],
  },
  Wiktionary: {
    slug: "wiktionary",
    shape: "shield",
    mark: "T",
    title: "Welcome to Wiktionary",
    description:
      "Wiktionary is the free dictionary and thesaurus — definitions, pronunciations, etymologies, and translations, for words in every language, including under-resourced ones.",
    actions: [
      {
        title: "Add a missing definition",
        body: "Search for a word with no entry, or an entry missing a sense you know.",
      },
      {
        title: "Add pronunciation (IPA)",
        body: "Add how a word actually sounds, using the International Phonetic Alphabet.",
      },
      {
        title: "Add a translation",
        body: "Give the equivalent word in another language you speak.",
      },
      {
        title: "Add a usage example",
        body: "A short real sentence showing the word in context.",
      },
    ],
    steps: [
      {
        title: "Search before you start an entry",
        body: "Check whether the word already exists, even under a different spelling or form.",
      },
      {
        title: "Follow the entry layout",
        body: "Part of speech, definition, examples, etymology, then translations — Wiktionary entries follow a shared structure.",
      },
      {
        title: "Describe, don’t prescribe",
        body: "Document how speakers actually use a word and support unusual senses with citations.",
      },
      {
        title: "Specify the language",
        body: "Words with the same spelling can belong to many languages, so place content in the correct section.",
      },
      {
        title: "Preview your formatting",
        body: "Check headings, templates, pronunciation, and links before publishing the entry.",
      },
    ],
  },
};

const faqs = [
  {
    question: "Can I write about myself or my company?",
    answer:
      "It is strongly discouraged. A conflict of interest makes neutral editing difficult. Suggest changes on the article's Talk page instead.",
  },
  {
    question: "Why was my edit reverted?",
    answer:
      "Check the edit summary and the article's Talk page. Another editor may have identified a sourcing, neutrality, or style issue.",
  },
  {
    question: "Do I really need to cite sources for everything?",
    answer:
      "Claims that may be challenged need reliable published sources. Citations let readers verify the information for themselves.",
  },
  {
    question: 'What makes a topic "notable" enough for its own article?',
    answer:
      "A topic generally needs significant coverage in multiple reliable, independent sources. Popularity alone is not enough.",
  },
  {
    question: "Do I need an account to edit?",
    answer:
      "Many pages can be edited without one, but an account gives you a sandbox, a stable identity, watchlists, and additional editing tools.",
  },
];

export function HomePage() {
  const [activeProject, setActiveProject] = useState<ProjectKey>("Wikipedia");
  const [projectsOpen, setProjectsOpen] = useState(false);
  const guide = projectGuides[activeProject];

  const chooseProject = (project: string) => {
    setActiveProject(project as ProjectKey);
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
        <p className="simulation-note">
          Simulating a fresh account — you just signed up on {activeProject}
        </p>

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
          <FAQList items={faqs} />
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
