/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import { getOutbox, deleteFromOutbox } from "@/utils/db";

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
    console.log(`Itens no outbox: ${outbox.length}`);
    if (outbox.length === 0) return;

    for (const record of outbox) {
      console.log(`Tentando sincronizar registro: ${record.id} (${record.tableName})`);
      try {
        const response = await fetch(`${self.location.origin}/api/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(record),
        });

        if (response.ok) {
          await deleteFromOutbox(record.id);
          console.log(`Registro ${record.id} sincronizado e removido do outbox.`);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.warn(`Falha ao sincronizar registro ${record.id}:`, response.status, errorData);
        }
      } catch (fetchError) {
        console.error(`Erro ao enviar registro ${record.id} para a API:`, fetchError);
        // Interrompe o loop se houver erro de rede, tentará novamente no próximo evento de sync
        break;
      }
    }
    console.log("Processo de sincronização finalizado.");
  } catch (error) {
    console.error("Erro crítico durante a sincronização:", error);
  }
}

serwist.addEventListeners();
