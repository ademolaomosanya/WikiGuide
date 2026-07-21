import { useEffect, useState } from "react";

import { getWikimediaProjects } from "../api/client";
import type { WikimediaProject } from "../types/api";

export function useWikimediaProjects() {
  const [projects, setProjects] = useState<WikimediaProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;

    getWikimediaProjects(controller.signal)
      .then((result) => {
        if (isCurrent) setProjects(result.projects);
      })
      .catch((requestError: unknown) => {
        if (!isCurrent) return;
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setError("The Wikimedia project catalog could not be loaded.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, []);

  return { projects, isLoading, error };
}
