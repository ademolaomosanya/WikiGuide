import { getWikimediaLoginUrl } from "../api/client";
import type { AuthUser } from "../types/api";

interface HeaderProps {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

export function Header({ user, isLoading, logout }: HeaderProps) {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="WikiGuide home">
        <span>WikiGuide</span>
      </a>
      <div className="auth-controls">
        {isLoading ? (
          <span className="auth-loading">Checking session…</span>
        ) : user ? (
          <>
            <span className="auth-username">{user.username}</span>
            <button type="button" className="auth-button secondary" onClick={logout}>
              Sign out
            </button>
          </>
        ) : (
          <a className="auth-button" href={getWikimediaLoginUrl()}>
            Continue with Wikimedia
          </a>
        )}
      </div>
    </header>
  );
}
