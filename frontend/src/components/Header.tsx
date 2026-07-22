import type { MouseEvent } from "react";

import { getWikimediaLoginUrl } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";
import type { AuthUser } from "../types/api";

interface HeaderProps {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function Header({
  user,
  isLoading,
  logout,
  currentPath,
  onNavigate,
}: HeaderProps) {
  const { t } = useLanguage();
  const navigate = (event: MouseEvent<HTMLAnchorElement>, path: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(path);
  };

  return (
    <header className="site-header">
      <a
        className="brand"
        href="/"
        aria-label={t("WikiGuide home")}
        onClick={(event) => navigate(event, "/")}
      >
        <span>WikiGuide</span>
      </a>
      <div className="header-actions">
        <nav className="header-nav" aria-label={t("Primary navigation")}>
          <a
            className={currentPath === "/projects" ? "is-active" : ""}
            href="/projects"
            onClick={(event) => navigate(event, "/projects")}
          >
            {t("Discover Wikimedia Projects")}
          </a>
          {user && (
            <a
              className={currentPath === "/dashboard" ? "is-active" : ""}
              href="/dashboard"
              onClick={(event) => navigate(event, "/dashboard")}
            >
              {t("Dashboard")}
            </a>
          )}
        </nav>
        <div className="auth-controls">
          {isLoading ? (
            <span className="auth-loading">{t("Checking session…")}</span>
          ) : user ? (
            <>
              <span className="auth-username">{user.username}</span>
              <button type="button" className="auth-button secondary" onClick={logout}>
                {t("Sign out")}
              </button>
            </>
          ) : (
            <a className="auth-button" href={getWikimediaLoginUrl()}>
              {t("Continue with Wikimedia")}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
