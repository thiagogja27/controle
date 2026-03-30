/// <reference lib="webworker" />

import { getOutbox, deleteFromOutbox, type OutboxRecord } from '@/utils/db';

declare const self: ServiceWorkerGlobalScope;

// --- Trava de Sincronização (Mutex) ---
// Garante que a função handleSync() não seja executada multiplas vezes em paralelo.
let isSyncing = false;

self.addEventListener("install", (event) => {
  console.log("Service Worker: Instalado");
  event.waitUntil(self.skipWaiting()); 
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Ativado");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("sync", (event: any) => {
  if (event.tag === "sync-new-items") {
    console.log("Service Worker: Evento de sincronização 'sync-new-items' recebido.");
    event.waitUntil(handleSync());
  }
});

async function handleSync() {
  if (isSyncing) {
    console.log("Service Worker: Sincronização já em progresso. Ignorando novo gatilho.");
    return;
  }

  isSyncing = true;
  console.log("Service Worker: Iniciando sincronização serializada...");
  notifyClients({ type: 'SYNC_START' });

  let failedItems = 0;

  try {
    const outboxItems = await getOutbox();
    if (outboxItems.length === 0) {
      console.log("Service Worker: Outbox vazio. Nada para sincronizar.");
      return;
    }

    console.log(`Service Worker: ${outboxItems.length} item(s) encontrados no outbox.`);

    for (const item of outboxItems) {
      try {
        console.log(`Service Worker: Processando item ${item.id}...`);
        const response = await fetch(`${self.location.origin}/api/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          await deleteFromOutbox(item.id);
          console.log(`Service Worker: Item ${item.id} sincronizado e removido.`);
          notifyClients({ type: 'SYNC_SUCCESS', payload: { ...result, deletedId: item.id } });
        } else {
          failedItems++;
          console.error(`Service Worker: Falha ao sincronizar item ${item.id}. Status: ${response.status}. Mensagem: ${result.message}`);
        }
      } catch (error) {
        failedItems++;
        console.error(`Service Worker: Erro de rede ao processar item ${item.id}.`, error);
        break; 
      }
    }

    console.log("Service Worker: Processamento do outbox concluído.");

  } catch (error) {
    console.error("Service Worker: Erro catastrófico durante a busca no outbox.", error);
  } finally {
    isSyncing = false; 
    console.log(`Service Worker: Sincronização finalizada. Itens com falha: ${failedItems}`);
    notifyClients({ type: 'SYNC_COMPLETE', payload: { failedCount: failedItems } });
  }
}

function notifyClients(message: object) {
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
    if (clients && clients.length) {
      clients.forEach(client => {
        client.postMessage(message);
      });
    }
  });
}
