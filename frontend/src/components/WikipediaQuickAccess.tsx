import { useEffect, useState } from "react";

import { useNotificationStatus } from "../hooks/useNotificationStatus";
import { useLanguage } from "../i18n/LanguageContext";
import type { AuthUser } from "../types/api";

const WIKIPEDIA_LINKS = {
  newcomerHomepage: "https://fr.wikipedia.org/wiki/Special:Homepage",
  tutorialPdf: "https://fr.wikipedia.org/wiki/Fichier:Welcome2WP_French_WEB.pdf",
  stepByStep: "https://fr.wikipedia.org/wiki/Aide:Wikipédia_pas_à_pas",
  wikipedia: "https://fr.wikipedia.org/",
  notifications: "https://fr.wikipedia.org/wiki/Special:Notifications",
} as const;

interface QuickLinkProps {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  symbol: string;
  status?: string;
  statusTone?: "neutral" | "unread" | "clear";
}

function QuickLink({
  eyebrow,
  title,
  description,
  href,
  symbol,
  status,
  statusTone = "neutral",
}: QuickLinkProps) {
  const { t } = useLanguage();
  return (
    <a
      className="wikipedia-quick-link"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      <span className="wikipedia-quick-icon" aria-hidden="true">
        {symbol}
      </span>
      <span>
        <small>{t(eyebrow)}</small>
        <strong>{t(title)}</strong>
        <span>{t(description)}</span>
        {status && (
          <span className={`wikipedia-quick-status is-${statusTone}`}>{t(status)}</span>
        )}
      </span>
      <span className="wikipedia-quick-arrow" aria-hidden="true">↗</span>
    </a>
  );
}

const interfaceGuides = {
  en: {
    label: "English",
    image: "/interface-guides/wikipedia-interface-en.jpg",
    alt: "Labeled diagram explaining the main parts of an English Wikipedia article page",
  },
  fr: {
    label: "Français",
    image: "/interface-guides/wikipedia-interface-fr.jpg",
    alt: "Schéma annoté expliquant les principales parties d’une page Wikipédia en français",
  },
} as const;

type InterfaceLanguage = keyof typeof interfaceGuides;

function InterfaceGuide() {
  const { language: appLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<InterfaceLanguage>(appLanguage);
  const guide = interfaceGuides[language];

  useEffect(() => {
    setLanguage(appLanguage);
  }, [appLanguage]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <>
      <button
        className="wikipedia-interface-button"
        type="button"
        onClick={() => setIsOpen(true)}
      >
        <span className="wikipedia-quick-icon" aria-hidden="true">⌗</span>
        <span>
          <small>{t("Visual walkthrough")}</small>
          <strong>{t("See the interface")}</strong>
          <span>{t("Learn the labeled parts of a Wikipedia article page.")}</span>
        </span>
        <span className="wikipedia-quick-arrow" aria-hidden="true">→</span>
      </button>

      {isOpen && (
        <div
          className="interface-guide-backdrop"
          role="presentation"
          onMouseDown={() => setIsOpen(false)}
        >
          <section
            aria-labelledby="interface-guide-title"
            aria-modal="true"
            className="interface-guide-modal"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <p>{t("Wikipedia article guide")}</p>
                <h2 id="interface-guide-title">{t("See the interface")}</h2>
              </div>
              <button
                aria-label={t("Close interface guide")}
                type="button"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </header>

            <div className="interface-language-switch" aria-label={t("Diagram language")}>
              {(Object.keys(interfaceGuides) as InterfaceLanguage[]).map((code) => (
                <button
                  aria-pressed={language === code}
                  className={language === code ? "is-active" : ""}
                  key={code}
                  type="button"
                  onClick={() => setLanguage(code)}
                >
                  {interfaceGuides[code].label}
                </button>
              ))}
            </div>

            <div className="interface-guide-image">
              <img alt={guide.alt} src={guide.image} />
            </div>
          </section>
        </div>
      )}
    </>
  );
}

interface WikipediaQuickAccessProps {
  user: AuthUser | null;
}

export function WikipediaQuickAccess({ user }: WikipediaQuickAccessProps) {
  const { t } = useLanguage();
  const notifications = useNotificationStatus(Boolean(user));
  const messageStatus = !user
    ? "Sign in to check"
    : notifications.isLoading
      ? "Checking…"
      : notifications.status?.available
        ? notifications.status.hasUnread
          ? "New messages"
          : "You’re caught up"
        : "Open Wikipedia to check";
  const messageTone = notifications.status?.available
    ? notifications.status.hasUnread
      ? "unread"
      : "clear"
    : "neutral";

  return (
    <section className="wikipedia-quick-access" aria-labelledby="wikipedia-quick-title">
      <div className="wikipedia-quick-heading">
        <div>
          <p>{t("Start contributing")}</p>
          <h2 id="wikipedia-quick-title">{t("Your Wikipedia shortcuts")}</h2>
        </div>
        <span>{t("French Wikipedia")}</span>
      </div>

      <div className="wikipedia-quick-grid">
        <QuickLink
          eyebrow="Guided start"
          title="Suggested edits"
          description="Choose a beginner task and edit an existing article with guidance."
          href={WIKIPEDIA_LINKS.newcomerHomepage}
          symbol="✓"
        />
        <QuickLink
          eyebrow="Get support"
          title="Your mentor"
          description="Open your newcomer homepage to find and contact your assigned mentor."
          href={WIKIPEDIA_LINKS.newcomerHomepage}
          symbol="?"
        />
        <QuickLink
          eyebrow="Stay updated"
          title="Messages"
          description="See your Wikipedia notifications and recent conversations."
          href={WIKIPEDIA_LINKS.notifications}
          symbol="✦"
          status={messageStatus}
          statusTone={messageTone}
        />
        <InterfaceGuide />
        <QuickLink
          eyebrow="Open the site"
          title="Wikipedia"
          description="Go to the standard French Wikipedia interface."
          href={WIKIPEDIA_LINKS.wikipedia}
          symbol="W"
        />
      </div>

      <details className="wikipedia-toolbox">
        <summary>
          <span className="wikipedia-quick-icon" aria-hidden="true">+</span>
          <span>
            <small>{t("Learning resources")}</small>
            <strong>{t("The toolbox")}</strong>
            <span>{t("Open a written guide or follow a step-by-step tutorial.")}</span>
          </span>
          <span className="wikipedia-toolbox-toggle" aria-hidden="true">+</span>
        </summary>
        <div className="wikipedia-toolbox-links">
          <a href={WIKIPEDIA_LINKS.tutorialPdf} target="_blank" rel="noreferrer">
            <span>
              <strong>{t("Welcome to Wikipedia")}</strong>
              <small>{t("Illustrated PDF guide")}</small>
            </span>
            <span aria-hidden="true">↗</span>
          </a>
          <a href={WIKIPEDIA_LINKS.stepByStep} target="_blank" rel="noreferrer">
            <span>
              <strong>{t("Wikipedia step by step")}</strong>
              <small>{t("Tutorial and video resources")}</small>
            </span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </details>
    </section>
  );
}
