'use client'

import { useState, useEffect, useCallback } from "react"
import { db } from "@/lib/firebase"
import { ref, push, set, update, onValue, remove } from "firebase/database"
import type { Visitante, RefeicaoPolicial, TPA, ConsumoBordo } from "@/lib/store"

// Generic hook for Firebase Realtime Database
function useFirebaseCollection<T extends { id: string }>(collectionPath: string) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
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
        // Sort by most recent first (assuming items have data/hora fields)
        items.reverse()
        setData(items)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
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

// Export the generic hook for custom collections
export { useFirebaseCollection }
