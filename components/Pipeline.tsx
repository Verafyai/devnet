'use client'
import { run, TEMPLATE, answerColor, explorer, appName } from '@/lib/run'
import { useClock, SpeedControl } from '@/lib/clock'
import { fmt } from './NetworkMap'

const STAGES = [
  ['Apps submit', 'Plain-word ASC calls, each with pinned context.'],
  ['Queue', 'Waiting for the next batch.'],
  ['Batch', 'Fills to 500 requests.'],
  ['Pack', 'Identical questions merged; the rest packed into prompts.'],
  ['Prove', 'One proof of inference per packed prompt.'],
  ['Serve', 'Prompts, context and proof hashes go to the jury.'],
  ['Jury', 'Five seats, four families, commit then reveal.'],
  ['Seal and return', 'Sealed into a block; answers back to each app.'],
] as const

export default function Pipeline() {
  const { t } = useClock()
  const b = run.batches.find(x => t >= x.openedAt && t < x.sealedAt + 20) ?? [...run.batches].reverse().find(x => x.openedAt <= t) ?? run.batches[0]
  const phase = t < b.closedAt ? 2 : t < b.closedAt + 6 ? 3 : t < b.closedAt + 14 ? 4 : t < b.closedAt + 20 ? 5 : t < b.sealedAt ? 6 : 7
  const fill = Math.max(0, Math.min(500, Math.round(((t - b.openedAt) / (b.closedAt - b.openedAt)) * 500)))
  const appsSorted = Object.entries(b.apps).filter(([, n]) => n > 0).sort((x, y) => y[1] - x[1])
  const max = appsSorted[0]?.[1] ?? 1
  const blocks = run.blocks.filter(x => x.t <= t).slice(-8)
  const stageBig = (i: number) => [
    `${appsSorted.length} apps`, phase < 2 ? '…' : `${Math.max(0, 500 - fill)} waiting`, `${phase === 2 ? fill : 500} / 500`, phase >= 3 ? `${b.unique} → ${b.prompts}` : 'not yet',
    phase >= 4 ? `${phase === 4 ? Math.max(1, b.prompts - 1) : b.prompts} / ${b.prompts}` : 'not yet', phase >= 5 ? `${b.prompts} prompts` : 'not yet', phase >= 6 ? `${b.packed.length} rulings` : 'not yet', phase >= 7 ? 'returned' : 'not yet',
  ][i]

  return (
    <div className="wrap">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <p className="eb">Pipeline</p>
          <h1>From an app's question to a sealed block</h1>
          <p className="lede">Apps ask questions in plain words. Harnesses batch them 500 at a time, merge the duplicates, pack, prove, put them to a jury, seal the rulings into a block anchored to Solana devnet, and send each app its answers.</p>
        </div>
        <SpeedControl />
      </div>

      <section style={{ marginTop: 22 }}>
        <p className="eb">Blocks</p>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
          {blocks.map((x, i) => (
            <a key={x.n} href={x.anchor ? explorer(x.anchor.signature) : '/about/'} className="card" style={{ flex: 'none', width: 160, padding: 12, color: 'var(--text)', borderColor: i === blocks.length - 1 ? 'var(--teal)' : 'var(--line)' }}>
              <span className="mono" style={{ display: 'block', fontSize: 14, color: i === blocks.length - 1 ? 'var(--teal)' : 'var(--text)' }}>#{x.n}</span>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{x.rulings.length} rulings · {x.batches.length} batches</span>
              <span className="mono dim" style={{ display: 'block', fontSize: 11, marginTop: 5 }}>{x.root.slice(0, 10)}…</span>
              <span className="mono" style={{ display: 'block', fontSize: 11, color: 'var(--amber)', marginTop: 2 }}>{x.anchor?.slot ? `devnet slot ${x.anchor.slot.toLocaleString('en-US')}` : 'not anchored'}</span>
            </a>
          ))}
          {blocks.length === 0 && <p className="muted">The first block seals a minute into the run.</p>}
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          {STAGES.map(([name, what], i) => {
            const on = i === phase, done = i < phase
            return (
              <div key={name} className="card" style={{ borderColor: on ? 'var(--teal)' : 'var(--line)', background: on ? '#0E1A1F' : 'var(--panel)', minHeight: 170, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="row" style={{ gap: 8 }}><span className="mono" style={{ width: 24, height: 24, borderRadius: 7, border: `1px solid ${done || on ? 'var(--teal)' : '#2A3440'}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: done || on ? 'var(--teal)' : 'var(--dim)' }}>{i + 1}</span><b style={{ fontSize: 14 }}>{name}</b></span>
                <span className="mono" style={{ fontSize: 18, color: on ? 'var(--teal)' : done ? 'var(--text)' : 'var(--dim)' }}>{stageBig(i)}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{what}</span>
                {i === 4 && <span className="tag warn" style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>modeled</span>}
              </div>
            )
          })}
        </div>
        <p className="note" style={{ marginTop: 8 }}>{b.id} · opened {fmt(b.openedAt)} · run time {fmt(t)}</p>
      </section>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 14 }}>
        <section style={{ flex: '999 1 560px', minWidth: 0 }}>
          <h2>{b.id}</h2>
          <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>500 requests from {appsSorted.length} apps collapse to {b.unique} questions, packed into {b.prompts} prompts. Each packed prompt is put to one jury; every app that asked gets the answer.</p>
          <div className="tbl"><table>
            <thead><tr><th>Packed prompt</th><th>Lead question</th><th>Asked</th><th>Answer</th></tr></thead>
            <tbody>{b.packed.map(p => (
              <tr key={p.prompt}>
                <td className="mono">{p.prompt} of {b.prompts}</td>
                <td><a href={`/docket/?r=${p.ruling}`}>{p.question}</a></td>
                <td className="mono">×{p.asked}</td>
                <td className="mono" style={{ color: phase >= 7 ? answerColor(p.answer) : 'var(--dim)' }}>{phase >= 7 ? p.answer : 'pending'}</td>
              </tr>
            ))}</tbody>
          </table></div>
          <p className="note" style={{ marginTop: 8 }}>Proof hashes: {b.proofs.join(' · ')}. In v{run.version} the proofs are modeled: the hashes stand in for proofs of inference, which exist today for one open model.</p>
        </section>
        <aside style={{ flex: '1 1 320px' }} className="card">
          <p className="eb">Who asked, this batch</p>
          {appsSorted.map(([id, n]) => {
            const app = run.apps.find(a => a.id === id)
            const c = TEMPLATE[app?.template ?? '']?.color ?? '#A9B4C0'
            return (
              <div key={id} className="row" style={{ gap: 10, padding: '4px 0', fontSize: 13, flexWrap: 'nowrap' }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: c, flex: 'none' }} />
                <span style={{ flex: 1 }}>{appName(id)}</span>
                <span style={{ width: 90, height: 6, borderRadius: 3, background: 'var(--line)', overflow: 'hidden' }}><span style={{ display: 'block', height: 6, width: `${Math.round((n / max) * 100)}%`, background: c }} /></span>
                <span className="mono muted" style={{ width: 34, textAlign: 'right', fontSize: 12 }}>{n}</span>
              </div>
            )
          })}
          <p className="note" style={{ marginTop: 12 }}>A jury and a proof cost the same whether they answer one question or hundreds, so batching spreads the cost, and a question asked by many apps is answered once.</p>
        </aside>
      </div>
    </div>
  )
}
