import { Suspense } from 'react'
import type { Metadata } from 'next'
import Docket from '@/components/Docket'

export const metadata: Metadata = { title: 'Docket', description: 'Every ruling on the Verafy devnet with its reasoning, each juror’s vote and confidence, the evidence, precedent and the devnet anchor.' }
export default function Page() {
  return <Suspense fallback={null}><Docket /></Suspense>
}
