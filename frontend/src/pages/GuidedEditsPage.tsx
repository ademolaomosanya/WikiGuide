import { useState } from "react";

import { getSuggestedEdit } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";
import type {
  SuggestedEditResponse,
  SuggestedEditTaskType,
  SuggestedEditTopic,
} from "../types/api";

const taskTypes: Array<{
  value: SuggestedEditTaskType;
  label: string;
  description: string;
  level: string;
  icon: string;
}> = [
  {
    value: "copyedit",
    label: "Improve the writing",
    description: "Fix wording, spelling, or structure.",
    level: "Easy",
    icon: "Aa",
  },
  {
    value: "links",
    label: "Add useful links",
    description: "Connect related Wikipedia articles.",
    level: "Easy",
    icon: "↗",
  },
  {
    value: "references",
    label: "Add a reference",
    description: "Support a statement with a reliable source.",
    level: "Medium",
    icon: "[1]",
  },
  {
    value: "expand",
    label: "Expand an article",
    description: "Add a short, sourced piece of knowledge.",
    level: "Medium",
    icon: "+",
  },
];

const topics: Array<{ value: SuggestedEditTopic; label: string }> = [
  { value: "all", label: "Anything" },
  { value: "culture", label: "Culture & arts" },
  { value: "history", label: "History" },
  { value: "science", label: "Science & nature" },
  { value: "society", label: "Society" },
];

interface GuidedEditsPageProps {
  onNavigate?: (path: string) => void;
}

export function GuidedEditsPage({ onNavigate }: GuidedEditsPageProps) {
  const { language, t } = useLanguage();
  const [taskType, setTaskType] = useState<SuggestedEditTaskType>("copyedit");
  const [topic, setTopic] = useState<SuggestedEditTopic>("all");
  const [suggestion, setSuggestion] = useState<SuggestedEditResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSuggestion = async (offset = 0) => {
    setIsLoading(true);
    setError(null);
    try {
      setSuggestion(await getSuggestedEdit(taskType, topic, offset));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t("A suggested edit could not be loaded."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`guided-edits-page ${onNavigate ? "" : "is-embedded"}`}>
      {onNavigate && (
        <div className="guided-edits-topbar">
          <button type="button" onClick={() => onNavigate("/")}>
            ← {t("Back to WikiGuide")}
          </button>
          <span>{t("Wikipedia newcomer task")}</span>
        </div>
      )}

      <section className="growth-card" aria-labelledby="guided-edits-title">
        <header className="growth-card-header">
          <div>
            <p>{t("Suggested edits")}</p>
            <h1 id="guided-edits-title">
              {suggestion ? t("Here is your next contribution") : t("Choose your first task")}
            </h1>
          </div>
          <div
            className="growth-progress"
            aria-label={suggestion ? t("Step 2 of 2") : t("Step 1 of 2")}
          >
            <span className="is-complete" />
            <span className={suggestion ? "is-complete" : ""} />
          </div>
        </header>

        {suggestion ? (
          <div className="growth-suggestion">
            <div className="growth-task-badges">
              <span>{t(suggestion.taskName)}</span>
              <span>{t(topics.find((item) => item.value === topic)?.label ?? "")}</span>
            </div>
            <p className="growth-overline">{t("Recommended article")}</p>
            <h2>{suggestion.article.title}</h2>
            <p className="growth-excerpt">
              {suggestion.article.excerpt || t("Open the article to review its current content.")}
            </p>
            {suggestion.isFallback ? (
              <p className="growth-filter-note is-demo">
                {t("Demo mode: live recommendations are unavailable, so this task opens Wikipedia’s safe practice sandbox instead of a live article.")}
              </p>
            ) : !suggestion.topicMatched && topic !== "all" ? (
              <p className="growth-filter-note">
                {t("No matching task was found in that topic, so this recommendation uses the same task type from another topic.")}
              </p>
            ) : null}
            <div className="growth-guidance">
              <span aria-hidden="true">✓</span>
              <div>
                <strong>{t("Your goal")}</strong>
                <p>{t(suggestion.guidance)}</p>
              </div>
            </div>
            {error && <p className="growth-error" role="alert">{error}</p>}
            <div className="growth-actions">
              <button
                type="button"
                className="growth-secondary"
                onClick={() => setSuggestion(null)}
              >
                {t("Change filters")}
              </button>
              <button
                type="button"
                className="growth-secondary"
                disabled={isLoading}
                onClick={() => void loadSuggestion(suggestion.nextOffset)}
              >
                {isLoading ? t("Finding another…") : t("Skip this one")}
              </button>
              <a href={suggestion.article.editUrl} target="_blank" rel="noreferrer">
                {t("Start editing")} ↗
              </a>
            </div>
          </div>
        ) : (
          <div className="growth-setup">
            <fieldset>
              <legend>{t("What would you like to practice?")}</legend>
              <div className="growth-task-grid">
                {taskTypes.map((task) => (
                  <label
                    className={taskType === task.value ? "is-selected" : ""}
                    key={task.value}
                  >
                    <input
                      type="radio"
                      name="task-type"
                      value={task.value}
                      checked={taskType === task.value}
                      onChange={() => setTaskType(task.value)}
                    />
                    <span className="growth-task-icon" aria-hidden="true">
                      {task.icon}
                    </span>
                    <span>
                      <strong>{t(task.label)}</strong>
                      <small>{t(task.description)}</small>
                    </span>
                    <em>{t(task.level)}</em>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>{t("Choose a topic")}</legend>
              <div className="growth-topic-list">
                {topics.map((item) => (
                  <label
                    className={topic === item.value ? "is-selected" : ""}
                    key={item.value}
                  >
                    <input
                      type="radio"
                      name="topic"
                      value={item.value}
                      checked={topic === item.value}
                      onChange={() => setTopic(item.value)}
                    />
                    {t(item.label)}
                  </label>
                ))}
              </div>
            </fieldset>

            {error && <p className="growth-error" role="alert">{error}</p>}
            <button
              type="button"
              className="growth-primary"
              disabled={isLoading}
              onClick={() => void loadSuggestion()}
            >
              {isLoading ? t("Finding a suitable article…") : t("Show my suggested edit")}
            </button>
            <p className="growth-source-note">
              {language === "fr" ? "Les recommandations proviennent des tâches de maintenance de Wikipédia en français." : "Recommendations come from live maintenance tasks on French Wikipedia."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
