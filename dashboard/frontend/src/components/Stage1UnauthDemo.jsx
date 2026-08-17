import { useState } from 'react'
import { ShieldAlert, Loader2 } from 'lucide-react'
import { testUnauthenticatedConnection } from '../api/client'
import TerminalWindow from './TerminalWindow'
import { useTypedText } from '../hooks/useTypedText'
import { CARD_HEIGHT_CLASS } from './Stage1RotationPanel'

// Keeps the reveal from feeling instant even when the real request finishes
// in under 100ms, so the moment has a beat. This only paces WHEN the
// already-real result is shown, never what it says.
const MIN_WAIT_MS = 550

// The highest-value proof point: types the real command, runs it for real
// against the real running stage1-server, and streams back the real
// result. Never hardcodes or fakes output text, in the typed line or after.
// `command` comes from the backend (GET /stage1/status's demo_command) so
// the typed line can never drift from what testUnauthenticatedConnection()
// actually sends.
//
// `fixedHeight` is opt-in: LiveView pairs this card with
// Stage1RotationPanel side by side and needs both to match height exactly.
// Stage1View shows it alone in a full-width prose column, where a tall
// fixed height would just be empty space before the demo is run — there
// it grows naturally with its content instead.
export default function Stage1UnauthDemo({ command: realCommand, fixedHeight = false }) {
  const [phase, setPhase] = useState('idle') // idle | typing | waiting | revealing
  const [command, setCommand] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const { displayed: typedCommand, done: typingDone } = useTypedText(command, {
    speedMs: 24,
    onDone: () => {
      setPhase('waiting')
      runRequest()
    },
  })

  async function runRequest() {
    const startedAt = Date.now()
    let data = null
    let err = null

    try {
      data = await testUnauthenticatedConnection()
    } catch (e) {
      err = e.message
    }

    const elapsed = Date.now() - startedAt
    if (elapsed < MIN_WAIT_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_WAIT_MS - elapsed))
    }

    setResult(data)
    setError(err)
    setPhase('revealing')
  }

  function handleStart() {
    if (!realCommand) return
    setResult(null)
    setError(null)
    setCommand(realCommand)
    setPhase('typing')
  }

  const running = phase === 'typing' || phase === 'waiting'

  return (
    <div className={`${fixedHeight ? `${CARD_HEIGHT_CLASS} flex flex-col` : ''} rounded-[var(--radius-control)] bg-white/80 border border-[var(--color-hairline)] shadow-[var(--shadow-control)] px-4 py-3.5`}>
      <div className="shrink-0 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h3 className="text-[12.5px] font-semibold text-[var(--color-ink)]">
            See the rejection yourself
          </h3>
          <p className="text-[11px] leading-snug text-[var(--color-ink-muted)]">
            A real request, with no certificate attached.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStart}
          disabled={running || !realCommand}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-[var(--color-accent)] px-3 py-1.5 text-[11.5px] font-medium text-white shadow-[var(--shadow-control)] transition-colors duration-150 hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {running ? (
            <Loader2 size={12} strokeWidth={2} className="animate-spin" />
          ) : (
            <ShieldAlert size={12} strokeWidth={2} />
          )}
          {phase === 'idle' ? 'Run this command' : 'Run again'}
        </button>
      </div>

      {phase !== 'idle' && (
        <div className="mt-3">
          <TerminalWindow compact>
            <div className="flex items-start">
              <span className="shrink-0 text-[var(--color-accent)]">$</span>
              <span className="ml-2 break-all">{typedCommand}</span>
              {!typingDone && (
                <span className="ml-0.5 mt-[2px] inline-block h-[13px] w-[6px] shrink-0 animate-pulse bg-[var(--color-ink)]" />
              )}
            </div>

            {phase === 'waiting' && (
              <div className="mt-2.5 flex items-center gap-1.5 text-[var(--color-ink-faint)]">
                <Loader2 size={11} strokeWidth={2} className="animate-spin" />
                <span>connecting</span>
              </div>
            )}

            {phase === 'revealing' && (
              <div className="mt-2.5 flex flex-col gap-1">
                <p className="animate-fade-slide-in text-[var(--color-ink-faint)]">
                  * connecting to 127.0.0.1:5001
                </p>

                {result && (
                  <>
                    <p
                      className={`animate-fade-slide-in font-semibold ${
                        result.rejected
                          ? 'text-[var(--color-warning)]'
                          : 'text-[var(--color-accent)]'
                      }`}
                      style={{ animationDelay: '150ms' }}
                    >
                      {result.rejected
                        ? '* TLS handshake failed, rejected before any HTTP response'
                        : '* unexpected: connected without a certificate'}
                    </p>
                    <p
                      className={`animate-fade-slide-in ${
                        result.rejected
                          ? 'text-[var(--color-warning)]'
                          : 'text-[var(--color-accent)]'
                      }`}
                      style={{ animationDelay: '300ms' }}
                    >
                      {result.error_type ? `${result.error_type}: ` : ''}
                      {result.detail}
                    </p>
                    <p
                      className="animate-fade-slide-in text-[11px] text-[var(--color-ink-faint)]"
                      style={{ animationDelay: '450ms' }}
                    >
                      real request, {Math.round(result.elapsed_seconds * 1000)}ms
                    </p>
                  </>
                )}

                {error && (
                  <p className="animate-fade-slide-in text-[var(--color-warning)]">
                    {error}
                  </p>
                )}
              </div>
            )}
          </TerminalWindow>
        </div>
      )}
    </div>
  )
}
