'use client'
import { useDevnet } from '@/lib/devnet'

/** The canonical Verafy header (www.verafy.ai/header/v1), with the live devnet slot and the rest of the site menu. */
export function Header() {
  const { slot, error } = useDevnet()
  return (
    <verafy-header product="devnet" links="Map:/, Pipeline:/pipeline/, Docket:/docket/" style={{ display: 'block', minHeight: 64, background: '#0B0E12' }}>
      <span slot="status" aria-live="polite">{slot ? `Solana devnet, slot ${slot.toLocaleString('en-US')}` : error ? 'devnet RPC unreachable' : 'connecting to devnet'}</span>
      <div slot="menu" className="vh-menu">
        <a href="/templates/">Templates</a>
        <a href="/about/">What is real</a>
        <a href="/join/">Join the devnet</a>
      </div>
    </verafy-header>
  )
}
