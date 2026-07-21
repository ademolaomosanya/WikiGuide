import { useCallback, useEffect, useState } from "react";

import { getCurrentUser, logoutCurrentUser } from "../api/client";
import type { AuthUser } from "../types/api";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;

    getCurrentUser(controller.signal)
      .then((result) => {
        if (isCurrent) setUser(result.user);
      })
      .catch((requestError: unknown) => {
        if (!isCurrent) return;
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setError("Authentication is temporarily unavailable.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await logoutCurrentUser();
      setUser(null);
    } catch {
      setError("Could not sign out. Please try again.");
    }
  }, []);

  return { user, isLoading, error, logout };
}
