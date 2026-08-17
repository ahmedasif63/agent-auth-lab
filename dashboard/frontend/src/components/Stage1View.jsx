import { useStage1Status } from '../hooks/useStage1Status'
import { useNowTick } from '../hooks/useNowTick'
import Stage1LiveStrip from './Stage1LiveStrip'
import Stage1IssuanceChain from './Stage1IssuanceChain'
import Stage1UnauthDemo from './Stage1UnauthDemo'
import Stage1RotationPanel from './Stage1RotationPanel'
import Stage1KeyVsCert from './Stage1KeyVsCert'
import Stage1MutualTLSDiagram from './Stage1MutualTLSDiagram'
import Stage1BoundaryFlow from './Stage1BoundaryFlow'
import Stage1TTLCompare from './Stage1TTLCompare'
import Reveal from './Reveal'

// A minor/supporting section: small eyebrow label, then content. Deliberately
// quieter than the identity-issuance hero below — same template reused for
// every section here on purpose, so that hero reads as the one exception,
// not just one of many similar blocks.
function Section({ title, children }) {
  return (
    <Reveal as="section" className="mt-16">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </Reveal>
  )
}

// Genuinely distinct from HowItWorksView's Stage 0 content: a live facts
// strip and rotation panel backed by the real running containers, a hero
// horizontal identity issuance diagram (not a request pipeline), an
// interactive live proof of the TLS-layer rejection, none of it a relabeled
// copy of PipelineDiagram. Section layouts are deliberately varied — a
// side-by-side comparison, a full-bleed hero diagram, two-column diagrams,
// a stacked flow — so scrolling down feels like distinct moments rather
// than one template repeated with different words.
export default function Stage1View() {
  const { status, connectionState } = useStage1Status()
  const now = useNowTick(1000)

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 pt-12">
        <Reveal>
          <h1 className="text-[26px] font-semibold text-[var(--color-ink)]">
            How Stage 1 works
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-ink-muted)]">
            In Stage 0, the agent and the tool server trusted each other with
            one shared password. Someone typed that password into both sides
            ahead of time. Stage 1 replaces that completely. Each process now
            proves who it is with its own short-lived digital identity. Both
            sides check that identity before they talk. Everything on this
            page is read live from the containers actually running on this
            machine right now. Nothing here is simulated.
          </p>

          <div className="mt-8">
            <Stage1LiveStrip status={status} connectionState={connectionState} />
          </div>
        </Reveal>

        <Section title="What changed">
          <p className="text-[13.5px] leading-relaxed text-[var(--color-ink-muted)]">
            The hardcoded API key in{' '}
            <code className="rounded bg-black/[0.04] px-1 py-0.5 text-[12px]">
              server.py
            </code>{' '}
            is gone. In its place, every process gets its own identity, issued
            by dedicated infrastructure built for exactly this job. Anything
            that shows up without one never reaches the application code.
          </p>
          <div className="mt-4">
            <Stage1KeyVsCert />
          </div>
        </Section>
      </div>

      {/* The central idea of the page, given real visual weight: wider than
          everything else, more padding, a tinted backdrop, and by far the
          largest diagram here. Every other section on this page is
          deliberately quieter than this one. */}
      <Reveal as="section" className="mt-20 mx-auto max-w-6xl px-6">
        <div className="rounded-[28px] bg-gradient-to-b from-[var(--color-accent-soft)]/70 to-[var(--color-accent-soft)]/15 border border-[var(--color-accent)]/15 px-6 py-10 sm:px-10 sm:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
              The core idea
            </span>
            <h2 className="mt-3 text-[22px] font-semibold text-[var(--color-ink)] sm:text-[26px]">
              How an identity gets issued
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-ink-muted)]">
              This uses SPIFFE and SPIRE, an open standard for giving software
              its own identity. Instead of a password that someone hands out
              ahead of time, each process gets a certificate, called an{' '}
              <strong>SVID</strong> (SPIFFE Verifiable Identity Document),
              issued through a short chain of trust inside one{' '}
              <strong>trust domain</strong>, a name for the group of things
              that trust the same root.
            </p>
          </div>

          <div className="mt-10">
            <Stage1IssuanceChain />
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-center text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
            No workload ever holds a long-lived secret. It simply asks its
            local SPIRE Agent, "who am I?", and gets back a certificate that
            is valid for minutes, not forever.
          </p>
        </div>
      </Reveal>

      <div className="mx-auto max-w-3xl px-6 pb-12">
        <Section title="Mutual TLS">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <p className="text-[13.5px] leading-relaxed text-[var(--color-ink-muted)] lg:max-w-[280px]">
              When you visit a normal website over HTTPS, only the server
              proves who it is. Your browser does not prove anything back.
              Stage 1 uses something stronger, called{' '}
              <strong>mutual TLS</strong>, or <strong>mTLS</strong> for short:
              both sides show a certificate, and both check that the other
              one was signed by the same trust domain. That is what "mutual"
              means.
            </p>
            <div className="flex-1">
              <Stage1MutualTLSDiagram />
            </div>
          </div>
        </Section>

        <Section title="The security boundary moved">
          <p className="mb-4 text-[13.5px] leading-relaxed text-[var(--color-ink-muted)]">
            In Stage 0, an unauthorized caller still reached the application
            code, which had to actively choose to reject it. In Stage 1, a
            caller with no certificate never gets that far — the connection
            is refused during the TLS handshake, before any application code
            runs.
          </p>
          <Stage1BoundaryFlow />
          <div className="mt-4">
            <Stage1UnauthDemo command={status?.demo_command} />
          </div>
        </Section>

        <Section title="Rotation, not a static secret">
          <p className="text-[13.5px] leading-relaxed text-[var(--color-ink-muted)]">
            Stage 0's key never expired. Every identity in Stage 1 expires
            after 180 seconds, set directly on the SPIRE registration entry.
            stage1-server checks in on its certificate every 60 seconds as a
            safety margin — that check is not the identity's real lifetime,
            just how often it happens to look.
          </p>
          <div className="mt-3">
            <Stage1TTLCompare />
          </div>
          <div className="mt-4">
            <Stage1RotationPanel status={status} now={now} />
          </div>
        </Section>

        <Section title="What's still not solved">
          <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-ink-faint)] bg-white/40 px-5 py-4">
            <p className="text-[13.5px] leading-relaxed text-[var(--color-ink-faint)]">
              Stage 1 only answers one question: who is asking. It does not
              yet answer a second question: should they be allowed to do
              this specific thing. agent.py can now prove its identity with a
              real certificate. But once proven, it can still ask server.py
              to do anything server.py exposes. Deciding whether a specific
              identity should be allowed to take a specific action is still
              an open gap. A future stage is meant to close it. Stage 1 does
              not claim to have solved it.
            </p>
          </div>
        </Section>
      </div>
    </div>
  )
}
