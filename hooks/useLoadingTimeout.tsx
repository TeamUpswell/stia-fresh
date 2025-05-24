import { useState, useEffect } from "react";

export function useLoadingTimeout(initialLoading = false, timeoutMs = 10000) {
  const [loading, setLoading] = useState(initialLoading);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (loading) {
      // Set a timeout to show timeout message
      timeoutId = setTimeout(() => {
        setTimedOut(true);
        // IMPORTANT: Don't set loading to false here!
        // This keeps content visible even after timeout
      }, timeoutMs);
    } else {
      // Reset timeout state when loading ends
      setTimedOut(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, timeoutMs]);

  return { loading, setLoading, timedOut, setTimedOut };
}
