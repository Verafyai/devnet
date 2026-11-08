import './globals.css'
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Header } from '@/components/Header'
import { ClockProvider } from '@/lib/clock'
import { run } from '@/lib/run'

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  metadataBase: new URL('https://devnet.verafy.ai'),
  title: { default: 'Verafy Devnet', template: '%s · Verafy Devnet' },
  description: 'Watch the Verafy devnet work: apps make Actually Smart Contract calls, harnesses batch and judge them, rulings seal into blocks anchored to Solana devnet. Every step can be audited.',
  icons: { icon: '/logo.svg' },
  openGraph: { images: ['/og.png'] },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <ClockProvider>
          <Header />
          {children}
          <footer className="foot">
            <span>Verafy Devnet v{run.version}. A replay of a recorded run on Solana devnet, looping; devnet status is live.</span>
            <a href="/about/">What is real and what is not</a>
            <a href="https://github.com/Verafyai/devnet">Source</a>
            <a href="https://verafy.ai">verafy.ai</a>
          </footer>
        </ClockProvider>
      </body>
    </html>
  )
}
