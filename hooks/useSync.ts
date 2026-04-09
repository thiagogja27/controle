'use client'

import { useEffect, useCallback, useState } from 'react'
import { toast } from 'sonner'
import { getOutbox } from '@/utils/db'

// --- Funções Auxiliares ---

async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // ⚠️ checagem segura
    if ('sync' in registration) {
      return registration;
    }
  } catch (error) {
    console.error('Erro ao registrar o Service Worker:', error);
  }

  return null;
}

async function requestSync() {
  const registration = await registerServiceWorker();

  if (!registration) return;

  try {
    // ⚠️ cast seguro porque TS não garante sync
    await (registration as any).sync.register('sync-new-items');
    console.log("Etiqueta de sincronização 'sync-new-items' registrada.");
  } catch (error) {
    console.error('Falha ao registrar a etiqueta de sincronização:', error);
  }
}

// --- O Hook Principal ---

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const updatePendingCount = useCallback(async () => {
    try {
      const outbox = await getOutbox();

      // ⚠️ proteção extra
      if (Array.isArray(outbox)) {
        setPendingCount(outbox.length);
      } else {
        setPendingCount(0);
      }
    } catch (error) {
      console.error("Falha ao atualizar a contagem de itens pendentes:", error);
      setPendingCount(0);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    updatePendingCount();

    const handleMessage = (event: MessageEvent) => {
      // ⚠️ proteção contra undefined
      if (!event?.data) return;

      const { type } = event.data;

      switch (type) {
        case 'SYNC_START':
          setIsSyncing(true);
          toast.loading('Sincronizando...', {
            id: 'sync-toast',
            duration: Infinity,
          });
          break;

        case 'SYNC_SUCCESS':
          setPendingCount(prev => (prev > 0 ? prev - 1 : 0));
          break;

        case 'SYNC_COMPLETE':
          setIsSyncing(false);

          updatePendingCount().then(() => {
            setPendingCount(currentCount => {
              if (currentCount > 0) {
                toast.warning(
                  `Sincronização parcial. ${currentCount} item(ns) restante(s).`,
                  {
                    id: 'sync-toast',
                    duration: 5000,
                  }
                );
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

        default:
          break;
      }
    };

    const handleOutboxChange = () => {
      updatePendingCount();
    };

    // ⚠️ só adiciona listener se existir
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    window.addEventListener('outbox-updated', handleOutboxChange);

    if (navigator.onLine) {
      requestSync();
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }

      window.removeEventListener('outbox-updated', handleOutboxChange);
      toast.dismiss('sync-toast');
    };
  }, [updatePendingCount]);

  return { isSyncing, pendingCount };
}