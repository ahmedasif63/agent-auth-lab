import { Server } from 'lucide-react'
import EventPanel from './EventPanel'

export default function ToolPanel({ events }) {
  return (
    <EventPanel
      title="Tool Server"
      icon={Server}
      panelKey="tool_server"
      events={events}
      emptyHint="Nothing from the tool server yet."
    />
  )
}
