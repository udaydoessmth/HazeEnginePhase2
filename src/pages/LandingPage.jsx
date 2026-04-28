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
      className={`transition-all duration-1000 ease-out ${className}`}
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

/* Guaranteed centering regardless of parent layout */
function Inner({ children, className = '' }) {
  return (
    <div
      className={className}
      style={{
        maxWidth: '1200px',
        marginLeft: 'auto',
        marginRight: 'auto',
        paddingLeft: 'clamp(24px, 5vw, 64px)',
        paddingRight: 'clamp(24px, 5vw, 64px)',
      }}
    >
      {children}
    </div>
  )
}

/* Logo mark — ꛅ in Symbol Craze style */
function LogoMark({ size = 28, className = '' }) {
  return (
    <span
      className={className}
      style={{
        fontFamily: '"Symbol Craze", serif',
        fontSize: `${size}px`,
        lineHeight: 1,
        color: 'currentColor',
        display: 'inline-block',
      }}
      aria-hidden="true"
    >
      ꛅ
    </span>
  )
}

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-bg relative" style={{ overflowX: 'hidden' }}>

      {/* Background ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 bg-white/8 rounded-full pointer-events-none"
        style={{ width: '900px', height: '500px', filter: 'blur(140px)' }}
      />

      {/* ─── HERO ───────────────────────────────────────────── */}
      <section className="relative" style={{ paddingTop: '160px', paddingBottom: '120px' }}>
        <Inner>
          <div className="grid grid-cols-1 md:grid-cols-12 items-center" style={{ gap: '64px' }}>

            {/* Left content */}
            <div className="md:col-span-7 relative z-10 flex flex-col" style={{ gap: '32px' }}>

              <AnimatedSection>
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-bg-card border border-border shadow-sm" style={{ width: 'fit-content' }}>
                  <span className="w-2 h-2 rounded-full bg-text animate-pulse flex-shrink-0" />
                  <span className="font-mono text-xs text-text-muted tracking-widest uppercase">
                    Visual Novel Engine + DAW
                  </span>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={100}>
                <h1 className="font-sans font-semibold text-text tracking-tight" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: '1.06' }}>
                  Create interactive stories
                  <br />
                  <span className="text-text-secondary font-medium">with music you compose.</span>
                </h1>
              </AnimatedSection>

              <AnimatedSection delay={200}>
                <p className="font-mono text-text-muted" style={{ fontSize: '0.9rem', lineHeight: '2', maxWidth: '44ch' }}>
                  A free, browser-based platform for building visual novels with an
                  integrated digital audio workstation. No downloads. No installs.
                  Just pure creative flow.
                </p>
              </AnimatedSection>

              <AnimatedSection delay={300}>
                <div className="flex flex-wrap items-center" style={{ gap: '16px', paddingTop: '8px' }}>
                  <Link
                    to={user ? '/dashboard' : '/signup'}
                    className="font-mono text-sm text-white tracking-wider hover:scale-[1.02] hover:brightness-110 transition-all duration-300"
                    style={{
                      padding: '14px 32px',
                      borderRadius: '16px',
                      background: 'linear-gradient(to bottom, #2a2a2a, #111111)',
                      border: '1px solid #444444',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                  >
                    Start Creating
                  </Link>
                  <Link
                    to={user ? '/dashboard' : '/login'}
                    className="font-mono text-sm text-text-muted hover:text-text transition-all tracking-wider"
                    style={{
                      padding: '14px 32px',
                      borderRadius: '16px',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {user ? 'Dashboard' : 'Log In'}
                  </Link>
                </div>
              </AnimatedSection>
            </div>

            {/* Right — orb */}
            <div className="hidden md:flex md:col-span-5 items-center justify-center" style={{ height: '400px' }}>
              <AnimatedSection delay={400} className="w-full h-full flex items-center justify-center">
                <div className="relative flex items-center justify-center" style={{ width: '300px', height: '300px' }}>
                  <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)', filter: 'blur(48px)' }} />
                  <div className="absolute inset-0 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)', backdropFilter: 'blur(20px)' }} />
                  <div className="absolute rounded-full" style={{ width: '190px', height: '190px', border: '1px solid rgba(255,255,255,0.12)', background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%)', backdropFilter: 'blur(32px)' }} />
                  <div className="absolute rounded-full" style={{ width: '90px', height: '90px', background: 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 100%)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(40px)' }} />
                  <div className="absolute rounded-full" style={{ width: '14px', height: '14px', background: 'rgba(255,255,255,0.45)', filter: 'blur(3px)' }} />
                </div>
              </AnimatedSection>
            </div>

          </div>
        </Inner>
      </section>

      {/* ─── DIVIDER ────────────────────────────────────────── */}
      <Inner><div className="border-t border-border/40" /></Inner>

      {/* ─── FEATURES ───────────────────────────────────────── */}
      <section style={{ paddingTop: '96px', paddingBottom: '96px' }}>
        <Inner>

          <AnimatedSection>
            <div className="flex flex-col md:flex-row md:items-end justify-between" style={{ gap: '32px', marginBottom: '64px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p className="font-mono text-xs text-text-muted tracking-widest uppercase">Platform Capabilities</p>
                <h2 className="font-sans font-semibold tracking-tight" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
                  Everything you need
                </h2>
              </div>
              <p className="font-mono text-sm text-text-muted" style={{ maxWidth: '36ch', lineHeight: '1.9' }}>
                Integrated tools designed to keep you in the creative flow without breaking context.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '20px' }}>
            {[
              {
                num: '001',
                title: 'Visual Novel Engine',
                desc: 'Build scenes with dialogue, character placement, branching choices, and transitions. Node-based flow editor for visualizing story structure.',
                tags: ['Drag & drop', 'Branching logic', 'Live preview']
              },
              {
                num: '002',
                title: 'Music Composer',
                desc: 'Step sequencer with 4 channels — lead, bass, chords, and drums. Multiple instrument presets. Export to MP3. Attach tracks directly to scenes.',
                tags: ['4 channels', 'Real-time playback', 'MP3 export']
              },
              {
                num: '003',
                title: 'Publish & Play',
                desc: 'One click to publish. Share your visual novel with anyone. Players experience your story with full audio, all in the browser.',
                tags: ['Public URL', 'No installs', 'Instant play']
              },
              {
                num: '004',
                title: 'Free & Open',
                desc: 'No paywalls, no premium tiers. Everything runs in your browser. Your projects, your data, your creations.',
                tags: ['Browser-based', 'Lightweight', 'Zero cost']
              }
            ].map((feature, i) => (
              <AnimatedSection key={feature.num} delay={i * 100}>
                <div
                  className="group relative hover:-translate-y-1 transition-all duration-500 h-full flex flex-col justify-between overflow-hidden"
                  style={{
                    background: '#050505',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    padding: '32px',
                    minHeight: '220px',
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-px opacity-50 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)' }} />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
                      <span className="font-mono text-xs text-text-dim">{feature.num}</span>
                      <div className="h-px bg-border" style={{ width: '32px' }} />
                    </div>
                    <h3 className="font-sans font-semibold tracking-tight" style={{ fontSize: '1.2rem', marginBottom: '10px' }}>{feature.title}</h3>
                    <p className="font-mono text-text-muted" style={{ fontSize: '0.82rem', lineHeight: '1.75' }}>{feature.desc}</p>
                  </div>

                  <div className="relative z-10 flex flex-wrap" style={{ gap: '8px', marginTop: '28px' }}>
                    {feature.tags.map(tag => (
                      <span
                        key={tag}
                        className="font-mono text-text-dim uppercase tracking-wider"
                        style={{ fontSize: '0.6rem', padding: '5px 12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </Inner>
      </section>

      {/* ─── DIVIDER ────────────────────────────────────────── */}
      <Inner><div className="border-t border-border/40" /></Inner>

      {/* ─── HOW IT WORKS ───────────────────────────────────── */}
      <section style={{ paddingTop: '96px', paddingBottom: '96px' }}>
        <Inner>
          <AnimatedSection>
            <p className="font-mono text-xs text-text-muted tracking-widest uppercase text-center" style={{ marginBottom: '72px' }}>
              How it works
            </p>
          </AnimatedSection>

          <div className="relative grid grid-cols-1 md:grid-cols-3" style={{ gap: '48px' }}>
            <div className="hidden md:block absolute h-px bg-border/40" style={{ top: '32px', left: '22%', right: '22%' }} />

            {[
              { num: '01', title: 'Build your story', desc: 'Create scenes, write dialogue, set up branching choices. The visual editor makes it intuitive.' },
              { num: '02', title: 'Compose music', desc: 'Open the DAW, pick your instruments, lay down patterns. Your soundtrack, your way.' },
              { num: '03', title: 'Publish & share', desc: 'Attach music to scenes, hit publish. Anyone can play your visual novel instantly.' },
            ].map((step, i) => (
              <AnimatedSection key={i} delay={i * 180}>
                <div className="flex flex-col items-center text-center group" style={{ gap: '20px' }}>
                  <div
                    className="flex items-center justify-center flex-shrink-0 relative z-10 group-hover:shadow-lg transition-all duration-300"
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'var(--color-bg-card)',
                    }}
                  >
                    <span className="font-mono text-sm text-text-muted">{step.num}</span>
                  </div>
                  <div className="flex flex-col" style={{ gap: '10px' }}>
                    <h3 className="font-sans font-semibold" style={{ fontSize: '1.15rem' }}>{step.title}</h3>
                    <p className="font-mono text-text-muted mx-auto" style={{ fontSize: '0.82rem', lineHeight: '1.8', maxWidth: '26ch' }}>{step.desc}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </Inner>
      </section>

      {/* ─── CTA ────────────────────────────────────────────── */}
      <section className="relative border-t border-border/50 overflow-hidden" style={{ padding: '120px 24px' }}>
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-full pointer-events-none"
          style={{ width: '100%', maxWidth: '700px', height: '320px', background: 'rgba(255,255,255,0.04)', filter: 'blur(120px)' }}
        />
        <div className="relative z-10 flex flex-col items-center text-center" style={{ gap: '20px' }}>
          <AnimatedSection delay={80}>
            <h2 className="font-sans font-semibold tracking-tight" style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}>
              Ready to create?
            </h2>
          </AnimatedSection>
          <AnimatedSection delay={160}>
            <p className="font-mono text-text-muted" style={{ fontSize: '0.95rem', lineHeight: '1.8' }}>
              Start building your visual novel today. It&apos;s free.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={240}>
            <Link
              to={user ? '/dashboard' : '/signup'}
              className="inline-block font-mono text-sm text-white tracking-wider hover:scale-[1.02] hover:brightness-110 transition-all duration-300"
              style={{
                marginTop: '16px',
                padding: '16px 48px',
                borderRadius: '16px',
                background: 'linear-gradient(to bottom, #2a2a2a, #111111)',
                border: '1px solid #444444',
                boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
              }}
            >
              Get Started
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-border/40 bg-bg relative z-20" style={{ padding: '32px 0' }}>
        <Inner>
          <div className="flex items-center justify-between">
            {/* Logo + wordmark in footer */}
            <div className="flex items-center gap-2">
              <LogoMark size={22} className="text-text-muted" />
              <span className="font-sans font-semibold text-sm text-text-muted tracking-wider">HazeEngine</span>
            </div>
            <span className="font-mono text-xs text-text-dim">© 2026</span>
          </div>
        </Inner>
      </footer>

    </div>
  )
}