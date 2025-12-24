import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Domain Hunk - Domain Validation, Brand Kits & IP Guidance',
  description: 'Find your perfect domain with Domain Hunk. Check domain availability, generate brand kits, validate trademarks, and get IP guidance for your business ideas.',
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    apple: [
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  other: {
    'impact-site-verification': '315d124e-5765-432e-b58f-621ae04015b7',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external API domains for faster DNS resolution and connection */}
        <link rel="preconnect" href="https://zylalabs.com" />
        <link rel="dns-prefetch" href="https://zylalabs.com" />
        <link rel="preconnect" href="https://www.whoisxmlapi.com" />
        <link rel="dns-prefetch" href="https://www.whoisxmlapi.com" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}