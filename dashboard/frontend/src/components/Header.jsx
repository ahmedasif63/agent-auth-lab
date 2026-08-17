import iconAccent from '../assets/icon-accent.svg'
import ViewSwitcher from './ViewSwitcher'
import StageSwitcher from './StageSwitcher'

export default function Header({ view, onChangeView, stage, onChangeStage }) {
  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-[var(--color-hairline)] bg-white/60 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <img src={iconAccent} alt="" width={26} height={26} />
        <h1 className="text-[17px] font-semibold tracking-tight text-[var(--color-ink)]">
          Agent Auth Lab
        </h1>
        <StageSwitcher stage={stage} onChange={onChangeStage} />
      </div>

      <ViewSwitcher view={view} onChange={onChangeView} />
    </header>
  )
}
