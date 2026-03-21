'use client'

import { useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { getOutbox, deleteFromOutbox } from '@/utils/db'

export function useSync() {
  const isSyncing = useRef(false)

  const syncOutbox = useCallback(async () => {
    if (isSyncing.current) return
    
    try {
      const outbox = await getOutbox()
      if (outbox.length === 0) return

      isSyncing.current = true
      toast.info(`Sincronizando ${outbox.length} item(ns) pendente(s)...`, {
        id: 'sync-toast',
        duration: Infinity
      })

      let successCount = 0
      let failCount = 0

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
          } else {
            failCount++
          }
        } catch (err) {
          console.error(`Erro ao sincronizar item ${record.id}:`, err)
          failCount++
          // Se for erro de rede, para o loop e tenta depois
          break
        }
      }

      if (successCount > 0) {
        toast.success(`Sincronização concluída: ${successCount} item(ns) enviados.`, {
          id: 'sync-toast'
        })
      } else if (failCount > 0) {
        toast.error(`Falha ao sincronizar ${failCount} item(ns). Tentaremos novamente em breve.`, {
          id: 'sync-toast'
        })
      } else {
        toast.dismiss('sync-toast')
      }
    } catch (error) {
      console.error('Erro crítico na sincronização:', error)
    } finally {
      isSyncing.current = false
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      console.log('Voltamos online! Iniciando sincronização...')
      syncOutbox()
    }

    window.addEventListener('online', handleOnline)
    
    // Tenta sincronizar ao carregar se já estiver online
    if (navigator.onLine) {
      syncOutbox()
    }

    return () => window.removeEventListener('online', handleOnline)
  }, [syncOutbox])

  return { syncOutbox }
}
