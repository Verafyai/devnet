'use client'
import { useMemo, useState } from 'react'
import { run, FAMILY_COLOR, TEMPLATE, answerColor, explorer, appName, type Event } from '@/lib/run'
import { useClock, SpeedControl } from '@/lib/clock'

const W = 1000, H = 720, CX = 500, CY = 360
const FLY = 9 // seconds a moving request stays on screen at 1x

type P = { x: number; y: number }
const ring = (n: number, i: number, rx: number, ry: number, off = -Math.PI / 2): P => {
  const a = (i / n) * Math.PI * 2 + off
  return { x: CX + Math.cos(a) * rx, y: CY + Math.sin(a) * ry }
}

export default function NetworkMap() {
  const { t } = useClock()
  const [hover, setHover] = useState<string | null>(null)
  const geo = useMemo(() => {
    const harness = Object.fromEntries(run.harnesses.map((h, i) => [h.id, ring(run.harnesses.length, i, 205, 150)]))
    const agents = Object.fromEntries(run.agents.map((a, i) => [a, ring(run.agents.length, i, 330, 232, -Math.PI / 2 + 0.05)]))
    const apps = Object.fromEntries(run.apps.map((a, i) => [a.id, ring(run.apps.length, i, 455, 318, -Math.PI / 2 + 0.31)]))
    return { harness, agents, apps }
  }, [])
  const pos = (name?: string): P => {
    if (!name || name === 'escrow' || name === 'treasury') return { x: CX, y: CY }
    if (geo.apps[name]) return geo.apps[name]
    if (geo.agents[name]) return geo.agents[name]
    if (geo.harness[name]) return geo.harness[name]
    let h = 0
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
    return geo.agents[run.agents[h % run.agents.length]]
  }

  const recent = run.events.filter(e => e.t <= t && e.t > t - FLY)
  const sealedSoFar = run.events.filter(e => e.t <= t && e.kind === 'sealed').length
  const blocksSoFar = run.blocks.filter(b => b.t <= t)
  const busy = new Set(recent.filter(e => ['draw', 'commit', 'reveal'].includes(e.kind)).flatMap(e => e.jurors ?? []))
  const feed = run.events.filter(e => e.t <= t).slice(-14).reverse()

  // Moving requests: one or more paths per event.
  const flights: { key: string; from: P; to: P; color: string; p: number; label?: string; href?: string }[] = []
  for (const e of recent) {
    const p = Math.min(1, (t - e.t) / (FLY * 0.7))
    const color = TEMPLATE[e.template ?? '']?.color ?? '#A9B4C0'
    const k = `${e.t}-${e.kind}-${e.text.slice(0, 20)}`
    if (e.kind === 'case') for (const j of run.rulings.find(r => r.id === e.ruling)?.votes.map(v => v.harness) ?? []) flights.push({ key: k + j, from: pos(e.app), to: pos(j), color: '#5FE0C8', p })
    else if (e.kind === 'sealed') {
      const r = run.rulings.find(x => x.id === e.ruling)
      for (const v of r?.votes ?? []) flights.push({ key: k + v.harness, from: pos(v.harness), to: { x: CX, y: CY }, color: '#F0B45A', p })
      flights.push({ key: k + 'back', from: { x: CX, y: CY }, to: pos(e.app), color: answerColor(e.answer ?? ''), p, label: `${r?.title.slice(0, 34)}${(r?.title.length ?? 0) > 34 ? '…' : ''}: ${e.answer}`, href: `/docket/?r=${e.ruling}` })
    } else if (['signed', 'disputed', 'reported'].includes(e.kind)) flights.push({ key: k, from: pos(e.from), to: pos(e.to), color: e.kind === 'signed' ? color : '#F28B82', p })
    else if (['funded', 'bonded', 'opened', 'proposal', 'applied', 'submitted'].includes(e.kind)) flights.push({ key: k, from: pos(e.from), to: pos(e.to), color, p })
    else if (['paid', 'slashed', 'admitted', 'settled'].includes(e.kind)) flights.push({ key: k, from: { x: CX, y: CY }, to: pos(e.to), color: '#F0B45A', p })
    else if (e.kind === 'batch-closed') for (const a of run.apps) flights.push({ key: k + a.id, from: pos(a.id), to: { x: CX, y: CY }, color: '#7CC4FA', p })
  }
  const blockPulse = recent.some(e => e.kind === 'block' && t - e.t < 3)

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', minHeight: 'calc(100vh - 110px)' }}>
      <aside aria-label="Network" style={{ flex: '1 1 260px', maxWidth: 300, borderRight: '1px solid #141B23', padding: 16, background: '#06090D', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <p className="eb">This run, so far</p>
          <div className="grid g2">
            <Stat n={sealedSoFar} label="rulings sealed" color="#5FE0C8" />
            <Stat n={blocksSoFar.length} label="blocks" color="#F0B45A" />
            <Stat n={run.events.filter(e => e.t <= t && e.kind === 'signed').length} label="contracts signed" />
            <Stat n={run.events.filter(e => e.t <= t && e.kind === 'batch-closed').length * 500} label="app requests batched" />
          </div>
        </div>
        <div>
          <p className="eb">Harnesses (jurors)</p>
          {run.harnesses.map(h => (
            <a key={h.id} href={`/docket/?j=${h.id}`} onMouseEnter={() => setHover(h.id)} onMouseLeave={() => setHover(null)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 8, color: 'var(--text)', background: busy.has(h.id) ? '#0E1A1F' : undefined }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: FAMILY_COLOR[h.family] }} />
              <span style={{ flex: 1, fontSize: 13 }}>{h.id}</span>
              {busy.has(h.id) && <span className="tag ok">on a jury</span>}
              <span className="mono dim" style={{ fontSize: 12 }}>{h.cases}</span>
            </a>
          ))}
        </div>
        <div>
          <p className="eb">Templates</p>
          {Object.entries(TEMPLATE).filter(([k]) => k !== 'treasury').map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', fontSize: 13 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: v.color }} />{v.name}
            </div>
          ))}
        </div>
      </aside>

      <main style={{ flex: '999 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="row" style={{ padding: '10px 16px', borderBottom: '1px solid #141B23' }}>
          <SpeedControl />
          <span className="muted" style={{ fontSize: 13 }}>Run time {fmt(t)} of {fmt(run.duration)}, looping</span>
          <div className="row" style={{ marginLeft: 'auto', gap: 6 }}>
            <span className="mono dim" style={{ fontSize: 11 }}>BLOCKS</span>
            {blocksSoFar.slice(-5).map((b, i, arr) => (
              <a key={b.n} href={b.anchor ? explorer(b.anchor.signature) : '/about/'} className="mono" title={b.anchor ? `Anchored on devnet in slot ${b.anchor.slot}` : 'Not anchored in this recording'} style={{ fontSize: 11, padding: '3px 7px', borderRadius: 6, border: `1px solid ${i === arr.length - 1 && blockPulse ? '#5FE0C8' : '#2A3440'}`, color: i === arr.length - 1 ? '#5FE0C8' : '#C6CFD8' }}>
                #{b.n} · {b.rulings.length}r
              </a>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', flex: 1, background: 'radial-gradient(circle at 50% 50%, #0A1218 0%, #05070A 70%)' }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', maxHeight: 'calc(100vh - 170px)', display: 'block' }} role="img" aria-label="The Verafy devnet: apps on the outer ring, agents, harness jurors, and Solana devnet at the center">
            {run.apps.map(a => { const p = geo.apps[a.id]; return <line key={`la${a.id}`} x1={p.x} y1={p.y} x2={CX} y2={CY} stroke="#7CC4FA" strokeOpacity=".07" /> })}
            {run.harnesses.map(h => { const p = geo.harness[h.id]; return <line key={`lh${h.id}`} x1={p.x} y1={p.y} x2={CX} y2={CY} stroke="#F0B45A" strokeOpacity=".22" /> })}
            {run.harnesses.map((h, i) => { const p = geo.harness[h.id], q = geo.harness[run.harnesses[(i + 1) % run.harnesses.length].id]; return <line key={`lm${h.id}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#5FE0C8" strokeOpacity=".18" /> })}
            {flights.map(f => {
              const x = f.from.x + (f.to.x - f.from.x) * f.p, y = f.from.y + (f.to.y - f.from.y) * f.p
              return (
                <g key={f.key}>
                  <line x1={f.from.x} y1={f.from.y} x2={x} y2={y} stroke={f.color} strokeOpacity=".55" strokeWidth="1.4" />
                  <circle cx={x} cy={y} r="4" fill={f.color} />
                </g>
              )
            })}
            <circle cx={CX} cy={CY} r={blockPulse ? 64 : 58} fill="#120E06" stroke="#F0B45A" strokeWidth="1.6" />
            <text x={CX} y={CY - 8} textAnchor="middle" fill="#F0B45A" fontSize="11" className="mono" letterSpacing=".08em">SOLANA</text>
            <text x={CX} y={CY + 10} textAnchor="middle" fill="#E8EDF2" fontSize="15" fontWeight="600">devnet</text>
            <text x={CX} y={CY + 26} textAnchor="middle" fill="#A9B4C0" fontSize="10">{run.programs.length} Verafy programs</text>
            {run.agents.map(a => { const p = geo.agents[a]; const active = recent.some(e => e.from === a || e.to === a); return <rect key={a} x={p.x - 4.5} y={p.y - 4.5} width="9" height="9" rx="2" fill={active ? '#E8EDF2' : '#8B93FF'} opacity={active ? 1 : 0.65}><title>{a}</title></rect> })}
            {run.harnesses.map(h => {
              const p = geo.harness[h.id], on = busy.has(h.id) || hover === h.id
              return (
                <a key={h.id} href={`/docket/?j=${h.id}`}>
                  <circle cx={p.x} cy={p.y} r={on ? 21 : 18} fill="#0B1117" stroke={FAMILY_COLOR[h.family]} strokeWidth={on ? 3 : 2} />
                  <text x={p.x} y={p.y + 4} textAnchor="middle" fill={FAMILY_COLOR[h.family]} fontSize="10" className="mono">{h.family.slice(0, 2).toUpperCase()}</text>
                  <text x={p.x} y={p.y + 36} textAnchor="middle" fill="#A9B4C0" fontSize="11">{h.id}</text>
                </a>
              )
            })}
            {run.apps.map(a => {
              const p = geo.apps[a.id], c = TEMPLATE[a.template]?.color ?? '#A9B4C0', w = a.name.length * 6.6 + 22
              return (
                <a key={a.id} href="/pipeline/">
                  <rect x={p.x - w / 2} y={p.y - 13} width={w} height="26" rx="8" fill="#0B1117" stroke={c} />
                  <text x={p.x} y={p.y + 4} textAnchor="middle" fill="#E8EDF2" fontSize="11">{a.name}</text>
                </a>
              )
            })}
            {flights.filter(f => f.label && f.href).map(f => {
              const x = f.from.x + (f.to.x - f.from.x) * f.p, y = f.from.y + (f.to.y - f.from.y) * f.p
              const w = Math.min(320, f.label!.length * 6.3 + 18), left = x + w + 10 > W ? x - w - 10 : x + 10
              return (
                <a key={`lbl-${f.key}`} href={f.href}>
                  <rect x={left} y={y - 12} width={w} height="24" rx="12" fill="#080C10" stroke={f.color} />
                  <text x={left + 9} y={y + 4} fill="#E8EDF2" fontSize="11">{f.label}</text>
                </a>
              )
            })}
          </svg>
          <div className="row" style={{ position: 'absolute', left: 14, bottom: 12, gap: 14, fontSize: 12, color: 'var(--muted)', background: 'rgba(5,7,10,.85)', padding: '8px 12px', borderRadius: 10, border: '1px solid #141B23' }}>
            <span>▢ app</span><span style={{ color: '#8B93FF' }}>■ agent</span><span style={{ color: '#5FE0C8' }}>○ harness juror</span><span style={{ color: '#F0B45A' }}>● ruling to Solana</span>
          </div>
        </div>
      </main>

      <aside aria-label="Live feed" style={{ flex: '1 1 300px', maxWidth: 360, borderLeft: '1px solid #141B23', padding: 16, background: '#06090D', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p className="eb">Feed</p>
        {feed.map((e, i) => <FeedItem key={`${e.t}-${i}-${e.kind}`} e={e} />)}
      </aside>
    </div>
  )
}

function Stat({ n, label, color = '#E8EDF2' }: { n: number; label: string; color?: string }) {
  return <div className="card" style={{ padding: '10px 12px' }}><p className="mono" style={{ margin: 0, fontSize: 20, color }}>{n.toLocaleString('en-US')}</p><p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>{label}</p></div>
}

function FeedItem({ e }: { e: Event }) {
  const c = e.kind === 'sealed' ? answerColor(e.answer ?? '') : e.kind === 'block' ? '#F0B45A' : TEMPLATE[e.template ?? '']?.color ?? '#A9B4C0'
  const body = (
    <>
      <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><span className="mono" style={{ fontSize: 11, color: c }}>{e.kind.toUpperCase()}</span><span className="mono dim" style={{ fontSize: 11 }}>{fmt(e.t)}{e.app ? ` · ${appName(e.app)}` : ''}</span></span>
      <span style={{ display: 'block', fontSize: 13, lineHeight: 1.4, marginTop: 3 }}>{e.text}</span>
    </>
  )
  const style = { display: 'block', padding: '9px 11px', borderRadius: 10, background: 'var(--panel)', border: '1px solid var(--line)', color: 'var(--text)' }
  if (e.ruling) return <a href={`/docket/?r=${e.ruling}`} style={style}>{body}</a>
  if (e.batch) return <a href="/pipeline/" style={style}>{body}</a>
  return <div style={style}>{body}</div>
}

export const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
