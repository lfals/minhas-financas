"use client";

import { useEffect } from "react";

export function PWARegistration() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.serwist === undefined // Safety check to avoid double registration if someone manually added serwist
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered with scope:", registration.scope);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  return null;
}

declare global {
  interface Window {
    serwist: any;
  }
}
