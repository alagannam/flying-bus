import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'The Flying Bus',
    template: '%s | The Flying Bus',
  },
  description: 'A safe global club where kids create, compete, earn Kana Coins, and help other kids around the world.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.theflyingbus.org'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
