import { useEffect, useRef, useState } from 'react'

// Reveals `text` one character at a time, like someone actually typing it.
// onDone fires once, when the last character lands. Mirrors the mechanics
// of Magic UI's TypingAnimation (character interval via setInterval) without
// pulling in an animation library for one effect.
export function useTypedText(text, { speedMs = 28, startDelayMs = 0, onDone } = {}) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    if (!text) return undefined // nothing to type yet — don't fire onDone for an empty string

    let i = 0
    let intervalId

    const startId = setTimeout(() => {
      intervalId = setInterval(() => {
        i += 1
        setDisplayed(text.slice(0, i))
        if (i >= text.length) {
          clearInterval(intervalId)
          setDone(true)
          onDoneRef.current?.()
        }
      }, speedMs)
    }, startDelayMs)

    return () => {
      clearTimeout(startId)
      clearInterval(intervalId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speedMs, startDelayMs])

  return { displayed, done }
}
