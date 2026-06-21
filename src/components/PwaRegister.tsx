"use client";

import { useEffect } from "react";

/** Registers the service worker so the app is installable to the home screen. */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal — the site works without the SW; only install/offline lapse.
      });
    }
  }, []);
  return null;
}
