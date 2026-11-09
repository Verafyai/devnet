import data from '@/data/run.json'

export type Vote = { harness: string; family: string; label: string; model: string; answer: string; confidence: number; reasoning: string; commitment: string; signature: string }
export type Ruling = {
  id: string; ascHash: string; template: string; app: string; title: string; summary: string; question: string; options: string[]
  answer: string; agreement: number; bar: number; passed: boolean; opinion: string; dissent: { harness: string; label: string; answer: string; reasoning: string }[]
  votes: Vote[]; seed: string; sealedAt: number; parties: string[]; outcome: string | null; cites: string[]; block?: number
  context: { id: string; label: string; sha256: string; excerpt: string; untrusted: boolean }[]; instructions: string
}
export type Batch = { id: string; openedAt: number; closedAt: number; requests: number; unique: number; prompts: number; apps: Record<string, number>; packed: { prompt: number; ruling: string; question: string; answer: string; asked: number }[]; proofs: string[]; proofsModeled: boolean; sealedAt: number }
export type Block = { n: number; t: number; prev: string; root: string; rulings: string[]; batches: string[]; anchor: { signature: string; slot: number | null; memo: string } | null }
export type Event = { t: number; kind: string; text: string; ruling?: string; template?: string; app?: string; from?: string; to?: string; jurors?: string[]; batch?: string; block?: number; answer?: string }
export type Run = {
  kind: string; version: string; recordedAt: string; harnessCommit: string | null; duration: number; cluster: string
  programs: { name: string; id: string }[]; devnetChecks: { passed: number; total: number; date: string }; jurorsScripted: boolean; proofsModeled: boolean
  families: { family: string; model: string; label: string }[]; harnesses: { id: string; family: string; cases: number }[]
  apps: { id: string; name: string; template: string }[]; agents: string[]; events: Event[]; rulings: Ruling[]; batches: Batch[]; blocks: Block[]
}

export const run = data as unknown as Run

export const FAMILY_COLOR: Record<string, string> = { deepseek: '#5FE0C8', qwen: '#8B93FF', llama: '#F0B45A', mistral: '#F28B82', gemma: '#7CC4FA' }
export const TEMPLATE: Record<string, { name: string; color: string; asc?: string }> = {
  'agentic-contract': { name: 'Agentic Contract', color: '#8B93FF', asc: 'agentic-contract' },
  'agent-bond': { name: 'Agent Bond', color: '#F28B82', asc: 'agent-bond' },
  'super-grant': { name: 'Super Grant', color: '#5FE0C8', asc: 'super-grant' },
  hackathon: { name: 'Hackathon Grant', color: '#7CC4FA', asc: 'hackathon' },
  'dao-constitution': { name: 'DAO Constitution', color: '#C7A6FF', asc: 'dao-constitution' },
  treasury: { name: 'Treasury', color: '#F0B45A', asc: 'treasury' },
  'verafy-certification': { name: 'Verafy Certification', color: '#9BE38A', asc: 'verafy-certification' },
  facts: { name: 'Fact check', color: '#A9B4C0' },
}
export const answerColor = (a: string) => (/^(REJECT|REFUND|VIOLATED|NOT_CLEARED|NOT_MET|NO)$/.test(a) ? '#F28B82' : /^(PARTIAL)$/.test(a) || /^[0-5]$/.test(a) ? '#F0B45A' : '#5FE0C8')
export const explorer = (sig: string) => `https://explorer.solana.com/tx/${sig}?cluster=devnet`
export const explorerAddr = (a: string) => `https://explorer.solana.com/address/${a}?cluster=devnet`
export const rulingById = (id: string) => run.rulings.find(r => r.id === id)
export const appName = (id: string) => run.apps.find(a => a.id === id)?.name ?? id
