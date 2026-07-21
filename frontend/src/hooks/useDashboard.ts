import { useEffect, useState } from "react";

import { getDashboard } from "../api/client";
import type { DashboardResponse } from "../types/api";

export function useDashboard(enabled: boolean) {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setDashboard(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let isCurrent = true;
    setIsLoading(true);
    setError(null);

    getDashboard(controller.signal)
      .then((result) => {
        if (isCurrent) setDashboard(result);
      })
      .catch((requestError: unknown) => {
        if (!isCurrent) return;
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setError("Your dashboard could not be loaded.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [enabled]);

  return { dashboard, isLoading, error };
}
