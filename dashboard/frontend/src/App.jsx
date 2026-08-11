import { useState } from 'react'
import Header from './components/Header'
import LiveView from './components/LiveView'
import HowItWorksView from './components/HowItWorksView'

export default function App() {
  const [view, setView] = useState('live')

  return (
    <div className="h-screen flex flex-col bg-[var(--color-canvas)]">
      <Header view={view} onChangeView={setView} />
      <main className="flex-1 min-h-0">
        {view === 'live' ? <LiveView /> : <HowItWorksView />}
      </main>
    </div>
  )
}
