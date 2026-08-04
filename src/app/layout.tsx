import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Museion',
  description: 'Studio créatif — Cinéma, documentaire, récits ambitieux.',
  icons: {
    icon: '/brand/museion-logo.png',
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
        {children}
      </body>
    </html>
  )
}
