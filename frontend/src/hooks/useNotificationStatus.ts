import { useEffect, useState } from "react";

import { getNotificationStatus } from "../api/client";
import type { NotificationStatusResponse } from "../types/api";

export function useNotificationStatus(enabled: boolean) {
  const [status, setStatus] = useState<NotificationStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setStatus(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    getNotificationStatus(controller.signal)
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, [enabled]);

  return { status, isLoading };
}
