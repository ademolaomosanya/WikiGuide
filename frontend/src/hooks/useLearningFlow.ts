import { useEffect, useState } from "react";

import { completeLearningLesson, getLearningFlow } from "../api/client";
import type { LearningFlowResponse } from "../types/api";

export function useLearningFlow(enabled: boolean) {
  const [flow, setFlow] = useState<LearningFlowResponse | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [completingSlug, setCompletingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setFlow(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let isCurrent = true;
    setIsLoading(true);
    setError(null);

    getLearningFlow(controller.signal)
      .then((result) => {
        if (isCurrent) setFlow(result);
      })
      .catch((requestError: unknown) => {
        if (!isCurrent) return;
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setError("Your learning path could not be loaded.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [enabled]);

  const completeLesson = async (lessonSlug: string) => {
    setCompletingSlug(lessonSlug);
    setError(null);
    try {
      const result = await completeLearningLesson(lessonSlug);
      setFlow(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The lesson could not be completed.",
      );
    } finally {
      setCompletingSlug(null);
    }
  };

  return { flow, isLoading, completingSlug, error, completeLesson };
}
