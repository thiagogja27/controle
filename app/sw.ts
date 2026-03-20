/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import { getOutbox, clearOutbox } from "@/utils/db";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

self.addEventListener("sync", (event: any) => {
  if (event.tag === "sync-new-items") {
    event.waitUntil(handleSync());
  }
});

async function handleSync() {
  console.log("Iniciando sincronização de itens em segundo plano...");
  try {
    const outbox = await getOutbox();
    if (outbox.length === 0) return;

    for (const record of outbox) {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(record),
      });

      if (!response.ok) {
        throw new Error(`Falha ao sincronizar registro ${record.id}`);
      }
    }

    await clearOutbox();
    console.log("Sincronização concluída com sucesso.");
  } catch (error) {
    console.error("Erro durante a sincronização:", error);
  }
}

serwist.addEventListeners();
