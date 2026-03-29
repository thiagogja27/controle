import { Inter } from 'next/font/google';
import './globals.css'
import { ClientLayout } from '@/components/client-layout'

export const metadata = {
  manifest: "/manifest.json",
  title: "Controle Project",
  description: "Controle Project PWA",
};

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} font-sans antialiased`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
