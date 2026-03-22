'use client'

import { AuthProvider } from '@/hooks/use-auth'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { Analytics } from '@vercel/analytics/next'
import { useEffect } from 'react'
import { useSync } from '@/hooks/use-sync'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus();
  useSync(); // Ativa a sincronização automática

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleServiceWorkerMessage = (event: MessageEvent) => {
        // Verifica se a mensagem é do tipo SYNC_SUCCESS
        if (event.data && event.data.type === 'SYNC_SUCCESS') {
          // Dispara um evento customizado na window para que a UI possa reagir
          window.dispatchEvent(
            new CustomEvent('sync-success', { 
              detail: { 
                originalId: event.data.originalId, 
                newId: event.data.newId 
              } 
            })
          );
        }
      };

      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js').catch(err => {
          console.warn('Service worker registration failed:', err);
        });
      }

      // Limpeza do listener ao desmontar o componente
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, []);

  return (
    <>
      {!isOnline && (
        <div className="bg-yellow-500 text-center p-2 text-white">
          Você está offline. Algumas funcionalidades podem não estar disponíveis.
        </div>
      )}
      <AuthProvider>
        {children}
        <Analytics />
      </AuthProvider>
    </>
  )
}
