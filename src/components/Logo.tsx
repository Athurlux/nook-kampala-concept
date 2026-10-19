/**
 * The Nook symbol, rebuilt as one SVG path from the supplied reference: a slab
 * with a roof rising to the right that rounds into the shoulder of a lowercase
 * "n", opened by an arch. Same geometry as public/favicon.svg. The wordmark is
 * live text, so it stays sharp and needs no raster.
 */
export const SYMBOL_PATH = 'M0 0 L196 82 C232 97 260 122 260 160 V300 H215 V147 A61.5 61.5 0 0 0 92 147 V300 H0 Z'

export function NookSymbol({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={(size * 260) / 300} height={size} viewBox="0 0 260 300" aria-hidden="true" focusable="false">
      <path d={SYMBOL_PATH} fill="currentColor" />
    </svg>
  )
}

export function Logo({ tone = 'olive' }: { tone?: 'olive' | 'cream' }) {
  return (
    <span className={`logo logo--${tone}`}>
      <NookSymbol size={30} className="logo__symbol" />
      <span className="logo__text">
        <span className="logo__word">nook</span>
        <span className="logo__place">Kampala</span>
      </span>
    </span>
  )
}
