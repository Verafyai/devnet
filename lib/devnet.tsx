'use client'
import { useEffect, useState } from 'react'
import { run } from './run'

const RPC = 'https://api.devnet.solana.com'
const call = async (method: string, params: unknown[] = []) => {
  const r = await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) })
  const j = await r.json()
  if (j.error) throw new Error(j.error.message)
  return j.result
}

/** Live devnet status, read in the browser from the public devnet RPC. */
export function useDevnet() {
  const [slot, setSlot] = useState<number | null>(null)
  const [programs, setPrograms] = useState<Record<string, boolean>>({})
  const [error, setError] = useState(false)
  useEffect(() => {
    let alive = true
    const poll = async () => {
      try { const s = await call('getSlot', [{ commitment: 'confirmed' }]); if (alive) { setSlot(s); setError(false) } } catch { if (alive) setError(true) }
    }
    const progs = async () => {
      try {
        const res = await call('getMultipleAccounts', [run.programs.map(p => p.id), { encoding: 'base64', dataSlice: { offset: 0, length: 0 } }])
        if (alive) setPrograms(Object.fromEntries(run.programs.map((p, i) => [p.id, Boolean(res.value[i]?.executable)])))
      } catch {}
    }
    poll(); progs()
    const id = setInterval(poll, 4000)
    return () => { alive = false; clearInterval(id) }
  }, [])
  return { slot, programs, error }
}
