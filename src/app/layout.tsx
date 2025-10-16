import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Domain Hunk - Domain Validation, Brand Kits & IP Guidance',
  description: 'Find your perfect domain with Domain Hunk. Check domain availability, generate brand kits, validate trademarks, and get IP guidance for your business ideas.',
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
      <body className={inter.className}>{children}</body>
    </html>
  )
}