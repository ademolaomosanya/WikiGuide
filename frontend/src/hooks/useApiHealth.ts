import { useEffect, useState } from "react";

import { getHealth } from "../api/client";

export function useApiHealth() {
  const [status, setStatus] = useState("unavailable");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    getHealth(controller.signal)
      .then((result) => setStatus(result.status))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("unavailable");
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, []);

  return { status, isLoading };
}
