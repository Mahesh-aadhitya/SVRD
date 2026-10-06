"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // A worker left over from a production build on localhost would keep
      // serving stale CSS/JS in dev — remove it and its caches.
      navigator.serviceWorker.getRegistrations().then((regs) => {
        if (regs.length === 0) return;
        Promise.all(regs.map((r) => r.unregister()))
          .then(() => caches.keys())
          .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
          .then(() => window.location.reload());
      });
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installability is a progressive enhancement; silently skip if it fails.
    });
  }, []);

  return null;
}
