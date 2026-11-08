#!/usr/bin/env node
/**
 * Verify a recorded Verafy devnet run, with no dependencies:
 *   1. recompute every block root from the rulings and batches it lists, and the chain of roots;
 *   2. for each anchored block, fetch its Memo transaction from Solana devnet and check that
 *      it carries exactly that root and the previous root.
 *
 *   node recorder/verify.mjs [data/run.json] [--rpc https://api.devnet.solana.com]
 */
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const args = process.argv.slice(2)
const file = args.find(x => !x.startsWith('--')) ?? 'data/run.json'
const rpcUrl = args.includes('--rpc') ? args[args.indexOf('--rpc') + 1] : 'https://api.devnet.solana.com'
const canonical = v => v === null || typeof v !== 'object' ? JSON.stringify(v) : Array.isArray(v) ? '[' + v.map(canonical).join(',') + ']' : '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}'
const sha256 = v => createHash('sha256').update(typeof v === 'string' ? v : canonical(v), 'utf8').digest('hex')
const run = JSON.parse(readFileSync(file, 'utf8'))
const rulings = new Map(run.rulings.map(r => [r.id, r]))
const batches = new Map(run.batches.map(b => [b.id, b]))
let prev = '0'.repeat(64), bad = 0
const fail = msg => { bad++; console.log(`FAIL  ${msg}`) }
for (const b of run.blocks) {
  const root = sha256({ n: b.n, prev, rulings: b.rulings.map(id => [rulings.get(id).ascHash, rulings.get(id).answer]), batches: b.batches.map(id => [id, batches.get(id).proofs]) })
  if (root !== b.root) fail(`block ${b.n}: root does not recompute`)
  if (b.prev !== prev.slice(0, 12)) fail(`block ${b.n}: previous root does not match`)
  prev = b.root
}
console.log(`${run.blocks.length} block roots recomputed${bad ? ' with failures' : ', chain intact'}`)
const call = async (method, params) => {
  for (let i = 0; ; i++) {
    const r = await fetch(rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) })
    if (r.status === 429 && i < 6) { await new Promise(s => setTimeout(s, 600 * 2 ** i)); continue }
    const j = await r.json()
    if (j.error && /too many/i.test(j.error.message) && i < 6) { await new Promise(s => setTimeout(s, 600 * 2 ** i)); continue }
    if (j.error) throw new Error(j.error.message)
    return j.result
  }
}
let anchored = 0
for (const b of run.blocks.filter(b => b.anchor)) {
  const tx = await call('getTransaction', [b.anchor.signature, { encoding: 'json', commitment: 'confirmed', maxSupportedTransactionVersion: 0 }])
  const logs = (tx?.meta?.logMessages ?? []).join('\n')
  if (!tx) fail(`block ${b.n}: anchor transaction not found on devnet`)
  else if (!logs.includes(b.root) || tx.meta.err) fail(`block ${b.n}: the devnet memo does not carry root ${b.root.slice(0, 12)}`)
  else anchored++
}
console.log(`${anchored} of ${run.blocks.filter(b => b.anchor).length} anchors found on devnet with the right root`)
process.exit(bad ? 1 : 0)
