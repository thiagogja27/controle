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
    if (
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('Service worker registration failed:', err);
      });
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
