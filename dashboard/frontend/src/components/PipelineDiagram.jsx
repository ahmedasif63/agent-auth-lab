import { useCallback, useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { pipelineSteps } from '../config/pipelineSteps'
import PipelineStep from './PipelineStep'
import PipelineLegend from './PipelineLegend'

const MOVE_MS = 600 // time the dot spends traveling between two steps
const DWELL_MS = 1500 // time the dot rests at a step once it arrives (spec: 1.2-1.8s)
const DOT_SIZE = 12

// Renders purely by mapping over pipelineSteps — adding, removing, or
// reordering a stage in the real pipeline means editing pipelineSteps.js
// alone. Nothing here assumes a step count, a fixed set of ids, or a fixed
// set of statuses (see getStatusMeta/getStepIcon fallbacks in PipelineStep).
export default function PipelineDiagram() {
  const [activeId, setActiveId] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [dotTop, setDotTop] = useState(0)
  const [dotVisible, setDotVisible] = useState(false)

  const containerRef = useRef(null)
  const tokenNodesRef = useRef(new Map())
  const timeoutsRef = useRef([])

  const registerTokenRef = useCallback((id, node) => {
    if (node) tokenNodesRef.current.set(id, node)
    else tokenNodesRef.current.delete(id)
  }, [])

  const clearScheduled = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }, [])

  useEffect(() => clearScheduled, [clearScheduled])

  function measurePositions() {
    const container = containerRef.current
    if (!container) return null

    const containerTop = container.getBoundingClientRect().top
    const positions = {}
    for (const step of pipelineSteps) {
      const node = tokenNodesRef.current.get(step.id)
      if (!node) return null
      const rect = node.getBoundingClientRect()
      positions[step.id] = rect.top - containerTop + rect.height / 2 - DOT_SIZE / 2
    }
    return positions
  }

  function handlePlay() {
    clearScheduled()
    if (pipelineSteps.length === 0) return

    const positions = measurePositions()
    if (!positions) return

    setIsPlaying(true)
    setDotVisible(true)

    let elapsed = 0
    pipelineSteps.forEach((step, idx) => {
      const fireAt = elapsed
      timeoutsRef.current.push(
        setTimeout(() => {
          setActiveId(step.id)
          setDotTop(positions[step.id])
        }, fireAt),
      )
      elapsed += (idx === 0 ? 0 : MOVE_MS) + DWELL_MS
    })

    timeoutsRef.current.push(
      setTimeout(() => {
        setIsPlaying(false)
        setDotVisible(false)
      }, elapsed),
    )
  }

  function handleSelect(id) {
    clearScheduled()
    setIsPlaying(false)
    setDotVisible(false)
    setActiveId((current) => (current === id ? null : id))
  }

  return (
    <div>
      <div className="mb-9 flex flex-wrap items-center justify-between gap-4">
        <PipelineLegend pipelineSteps={pipelineSteps} />

        <button
          type="button"
          onClick={handlePlay}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-4 py-2 text-[13px] font-medium text-white shadow-[var(--shadow-control)] transition-colors duration-150 hover:bg-[var(--color-accent-hover)] cursor-pointer"
        >
          <Play size={13} strokeWidth={2} fill="currentColor" />
          {isPlaying ? 'Playing…' : 'Play walkthrough'}
        </button>
      </div>

      <div ref={containerRef} className="relative mx-auto max-w-xl">
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute left-4 z-20 rounded-full bg-[var(--color-accent)] shadow-[0_0_0_4px_var(--color-accent-soft),0_0_14px_rgba(0,113,227,0.55)] transition-[top,opacity] duration-500 ease-in-out ${
            dotVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ top: dotTop, width: DOT_SIZE, height: DOT_SIZE }}
        />

        {pipelineSteps.map((step, idx) => {
          const isLast = idx === pipelineSteps.length - 1
          const nextStatus = isLast ? null : pipelineSteps[idx + 1].status
          const isActive = activeId === step.id
          const isDimmed = activeId !== null && !isActive

          return (
            <PipelineStep
              key={step.id}
              step={step}
              isLast={isLast}
              nextStatus={nextStatus}
              isActive={isActive}
              isDimmed={isDimmed}
              onSelect={handleSelect}
              tokenRef={(node) => registerTokenRef(step.id, node)}
            />
          )
        })}
      </div>
    </div>
  )
}
