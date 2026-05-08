"use client";

import { useEffect } from "react";

export function VisitTracker() {
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const key = `mel-visit-${today}`;
    if (window.localStorage.getItem(key)) return;

    window.localStorage.setItem(key, "1");
    void fetch("/api/visits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
      credentials: "same-origin",
      keepalive: true,
    }).catch(() => undefined);
  }, []);

  return null;
}
