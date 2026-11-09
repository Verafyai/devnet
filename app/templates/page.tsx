import type { Metadata } from 'next'
import { run, TEMPLATE } from '@/lib/run'

export const metadata: Metadata = { title: 'Templates', description: 'The Actually Smart Contract templates running on the Verafy devnet, each shipped in Verafy Harness with a VIP and a tailoring prompt.' }

const VIP: Record<string, [string, string]> = {
  'agentic-contract': ['0029', 'A deal between two AI agents, with a jury as the neutral third party.'],
  'agent-bond': ['0033', 'Money behind an agent’s behavior; anyone can report, a jury slashes.'],
  'super-grant': ['0030', 'Base grants for answering a Request for Ideas, tranches for verified outcomes.'],
  hackathon: ['0031', 'A prize pool graded by a council from repository snapshots.'],
  'dao-constitution': ['0032', 'A treasury that executes only what the constitution allows.'],
  treasury: ['0011', 'A budget that pays only for its purpose, under caps.'],
  'verafy-certification': ['0034', 'A program’s report card on Solana, written only from a jury ruling on a Fuzzy report.'],
}

export default function Page() {
  return (
    <div className="wrap">
      <p className="eb">Templates</p>
      <h1>What the agents and apps here are running</h1>
      <p className="lede">Each template is an Actually Smart Contract program shipped in Verafy Harness v0.0.5-alpha, with a VIP, tests, a demo and a prompt that tailors it to a deal. Full pages are on asc.verafy.ai.</p>
      <div className="grid g3" style={{ marginTop: 22 }}>
        {Object.entries(VIP).map(([k, [vip, blurb]]) => {
          const t = TEMPLATE[k]
          const n = run.rulings.filter(r => r.template === k).length
          return (
            <a key={k} href={`https://asc.verafy.ai/templates/${t.asc ?? k}`} className="card" style={{ color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="row" style={{ justifyContent: 'space-between' }}><span style={{ width: 12, height: 12, borderRadius: 3, background: t.color }} /><span className="mono dim" style={{ fontSize: 12 }}>VIP-{vip}</span></span>
              <b style={{ fontSize: 18 }}>{t.name}</b>
              <span className="muted" style={{ fontSize: 14, flex: 1 }}>{blurb}</span>
              <span className="mono dim" style={{ fontSize: 12 }}>{n ? `${n} rulings in this run` : 'not in this run yet'}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
