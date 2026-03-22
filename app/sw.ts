/// <reference lib="webworker" />

import { getOutbox, deleteFromOutbox, type OutboxRecord } from '@/utils/db';

declare const self: ServiceWorkerGlobalScope;

// --- Trava de Sincronização (Mutex) ---
// Garante que a função handleSync() não seja executada multiplas vezes em paralelo,
// o que poderia levar a duplicações de dados.
let isSyncing = false;

self.addEventListener("install", (event) => {
  console.log("Service Worker: Instalado");
  event.waitUntil(self.skipWaiting()); 
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Ativado");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("sync", (event) => {
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

  try {
    const outboxItems = await getOutbox();
    if (outboxItems.length === 0) {
      console.log("Service Worker: Outbox vazio. Nada para sincronizar.");
      return;
    }

    console.log(`Service Worker: ${outboxItems.length} item(s) encontrados no outbox.`);

    // Processa os itens um por um, de forma sequencial (transacional)
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
          // SUCESSO: O item foi salvo no DB. Agora podemos removê-lo do outbox.
          await deleteFromOutbox(result.originalId);
          console.log(`Service Worker: Item ${result.originalId} sincronizado e removido do outbox.`);
          
          // Notifica a interface para remover o item temporário da UI
          notifyClients(result);

        } else {
          // FALHA: A API reportou um erro. O item permanecerá no outbox para uma tentativa futura.
          console.error(`Service Worker: Falha ao sincronizar item ${item.id}. Status: ${response.status}. Mensagem: ${result.message}`);
        }
      } catch (error) {
        // FALHA DE REDE: O fetch falhou. O item permanecerá no outbox.
        console.error(`Service Worker: Erro de rede ao processar item ${item.id}. O item permanece no outbox.`, error);
        // Como a conexão pode ter caído, paramos o loop atual e esperamos um novo evento "sync".
        break; 
      }
    }

    console.log("Service Worker: Processamento do outbox concluído.");

  } catch (error) {
    console.error("Service Worker: Erro catastrófico durante a busca no outbox.", error);
  } finally {
    isSyncing = false; // Libera a trava para a próxima sincronização
  }
}

/**
 * Envia uma mensagem para todas as abas/clientes abertos da aplicação.
 * @param {any} data - O objeto de dados a ser enviado.
 */
function notifyClients(data: any) {
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
    if (clients && clients.length) {
      clients.forEach(client => {
        client.postMessage({ type: 'SYNC_SUCCESS', payload: data });
      });
    }
  });
}
