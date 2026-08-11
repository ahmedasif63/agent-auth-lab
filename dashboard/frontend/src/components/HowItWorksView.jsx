import PipelineDiagram from './PipelineDiagram'

export default function HowItWorksView() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-[26px] font-semibold text-[var(--color-ink)]">How this works</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-ink-muted)]">
          When you ask the agent to do something, your request travels through a few steps
          before anything actually happens. Here's that journey, step by step, including
          where things can currently go wrong.
        </p>

        <div className="mt-10">
          <PipelineDiagram />
        </div>
      </div>
    </div>
  )
}
