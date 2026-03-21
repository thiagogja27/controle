'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { getOutbox, deleteFromOutbox } from '@/utils/db'

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const isProcessing = useRef(false)

  const updatePendingCount = useCallback(async () => {
    try {
      const outbox = await getOutbox()
      setPendingCount(outbox.length)
      return outbox
    } catch (e) {
      return []
    }
  }, [])

  const syncOutbox = useCallback(async () => {
    if (isProcessing.current) return
    
    try {
      const outbox = await updatePendingCount()
      if (outbox.length === 0) {
        setIsSyncing(false)
        return
      }

      isProcessing.current = true
      setIsSyncing(true)
      
      toast.info(`Sincronizando ${outbox.length} item(ns) pendente(s)...`, {
        id: 'sync-toast',
        duration: Infinity
      })

      let successCount = 0
      let failCount = 0
      let lastError = ''

      for (const record of outbox) {
        try {
          const response = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
          })

          if (response.ok) {
            await deleteFromOutbox(record.id)
            successCount++
            window.dispatchEvent(new CustomEvent('outbox-updated'))
          } else {
            const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
            lastError = errorData.message || response.statusText
            failCount++
          }
        } catch (err) {
          lastError = err instanceof Error ? err.message : 'Falha de rede'
          failCount++
          break
        }
      }

      await updatePendingCount()

      if (successCount > 0 && failCount === 0) {
        toast.success(`Sincronização concluída: ${successCount} item(ns) enviados.`, {
          id: 'sync-toast'
        })
      } else if (failCount > 0) {
        toast.error(`Falha ao sincronizar: ${lastError}. (${successCount} enviados, ${failCount} pendentes)`, {
          id: 'sync-toast',
          duration: 5000
        })
      } else {
        toast.dismiss('sync-toast')
      }
    } catch (error) {
      console.error('Erro crítico na sincronização:', error)
    } finally {
      isProcessing.current = false
      setIsSyncing(false)
    }
  }, [updatePendingCount])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Carrega contagem inicial
    updatePendingCount()

    const handleOnline = () => {
      console.log('Online! Sincronizando...')
      syncOutbox()
    }

    const handleOutboxChange = () => {
      updatePendingCount()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('outbox-updated', handleOutboxChange)
    
    if (navigator.onLine) {
      syncOutbox()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('outbox-updated', handleOutboxChange)
    }
  }, [syncOutbox, updatePendingCount])

  return { syncOutbox, isSyncing, pendingCount }
}
