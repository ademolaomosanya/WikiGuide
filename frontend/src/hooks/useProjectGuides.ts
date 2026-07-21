import { useCallback, useEffect, useState } from "react";

import { getProjectGuides } from "../api/client";
import type { ProjectGuide } from "../types/api";

export function useProjectGuides() {
  const [guides, setGuides] = useState<ProjectGuide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  const retry = useCallback(() => {
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;

    setIsLoading(true);
    setError(null);

    getProjectGuides(controller.signal)
      .then(({ projects }) => {
        if (!isCurrent) return;
        setGuides(projects);
      })
      .catch((requestError: unknown) => {
        if (!isCurrent) return;
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setError("The project guides could not be loaded.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [requestVersion]);

  return { guides, isLoading, error, retry };
}
