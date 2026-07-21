import { useEffect, useState } from "react";

import { createMentorRequest, getMentorship } from "../api/client";
import type { MentorRequest, MentorRequestInput } from "../types/api";

export function useMentorship(enabled: boolean) {
  const [request, setRequest] = useState<MentorRequest | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setRequest(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let isCurrent = true;
    getMentorship(controller.signal)
      .then((result) => {
        if (isCurrent) setRequest(result.request);
      })
      .catch((requestError: unknown) => {
        if (!isCurrent) return;
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError("Your mentor matching status could not be loaded.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [enabled]);

  const submitRequest = async (input: MentorRequestInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createMentorRequest(input);
      setRequest(result.request);
      return true;
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Your mentor request could not be submitted.",
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { request, isLoading, isSubmitting, error, submitRequest };
}
