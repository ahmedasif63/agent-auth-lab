import { useScrollReveal } from '../hooks/useScrollReveal'

// Fades and slides a block into place the first time it scrolls into view.
// Used to break the page into distinct moments instead of everything being
// static and identical whether the reader scrolls quickly or slowly.
// `delay` (ms) staggers multiple Reveals within the same section so they
// don't all land in the same instant.
export default function Reveal({ children, className, delay = 0, as: Tag = 'div' }) {
  const [ref, visible] = useScrollReveal()

  return (
    <Tag
      ref={ref}
      className={`reveal-on-scroll ${visible ? 'is-visible' : ''} ${className ?? ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
