import { Brain } from 'lucide-react'
import EventPanel from './EventPanel'

export default function AgentPanel({ events }) {
  return (
    <EventPanel
      title="Agent"
      icon={Brain}
      panelKey="agent"
      events={events}
      emptyHint="Nothing from the agent yet."
    />
  )
}
