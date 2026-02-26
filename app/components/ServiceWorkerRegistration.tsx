"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      ("serviceWorker" in navigator && window.location.protocol === "https:") ||
      window.location.hostname === "localhost"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) =>
          console.log("Service Worker registrato con successo", reg.scope),
        )
        .catch((err) =>
          console.error("Errore registrazione Service Worker", err),
        );
    }
  }, []);

  return null;
}
