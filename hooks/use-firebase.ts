'use client'

import { useState, useEffect, useCallback } from "react"
import { db } from "@/lib/firebase"
import { ref, push, set, update, onValue, remove } from "firebase/database"
import type { Visitante, RefeicaoPolicial, TPA, ConsumoBordo, Navio } from "@/lib/store"

// Generic hook for Firebase Realtime Database
function useFirebaseCollection<T extends { id: string }>(collectionPath: string) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // 1. Tenta carregar do cache local primeiro (localStorage)
    const cacheKey = `firebase_cache_${collectionPath}`;
    if (typeof window !== 'undefined') {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const initialData = JSON.parse(cachedData);
          setData(initialData);
          setLoading(false);
        } catch (e) {
          console.error("Erro ao carregar cache:", e);
        }
      }
    }

    // 2. Busca itens do outbox (IndexedDB) para mostrar o que ainda não sincronizou
    const fetchOutbox = async () => {
        try {
            const { getOutbox } = await import("@/utils/db");
            const outboxRecords = await getOutbox();
            const relevantOutbox = outboxRecords
                .filter((rec: any) => rec.tableName === collectionPath && rec.action === 'create')
                .map((rec: any) => ({ id: rec.id, ...rec.data, isOffline: true } as T & { isOffline?: boolean }));
            
            setData(prev => {
                // Filtra itens que NÃO são do outbox (ou seja, vieram do Firebase/Cache)
                const nonOfflineItems = prev.filter(item => !(item as any).isOffline);
                // Evita duplicatas se já houver algo no cache com o mesmo ID
                const existingIds = new Set(nonOfflineItems.map(item => item.id));
                const newOfflineItems = relevantOutbox.filter(item => !existingIds.has(item.id));
                return [...newOfflineItems, ...nonOfflineItems];
            });
        } catch (e) {
            console.error("Erro ao carregar outbox no hook:", e);
        }
    };
    
    fetchOutbox();

    // Listener para atualizações manuais do outbox
    const handleOutboxUpdate = () => fetchOutbox();
    window.addEventListener('outbox-updated', handleOutboxUpdate);

    const collectionRef = ref(db, collectionPath)
    
    const unsubscribe = onValue(
      collectionRef,
      (snapshot) => {
        const items: T[] = []
        snapshot.forEach((childSnapshot) => {
          items.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val(),
          })
        })
        items.reverse()
        setData(items)
        setLoading(false)
        
        // Salva no cache local para uso offline futuro
        if (typeof window !== 'undefined') {
          localStorage.setItem(cacheKey, JSON.stringify(items));
        }
      },
      (err) => {
        console.error(`Erro no Firebase (${collectionPath}):`, err);
        setError(err)
        setLoading(false)
      }
    )

    return () => {
      unsubscribe();
      window.removeEventListener('outbox-updated', handleOutboxUpdate);
    };
  }, [collectionPath])

  const addItem = useCallback(async (item: Omit<T, "id">) => {
    try {
      const collectionRef = ref(db, collectionPath)
      const newRef = push(collectionRef)
      await set(newRef, item)
      return newRef.key
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [collectionPath])

  const updateItem = useCallback(async (id: string, updates: Partial<T>) => {
    try {
      const itemRef = ref(db, `${collectionPath}/${id}`)
      await update(itemRef, updates)
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [collectionPath])

  const deleteItem = useCallback(async (id: string) => {
    try {
      const itemRef = ref(db, `${collectionPath}/${id}`)
      await remove(itemRef)
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [collectionPath])

  return { data, loading, error, addItem, updateItem, deleteItem }
}

// Specific hooks for each collection
export function useVisitantes() {
  return useFirebaseCollection<Visitante>("visitantes")
}

export function useRefeicoes() {
  return useFirebaseCollection<RefeicaoPolicial>("refeicoes")
}

export function useTPAs() {
  return useFirebaseCollection<TPA>("tpas")
}

export function useConsumos() {
  return useFirebaseCollection<ConsumoBordo>("consumos")
}

export function useNavios() {
    return useFirebaseCollection<Navio>("navios");
}

export function useHistoricoNavios() {
    return useFirebaseCollection<Navio>("historico_navios");
}

// Export the generic hook for custom collections
export { useFirebaseCollection }
