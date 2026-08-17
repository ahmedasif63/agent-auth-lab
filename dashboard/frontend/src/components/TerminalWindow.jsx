// A calm, light terminal shell in this dashboard's own visual language
// (rounded corners, soft shadow, hairline border) rather than a generic
// green-on-black hacker terminal. Authentic macOS traffic-light dots, but
// otherwise reads like the rest of this app. `compact` trims the chrome
// and body padding/text for use inside smaller cards.
export default function TerminalWindow({ children, className, compact = false }) {
  return (
    <div
      className={`overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-hairline)] bg-white shadow-[var(--shadow-control)] ${className ?? ''}`}
    >
      <div
        className={`flex items-center gap-1.5 border-b border-[var(--color-hairline)] bg-black/[0.02] ${
          compact ? 'px-3 py-1.5' : 'px-4 py-2.5'
        }`}
      >
        <span className={`rounded-full bg-[#ff5f57] ${compact ? 'h-2 w-2' : 'h-2.5 w-2.5'}`} />
        <span className={`rounded-full bg-[#febc2e] ${compact ? 'h-2 w-2' : 'h-2.5 w-2.5'}`} />
        <span className={`rounded-full bg-[#28c840] ${compact ? 'h-2 w-2' : 'h-2.5 w-2.5'}`} />
      </div>
      <div
        className={`font-mono leading-relaxed text-[var(--color-ink)] ${
          compact ? 'px-3.5 py-3 text-[11px]' : 'px-5 py-4 text-[12.5px]'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
