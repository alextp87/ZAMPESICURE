import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'ZampeSicure - Animali Smarriti e Ritrovati Trapani',
  description: 'Segnala animali smarriti o avvistati nella provincia di Trapani. Aiuta a riunire gli animali con le loro famiglie.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  metadataBase: new URL('https://www.zampe-sicure.it'),
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: 'https://www.zampe-sicure.it',
    siteName: 'ZampeSicure',
    title: 'ZampeSicure - Animali Smarriti e Ritrovati Trapani',
    description: 'Segnala animali smarriti o avvistati nella provincia di Trapani. Aiuta a riunire gli animali con le loro famiglie.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ZampeSicure - Animali Smarriti e Ritrovati Trapani',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZampeSicure - Animali Smarriti e Ritrovati Trapani',
    description: 'Segnala animali smarriti o avvistati nella provincia di Trapani.',
    images: ['/og-image.jpg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ZampeSicure',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#ea580c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
