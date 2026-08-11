import iconAccent from '../assets/icon-accent.svg'
import ViewSwitcher from './ViewSwitcher'

export default function Header({ view, onChangeView }) {
  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-[var(--color-hairline)] bg-white/60 backdrop-blur-xl">
      <div className="flex items-center gap-2.5">
        <img src={iconAccent} alt="" width={26} height={26} />
        <div className="flex items-center gap-2">
          <h1 className="text-[17px] font-semibold tracking-tight text-[var(--color-ink)]">
            Agent Auth Lab
          </h1>
          <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11px] font-medium text-[var(--color-ink-muted)]">
            Stage 0
          </span>
        </div>
      </div>

      <ViewSwitcher view={view} onChange={onChangeView} />
    </header>
  )
}
