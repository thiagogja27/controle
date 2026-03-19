'use client'

import { AuthProvider } from '@/hooks/use-auth'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { useEffect } from 'react'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }
  }, []);

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {!isOnline && (
          <div className="bg-yellow-500 text-center p-2 text-white">
            Você está offline. Algumas funcionalidades podem não estar disponíveis.
          </div>
        )}
        <AuthProvider>
          {children}
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}
