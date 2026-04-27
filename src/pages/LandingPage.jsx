import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function useInView(ref) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold: 0.15 }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ref])
  return inView
}

function AnimatedSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref)
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-bg pt-14">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-24 md:py-36">
        <AnimatedSection>
          <p className="font-mono text-xs text-text-muted tracking-widest uppercase mb-6">
            Visual Novel Engine + DAW
          </p>
        </AnimatedSection>

        <AnimatedSection delay={100}>
          <h1 className="font-sans text-4xl md:text-6xl lg:text-7xl font-300 text-text leading-[1.1] tracking-tight mb-8">
            Create interactive stories
            <br />
            <span className="text-text-secondary">with music you compose.</span>
          </h1>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <p className="font-mono text-sm text-text-muted max-w-xl leading-relaxed mb-10">
            A free, browser-based platform for building visual novels with an 
            integrated digital audio workstation. No downloads. No installs. 
            Just create.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={300}>
          <div className="flex items-center gap-4">
            <Link
              to={user ? '/dashboard' : '/signup'}
              className="font-mono text-xs px-6 py-3 bg-text text-bg hover:bg-text-secondary transition-colors tracking-wider"
            >
              Start Creating
            </Link>
            <Link
              to={user ? '/dashboard' : '/login'}
              className="font-mono text-xs px-6 py-3 border border-border hover:border-border-hover transition-colors tracking-wider"
            >
              {user ? 'Dashboard' : 'Log In'}
            </Link>
          </div>
        </AnimatedSection>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <AnimatedSection>
          <p className="font-mono text-xs text-text-muted tracking-widest uppercase mb-12">
            What you get
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
          <AnimatedSection delay={100}>
            <div className="bg-bg p-8 md:p-12 min-h-[280px] flex flex-col justify-between group hover:bg-bg-card transition-colors duration-300">
              <div>
                <div className="font-mono text-xs text-text-muted mb-4">001</div>
                <h3 className="font-sans text-xl font-400 mb-3">Visual Novel Engine</h3>
                <p className="font-mono text-xs text-text-muted leading-relaxed">
                  Build scenes with dialogue, character placement, branching 
                  choices, and transitions. Node-based flow editor for 
                  visualizing story structure.
                </p>
              </div>
              <div className="mt-8 font-mono text-xs text-text-dim group-hover:text-text-muted transition-colors">
                Drag & drop · Branching logic · Live preview
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <div className="bg-bg p-8 md:p-12 min-h-[280px] flex flex-col justify-between group hover:bg-bg-card transition-colors duration-300">
              <div>
                <div className="font-mono text-xs text-text-muted mb-4">002</div>
                <h3 className="font-sans text-xl font-400 mb-3">Music Composer</h3>
                <p className="font-mono text-xs text-text-muted leading-relaxed">
                  Step sequencer with 4 channels — lead, bass, chords, and 
                  drums. Multiple instrument presets. Export to MP3. Attach 
                  tracks directly to scenes.
                </p>
              </div>
              <div className="mt-8 font-mono text-xs text-text-dim group-hover:text-text-muted transition-colors">
                4 channels · Real-time playback · MP3 export
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={300}>
            <div className="bg-bg p-8 md:p-12 min-h-[280px] flex flex-col justify-between group hover:bg-bg-card transition-colors duration-300">
              <div>
                <div className="font-mono text-xs text-text-muted mb-4">003</div>
                <h3 className="font-sans text-xl font-400 mb-3">Publish & Play</h3>
                <p className="font-mono text-xs text-text-muted leading-relaxed">
                  One click to publish. Share your visual novel with anyone. 
                  Players experience your story with full audio, all in the 
                  browser.
                </p>
              </div>
              <div className="mt-8 font-mono text-xs text-text-dim group-hover:text-text-muted transition-colors">
                Public URL · No installs · Instant play
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={400}>
            <div className="bg-bg p-8 md:p-12 min-h-[280px] flex flex-col justify-between group hover:bg-bg-card transition-colors duration-300">
              <div>
                <div className="font-mono text-xs text-text-muted mb-4">004</div>
                <h3 className="font-sans text-xl font-400 mb-3">Free & Open</h3>
                <p className="font-mono text-xs text-text-muted leading-relaxed">
                  No paywalls, no premium tiers. Everything runs in your 
                  browser. Your projects, your data, your creations.
                </p>
              </div>
              <div className="mt-8 font-mono text-xs text-text-dim group-hover:text-text-muted transition-colors">
                Browser-based · Lightweight · Zero cost
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Workflow */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <AnimatedSection>
          <p className="font-mono text-xs text-text-muted tracking-widest uppercase mb-12">
            How it works
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { num: '01', title: 'Build your story', desc: 'Create scenes, write dialogue, set up branching choices. The visual editor makes it intuitive.' },
            { num: '02', title: 'Compose music', desc: 'Open the DAW, pick your instruments, lay down patterns. Your soundtrack, your way.' },
            { num: '03', title: 'Publish & share', desc: 'Attach music to scenes, hit publish. Anyone can play your visual novel instantly.' },
          ].map((step, i) => (
            <AnimatedSection key={i} delay={i * 150}>
              <div>
                <div className="font-mono text-xs text-text-dim mb-4">{step.num}</div>
                <h3 className="font-sans text-lg font-400 mb-3">{step.title}</h3>
                <p className="font-mono text-xs text-text-muted leading-relaxed">{step.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="border-t border-border" />
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <AnimatedSection>
          <h2 className="font-sans text-3xl md:text-4xl font-300 mb-6">Ready to create?</h2>
          <p className="font-mono text-xs text-text-muted mb-8">Start building your visual novel today. It&apos;s free.</p>
          <Link
            to={user ? '/dashboard' : '/signup'}
            className="inline-block font-mono text-xs px-8 py-3 bg-text text-bg hover:bg-text-secondary transition-colors tracking-wider"
          >
            Get Started
          </Link>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-mono text-xs text-text-dim">HazeEngine</span>
          <span className="font-mono text-xs text-text-dim">2026</span>
        </div>
      </footer>
    </div>
  )
}
