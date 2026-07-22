import { useEffect, useState } from "react";

import type { AuthUser } from "../types/api";
import { useLanguage } from "../i18n/LanguageContext";
import { ChatWindow } from "./ChatWindow";

interface ChatToggleProps {
  user: AuthUser | null;
}

export function ChatToggle({ user }: ChatToggleProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <div className="chat-toggle">
      <aside
        aria-label={t("Ask WikiGuide chat")}
        aria-modal="false"
        className="chat-toggle-panel"
        hidden={!isOpen}
        id="wikiguide-chat-panel"
        role="dialog"
      >
        <button
          aria-label={t("Close Ask WikiGuide")}
          className="chat-toggle-close"
          type="button"
          onClick={() => setIsOpen(false)}
        >
          ×
        </button>
        <ChatWindow user={user} />
      </aside>

      <button
        aria-controls="wikiguide-chat-panel"
        aria-expanded={isOpen}
        className="chat-toggle-button"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span aria-hidden="true">{isOpen ? "×" : "W"}</span>
        {t(isOpen ? "Close chat" : "Ask WikiGuide")}
      </button>
    </div>
  );
}
