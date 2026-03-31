'use client'

import { useEffect, useCallback, useState } from 'react'
import { toast } from 'sonner'
import { getOutbox } from '@/utils/db'

// --- Funções Auxiliares ---

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.sync) {
        return registration;
      }
    } catch (error) {
      console.error('Erro ao registrar o Service Worker:', error);
    }
  }
  return null;
}

async function requestSync() {
  const registration = await registerServiceWorker();
  if (registration) {
    try {
      await registration.sync.register('sync-new-items');
      console.log("Etiqueta de sincronização 'sync-new-items' registrada.");
    } catch (error) {
      console.error('Falha ao registrar a etiqueta de sincronização:', error);
    }
  }
}

// --- O Hook Principal ---

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const updatePendingCount = useCallback(async () => {
    try {
      const outbox = await getOutbox();
      setPendingCount(outbox.length);
    } catch (error) {
      console.error("Falha ao atualizar a contagem de itens pendentes:", error);
    }
  }, []);

  useEffect(() => {
    // Só executa no navegador
    if (typeof window === 'undefined') return;

    // Atualiza a contagem inicial ao carregar
    updatePendingCount();

    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'SYNC_START':
          setIsSyncing(true);
          toast.loading(`Sincronizando...`, {
            id: 'sync-toast',
            duration: Infinity,
          });
          break;

        case 'SYNC_SUCCESS':
          // Atualiza a contagem otimisticamente
          setPendingCount(prev => (prev > 0 ? prev - 1 : 0));
          break;

        case 'SYNC_COMPLETE':
          setIsSyncing(false);
          updatePendingCount().then(() => {
            setPendingCount(currentCount => {
              if (currentCount > 0) {
                toast.warning(`Sincronização parcial. ${currentCount} item(ns) restante(s).`, {
                  id: 'sync-toast',
                  duration: 5000,
                });
              } else {
                toast.success('Sincronização concluída!', {
                  id: 'sync-toast',
                  duration: 3000,
                });
              }
              return currentCount;
            });
          });
          break;
      }
    };
    
    // Ouvinte para eventos de adição/remoção que não vêm do SW
    const handleOutboxChange = () => {
      updatePendingCount();
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    window.addEventListener('outbox-updated', handleOutboxChange);

    // Se estiver online ao carregar, pede uma sincronização
    if (navigator.onLine) {
      requestSync();
    }

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
      window.removeEventListener('outbox-updated', handleOutboxChange);
      toast.dismiss('sync-toast');
    };
  }, [updatePendingCount]);

  return { isSyncing, pendingCount };
}
