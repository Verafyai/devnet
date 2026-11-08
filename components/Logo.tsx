/** The Verafy Devnet mark: apps on the outer ring, a mesh of harnesses, Solana at the center. */
export function Mark({ size = 32 }: { size?: number }) {
  const mesh = Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2 - Math.PI / 2; return [32 + Math.cos(a) * 15, 32 + Math.sin(a) * 15] })
  const outer = Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2 - Math.PI / 2 + 0.31; return [32 + Math.cos(a) * 27, 32 + Math.sin(a) * 27] })
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Verafy Devnet">
      <circle cx="32" cy="32" r="27" fill="none" stroke="#5FE0C8" strokeOpacity=".28" strokeWidth="1.2" />
      {mesh.map(([x, y], i) => <line key={`s${i}`} x1="32" y1="32" x2={x} y2={y} stroke="#F0B45A" strokeOpacity=".55" strokeWidth="1.2" />)}
      {mesh.map(([x, y], i) => { const [x2, y2] = mesh[(i + 1) % 6]; return <line key={`m${i}`} x1={x} y1={y} x2={x2} y2={y2} stroke="#5FE0C8" strokeWidth="1.6" /> })}
      {outer.map(([x, y], i) => <rect key={`o${i}`} x={x - 2} y={y - 2} width="4" height="4" rx="1" fill="#7CC4FA" />)}
      {mesh.map(([x, y], i) => <circle key={`n${i}`} cx={x} cy={y} r="3.6" fill="#05070A" stroke="#5FE0C8" strokeWidth="1.8" />)}
      <circle cx="32" cy="32" r="5.5" fill="#F0B45A" />
    </svg>
  )
}
