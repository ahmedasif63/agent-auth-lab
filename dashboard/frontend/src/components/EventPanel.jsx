import EventCard from './EventCard'
import { getEventConfig } from '../config/eventTypes'

// Shared rendering for the two Live-view columns. Which events land in which
// panel is decided by each event type's `panel` field in
// src/config/eventTypes.js — not hardcoded here — so a new event type only
// ever needs a config entry, never a change to AgentPanel or ToolPanel.
export default function EventPanel({ title, icon: Icon, panelKey, events, emptyHint }) {
  const panelEvents = events.filter((event) => getEventConfig(event.type).panel === panelKey)

  return (
    <div className="flex-1 min-w-0 rounded-[var(--radius-panel)] bg-white/70 backdrop-blur-xl shadow-[var(--shadow-panel)] flex flex-col">
      <div className="flex items-center gap-2 px-5 pt-5 pb-3">
        <Icon size={16} strokeWidth={2} className="text-[var(--color-ink-muted)]" />
        <h3 className="text-[13px] font-semibold text-[var(--color-ink)]">{title}</h3>
      </div>

      {/* Grows with its content instead of scrolling internally — the page
          itself scrolls (see LiveView's outer container) so a long run's
          full history stays readable top to bottom, not boxed into a
          fixed-height panel. */}
      <div className="px-5 pb-5 flex flex-col gap-2.5">
        {panelEvents.length === 0 && (
          <p className="text-[13px] text-[var(--color-ink-muted)] py-2">{emptyHint}</p>
        )}
        {panelEvents.map((event, idx) => (
          <EventCard key={`${event.timestamp}-${event.type}-${idx}`} event={event} />
        ))}
      </div>
    </div>
  )
}
