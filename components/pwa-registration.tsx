"use client";

import { useEffect, useCallback, useState } from "react";

const CURRENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0";

export function PWARegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updating, setUpdating] = useState(false);

  const checkForUpdates = useCallback(async () => {
    try {
      const res = await fetch("/api/version", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();

      if (data.version && data.version !== CURRENT_VERSION) {
        console.log(
          `[PWA] Nova versão detectada: ${data.version} (atual: ${CURRENT_VERSION})`
        );
        setUpdateAvailable(true);

        // Força o service worker a checar por atualização
        const registration = await navigator.serviceWorker?.getRegistration();
        if (registration) {
          await registration.update();
        }
      }
    } catch (err) {
      console.warn("[PWA] Falha ao verificar versão:", err);
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    setUpdating(true);
    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage("SKIP_WAITING");
      } else {
        // Se não tem worker esperando, recarrega direto
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      window.serwist !== undefined
    ) {
      return;
    }

    // Registrar o Service Worker servido pela rota dinâmica
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log(
          "[PWA] Service Worker registered with scope:",
          registration.scope
        );

        // Checar por atualizações quando um novo worker é encontrado
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // Nova versão detectada e instalada
                console.log("[PWA] Novo Service Worker instalado.");
                setUpdateAvailable(true);
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error("[PWA] Service Worker registration failed:", error);
      });

    // Recarrega a página quando o Service Worker controlador muda (nova versão ativa)
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    // Verifica se há nova versão ao carregar
    checkForUpdates();

    // Verifica novamente quando o app volta ao foco
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForUpdates();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkForUpdates]);

  if (!updateAvailable) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "env(safe-area-inset-bottom, 16px)",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99999,
        animation: "pwa-toast-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          background: "rgba(23, 23, 23, 0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(247, 243, 234, 0.14)",
          borderRadius: "0",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(216, 243, 106, 0.1)",
          color: "#f7f3ea",
          fontSize: "13px",
          fontFamily:
            '"Avenir Next", "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d8f36a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Nova versão disponível
        </span>
        <button
          onClick={applyUpdate}
          disabled={updating}
          style={{
            padding: "6px 14px",
            background: "#d8f36a",
            color: "#101010",
            border: "none",
            borderRadius: "0",
            fontSize: "12px",
            fontWeight: 600,
            cursor: updating ? "wait" : "pointer",
            opacity: updating ? 0.7 : 1,
            transition: "opacity 0.15s ease",
            fontFamily: "inherit",
          }}
        >
          {updating ? "Atualizando…" : "Atualizar"}
        </button>
        <button
          onClick={() => setUpdateAvailable(false)}
          aria-label="Fechar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "24px",
            height: "24px",
            background: "none",
            border: "none",
            color: "rgba(247, 243, 234, 0.5)",
            cursor: "pointer",
            padding: 0,
            fontSize: "16px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <style>{`
        @keyframes pwa-toast-in {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

declare global {
  interface Window {
    serwist: any;
  }
}
