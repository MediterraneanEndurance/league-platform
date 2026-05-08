"use client";

import { Download, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type StandaloneNavigator = Navigator & {
  standalone?: boolean;
};

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as StandaloneNavigator).standalone === true;
}

export function PwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => (typeof window === "undefined" ? false : isStandalone()));

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (installed || !installPrompt) return null;

  return (
    <button
      className="inline-flex items-center justify-center gap-2 rounded border border-cyan-400/40 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-400/10"
      type="button"
      onClick={async () => {
        const prompt = installPrompt;
        setInstallPrompt(null);
        await prompt.prompt();
        const choice = await prompt.userChoice;
        setInstalled(choice.outcome === "accepted" || isStandalone());
      }}
    >
      <Download size={14} />
      <span className="hidden md:inline">Install</span>
      <Smartphone size={14} className="md:hidden" />
    </button>
  );
}
