'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { run, FAMILY_COLOR, TEMPLATE, answerColor, explorer, appName, type Ruling } from '@/lib/run'
import { useClock } from '@/lib/clock'
import { fmt } from './NetworkMap'

const TABS = ['Opinion', 'Votes', 'Evidence', 'Precedent', 'On chain'] as const
type Filter = 'all' | 'refused' | 'dissent' | string

export default function Docket() {
  const params = useSearchParams()
  const { t } = useClock()
  const [sel, setSel] = useState<string | null>(params.get('r'))
  const [tab, setTab] = useState<(typeof TABS)[number]>('Opinion')
  const [filter, setFilter] = useState<Filter>('all')
  const [all, setAll] = useState(false)
  const juror = params.get('j')
  useEffect(() => { const r = params.get('r'); if (r) { setSel(r); setAll(true) } }, [params])

  const sealed = run.rulings.filter(r => all || r.sealedAt <= t)
  const list = sealed
    .filter(r => !juror || r.votes.some(v => v.harness === juror))
    .filter(r => filter === 'all' ? true : filter === 'refused' ? /^(REJECT|REFUND|VIOLATED|NOT_CLEARED|NOT_MET)$/.test(r.answer) : filter === 'dissent' ? r.dissent.length > 0 : r.template === filter)
    .sort((a, b) => b.sealedAt - a.sealedAt)
  const r = run.rulings.find(x => x.id === sel) ?? list[0] ?? null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', minHeight: 'calc(100vh - 110px)' }}>
      <aside aria-label="Rulings" style={{ flex: '1 1 360px', maxWidth: 460, borderRight: '1px solid #141B23', background: '#06090D' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #141B23' }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: 22, margin: 0 }}>Docket</h1>
            <span className="row" style={{ gap: 6, fontSize: 13, color: 'var(--teal)' }}><span className="dot" />{all ? `all ${run.rulings.length} rulings` : `${sealed.length} sealed so far, live`}</span>
          </div>
          {juror && <p style={{ margin: '8px 0 0', fontSize: 13 }} className="muted">Cases <b style={{ color: 'var(--text)' }}>{juror}</b> sat on. <a href="/docket/">Show everyone</a></p>}
          <div className="row" style={{ gap: 6, marginTop: 10 }}>
            {(['all', 'refused', 'dissent'] as const).map(f => <Chip key={f} on={filter === f} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : f === 'refused' ? 'Refused' : 'With dissent'}</Chip>)}
            {Object.entries(TEMPLATE).filter(([k]) => run.rulings.some(x => x.template === k)).map(([k, v]) => <Chip key={k} on={filter === k} onClick={() => setFilter(k)}>{v.name}</Chip>)}
          </div>
          <label className="row" style={{ gap: 8, marginTop: 10, fontSize: 13 }} ><input type="checkbox" checked={all} onChange={e => setAll(e.target.checked)} />Show the whole run, not only what is sealed so far</label>
        </div>
        {list.map(x => (
          <button key={x.id} type="button" onClick={() => { setSel(x.id); setTab('Opinion') }} aria-current={r?.id === x.id} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', border: 0, borderBottom: '1px solid var(--line2)', background: r?.id === x.id ? '#0E1A1F' : 'transparent', cursor: 'pointer' }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span className="mono" style={{ fontSize: 11, color: TEMPLATE[x.template]?.color }}>{TEMPLATE[x.template]?.name.toUpperCase()}</span>
              <span className="mono dim" style={{ fontSize: 11 }}>{fmt(x.sealedAt)} · block {x.block}</span>
            </span>
            <span style={{ display: 'block', marginTop: 4, fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>{x.title}</span>
            <span className="row" style={{ gap: 10, marginTop: 5, fontSize: 12 }}>
              <span className="mono" style={{ color: answerColor(x.answer) }}>{x.answer}</span>
              <span className="muted">{x.votes.filter(v => v.answer === x.answer).length} of {x.votes.length}</span>
              {x.dissent.length > 0 && <span className="tag warn">dissent</span>}
            </span>
          </button>
        ))}
        {list.length === 0 && <p className="muted" style={{ padding: 16 }}>Nothing sealed yet in this loop. Rulings appear here the moment they are sealed.</p>}
      </aside>

      <main style={{ flex: '999 1 600px', minWidth: 0, padding: '22px 26px' }}>
        {r ? <Detail r={r} tab={tab} setTab={setTab} /> : <p className="muted">Pick a ruling.</p>}
      </main>
    </div>
  )
}

function Detail({ r, tab, setTab }: { r: Ruling; tab: (typeof TABS)[number]; setTab: (t: (typeof TABS)[number]) => void }) {
  const block = run.blocks.find(b => b.n === r.block)
  const precedent = run.rulings.filter(x => x.template === r.template && x.id !== r.id).slice(0, 6)
  const majority = r.votes.filter(v => v.answer === r.answer)
  return (
    <div style={{ maxWidth: 980 }}>
      <div className="row" style={{ gap: 10 }}>
        <span className="mono" style={{ fontSize: 12, color: TEMPLATE[r.template]?.color }}>{TEMPLATE[r.template]?.name.toUpperCase()} · {appName(r.app)}</span>
        <span className="mono dim" style={{ fontSize: 12 }}>case {r.id} · seed {r.seed}</span>
      </div>
      <h2 style={{ fontSize: 26, margin: '8px 0 6px', lineHeight: 1.2 }}>{r.title}</h2>
      <p className="muted" style={{ margin: 0, fontSize: 15 }}>{r.summary}</p>
      <div className="row" style={{ marginTop: 12 }}>
        <span className="mono" style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid ${answerColor(r.answer)}`, color: answerColor(r.answer), fontWeight: 600 }}>{r.answer}</span>
        <span className="muted" style={{ fontSize: 14 }}>{majority.length} of {r.votes.length} jurors · agreement {r.agreement.toFixed(2)} over a {r.bar} bar{r.dissent.length ? ` · ${r.dissent.length} dissent` : ''}</span>
        {r.cites.length > 0 && <span className="muted" style={{ fontSize: 14 }}>Cited: {r.cites.join(', ')}</span>}
      </div>
      {r.outcome && <p style={{ margin: '10px 0 0', fontSize: 14 }}><span className="dim">Outcome: </span>{r.outcome}</p>}

      <div role="tablist" aria-label="Ruling detail" className="row" style={{ gap: 2, borderBottom: '1px solid var(--line)', marginTop: 18 }}>
        {TABS.map(x => <button key={x} type="button" role="tab" aria-selected={tab === x} onClick={() => setTab(x)} style={{ padding: '10px 14px', border: 0, borderBottom: `2px solid ${tab === x ? 'var(--teal)' : 'transparent'}`, background: 'none', color: tab === x ? 'var(--text)' : 'var(--muted)', cursor: 'pointer' }}>{x}</button>)}
      </div>

      <div style={{ marginTop: 16 }}>
        {tab === 'Opinion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card"><p className="eb">The question</p><p style={{ margin: 0 }}>{r.question}</p><p className="note" style={{ margin: '8px 0 0' }}>Allowed answers: {r.options.join(', ')}</p></div>
            <div className="card" style={{ borderColor: answerColor(r.answer) }}><p className="eb" style={{ color: answerColor(r.answer) }}>Opinion of the majority</p><p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>{r.opinion}</p></div>
            {r.dissent.map(d => <div key={d.harness} className="card" style={{ borderStyle: 'dashed' }}><p className="eb">Dissent, {d.harness} ({d.label}) · {d.answer}</p><p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: '#C6CFD8' }}>{d.reasoning}</p></div>)}
            <p className="note">Jurors in v{run.version} are scripted: the reasoning above was written for this scenario. Everything around it (the case, the draw, signed commits and reveals, sealing, payouts) is the production harness code. <a href="/about/">More</a></p>
          </div>
        )}
        {tab === 'Votes' && (
          <div className="tbl"><table>
            <thead><tr><th>Juror</th><th>Model seat</th><th>Vote</th><th style={{ minWidth: 260 }}>Confidence and reasoning</th><th>Commit · reveal sig</th></tr></thead>
            <tbody>{r.votes.map(v => (
              <tr key={v.harness}>
                <td><span className="row" style={{ gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: FAMILY_COLOR[v.family] }} /><a href={`/docket/?j=${v.harness}`}>{v.harness}</a></span></td>
                <td className="mono dim" style={{ fontSize: 12 }}>{v.model}</td>
                <td className="mono" style={{ color: answerColor(v.answer), fontWeight: 600 }}>{v.answer}</td>
                <td>
                  <span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}><span style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--line)', overflow: 'hidden' }}><span style={{ display: 'block', height: 6, width: `${Math.round(v.confidence * 100)}%`, background: answerColor(v.answer) }} /></span><span className="mono" style={{ fontSize: 12 }}>{v.confidence.toFixed(2)}</span></span>
                  <span style={{ display: 'block', marginTop: 6, color: '#C6CFD8' }}>{v.reasoning}</span>
                </td>
                <td className="mono dim" style={{ fontSize: 11 }}>{v.commitment}…<br />{v.signature}…</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
        {tab === 'Evidence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {r.context.map(c => (
              <details key={c.id} className="card" style={{ padding: '10px 14px', borderColor: c.untrusted ? '#F28B82' : 'var(--line)', borderStyle: c.untrusted ? 'dashed' : 'solid' }}>
                <summary style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 10 }}><span>{c.id} · {c.label}</span><span className="mono dim" style={{ fontSize: 12 }}>{c.sha256}…</span></summary>
                <pre style={{ marginTop: 10 }}>{c.excerpt || '(pinned by hash)'}</pre>
              </details>
            ))}
            <details className="card" style={{ padding: '10px 14px' }}><summary style={{ cursor: 'pointer' }}>The jury's instructions</summary><pre style={{ marginTop: 10 }}>{r.instructions}</pre></details>
          </div>
        )}
        {tab === 'Precedent' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>Other rulings under the same template in this run.</p>
            {precedent.map(p => (
              <a key={p.id} href={`/docket/?r=${p.id}`} className="card" style={{ color: 'var(--text)' }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><b style={{ fontSize: 14 }}>{p.title}</b><span className="mono" style={{ color: answerColor(p.answer), fontSize: 13 }}>{p.answer}</span></span>
                <span style={{ display: 'block', marginTop: 6, fontSize: 13, color: 'var(--muted)' }}>{p.opinion}</span>
              </a>
            ))}
          </div>
        )}
        {tab === 'On chain' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 760 }}>
            <Line k="Contract hash (ASC)" v={`${r.ascHash.slice(0, 24)}…`} />
            <Line k="Sealed in block" v={block ? `#${block.n}, root ${block.root.slice(0, 16)}…` : 'not yet'} />
            {block?.anchor ? <Line k="Block anchored on Solana devnet" v={`slot ${block.anchor.slot}`} href={explorer(block.anchor.signature)} /> : <Line k="Block anchored on Solana devnet" v="not in this recording" />}
            {run.programs.map(p => <Line key={p.id} k={p.name} v={`${p.id.slice(0, 6)}…${p.id.slice(-4)}`} href={`https://explorer.solana.com/address/${p.id}?cluster=devnet`} />)}
            <p className="note">The block's Memo transaction carries its root and the previous root. Recompute it from <a href="/run.json">run.json</a> with <code className="mono">npm run verify</code>.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Line({ k, v, href }: { k: string; v: string; href?: string }) {
  return <div className="card row" style={{ justifyContent: 'space-between', padding: '11px 14px' }}><span className="muted">{k}</span>{href ? <a href={href} className="mono" style={{ fontSize: 13 }}>{v}</a> : <span className="mono" style={{ fontSize: 13 }}>{v}</span>}</div>
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={on} onClick={onClick} style={{ padding: '5px 10px', borderRadius: 999, border: `1px solid ${on ? 'var(--teal)' : '#2A3440'}`, background: on ? '#0E1A1F' : 'none', color: on ? 'var(--text)' : 'var(--muted)', fontSize: 12, cursor: 'pointer' }}>{children}</button>
}
