import type { Metadata } from 'next'
import { StoreHydration } from '@/components/layout/StoreHydration'
import { VantaBackground } from '@/components/layout/VantaBackground'
import './globals.css'

export const metadata: Metadata = {
  title: 'Museion',
  description: 'Studio créatif — Cinéma, documentaire, récits ambitieux.',
  icons: {
    icon: '/brand/museion-mark.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="h-full" data-scroll-behavior="smooth">
      <body className="min-h-full bg-museion-base text-museion-primary antialiased">
        <VantaBackground />
        <StoreHydration />
        {children}
      </body>
    </html>
  )
}
