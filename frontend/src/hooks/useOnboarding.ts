import { useEffect, useState } from "react";

import { completeOnboarding, getOnboarding } from "../api/client";
import type { OnboardingInput, OnboardingProfile } from "../types/api";

export function useOnboarding(enabled: boolean) {
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [completed, setCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setProfile(null);
      setCompleted(false);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let isCurrent = true;
    getOnboarding(controller.signal)
      .then((result) => {
        if (!isCurrent) return;
        setProfile(result.profile);
        setCompleted(result.completed);
      })
      .catch((requestError: unknown) => {
        if (!isCurrent) return;
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError("Onboarding could not be loaded.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [enabled]);

  const save = async (input: OnboardingInput) => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await completeOnboarding(input);
      setProfile(result.profile);
      setCompleted(result.completed);
      return result.profile;
    } catch {
      setError("Your choices could not be saved. Please try again.");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  return { profile, completed, isLoading, isSaving, error, save };
}
