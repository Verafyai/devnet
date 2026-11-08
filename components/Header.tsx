'use client'
import { usePathname } from 'next/navigation'
import { Mark } from './Logo'
import { useDevnet } from '@/lib/devnet'
import { run } from '@/lib/run'

const LINKS: [string, string][] = [['/', 'Map'], ['/pipeline/', 'Pipeline'], ['/docket/', 'Docket'], ['/templates/', 'Templates'], ['/about/', 'What is real']]

export function Header() {
  const path = usePathname() ?? '/'
  const { slot, error } = useDevnet()
  return (
    <header className="hdr">
      <a href="/" className="brand"><Mark size={30} />Verafy Devnet</a>
      <span className="pill">v{run.version}</span>
      <span className="live" aria-live="polite"><span className={error ? 'dot off' : 'dot'} />{slot ? `Solana devnet · slot ${slot.toLocaleString('en-US')}` : error ? 'devnet RPC unreachable' : 'connecting to devnet'}</span>
      <nav className="nav" aria-label="Main">
        {LINKS.map(([h, l]) => <a key={h} href={h} className={path === h || (h !== '/' && path.startsWith(h)) ? 'on' : undefined} aria-current={path === h ? 'page' : undefined}>{l}</a>)}
        <a href="/join/" className="cta">Join the devnet</a>
      </nav>
    </header>
  )
}
