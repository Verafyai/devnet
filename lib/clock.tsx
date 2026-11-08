'use client'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { run } from './run'

/** Where a first visit starts: just before the first disputes go to a jury. */
const START = Math.max(0, (run.events.find(e => e.kind === 'case')?.t ?? 0) - 20)

/** The replay clock: seconds into the recorded run, looping. Speed 0 pauses. */
type Clock = { t: number; speed: number; setSpeed: (s: number) => void; loop: number }
const Ctx = createContext<Clock>({ t: 0, speed: 1, setSpeed: () => {}, loop: 0 })

export function ClockProvider({ children }: { children: React.ReactNode }) {
  const [speed, setSpeedState] = useState(1)
  const [t, setT] = useState(START)
  const [loop, setLoop] = useState(0)
  const last = useRef<number | null>(null)
  const tRef = useRef(0)
  useEffect(() => {
    try { const s = Number(localStorage.getItem('verafy-devnet-speed')); if (s >= 0 && s <= 8) setSpeedState(s || 1) } catch {}
    tRef.current = START
    try { const saved = Number(sessionStorage.getItem('verafy-devnet-t')); if (saved > 0) tRef.current = saved } catch {}
    let raf = 0
    const tick = (now: number) => {
      if (last.current !== null) {
        let next = tRef.current + ((now - last.current) / 1000) * speedRef.current
        if (next >= run.duration) { next = 0; setLoop(l => l + 1) }
        tRef.current = next
        setT(next)
      }
      last.current = now
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const save = () => { try { sessionStorage.setItem('verafy-devnet-t', String(tRef.current)) } catch {} }
    window.addEventListener('pagehide', save)
    return () => { cancelAnimationFrame(raf); save(); window.removeEventListener('pagehide', save) }
  }, [])
  const speedRef = useRef(speed)
  speedRef.current = speed
  const setSpeed = (s: number) => { setSpeedState(s); try { localStorage.setItem('verafy-devnet-speed', String(s)) } catch {} }
  return <Ctx.Provider value={{ t, speed, setSpeed, loop }}>{children}</Ctx.Provider>
}
export const useClock = () => useContext(Ctx)

export function SpeedControl() {
  const { speed, setSpeed } = useClock()
  const opts: [string, number][] = [['0.25x', 0.25], ['1x', 1], ['4x', 4], ['Pause', 0]]
  return (
    <div className="seg" role="group" aria-label="Playback speed">
      {opts.map(([l, v]) => <button key={l} type="button" className={speed === v ? 'on' : undefined} aria-pressed={speed === v} onClick={() => setSpeed(v)}>{l}</button>)}
    </div>
  )
}
