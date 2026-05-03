"use client";

import { useEffect, useState } from "react";

export function useLastFmCredentials() {
  const [ready, setReady] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    try {
      setApiKey(localStorage.getItem("lfm_apikey") || "");
      setUsername(
        localStorage.getItem("lfm_user") ||
          localStorage.getItem("lmf_user") ||
          "",
      );
    } catch {
      setApiKey("");
      setUsername("");
    }
    setReady(true);
  }, []);

  return { ready, apiKey, username };
}
