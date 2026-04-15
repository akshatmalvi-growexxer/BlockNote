"use client";

import { useEffect, useRef } from "react";
import ThemeToggle from "../components/ThemeToggle";

export default function LandingPage() {
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll(".reveal").forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <>
      {/* ─── Navbar ─── */}
      <nav className="landing-nav" id="landing-nav">
        <div className="nav-inner">
          <a href="/" className="nav-logo" id="nav-logo">
            <span className="nav-logo-icon">⚡</span>
            <span className="nav-logo-text">FluxNotes</span>
          </a>

          <div className="nav-links" id="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How it works</a>
            <a href="#testimonials" className="nav-link">Testimonials</a>
          </div>

          <div className="nav-actions" id="nav-actions">
            <ThemeToggle variant="nav" />
            <a href="/login" className="nav-btn nav-btn--ghost" id="nav-login-btn">
              Log in
            </a>
            <a href="/register" className="nav-btn nav-btn--primary" id="nav-signup-btn">
              Sign up
            </a>
          </div>

          <button
            className="nav-hamburger"
            id="nav-hamburger"
            aria-label="Open menu"
            onClick={() => {
              document.querySelector(".nav-links")?.classList.toggle("nav-links--open");
              document.querySelector(".nav-actions")?.classList.toggle("nav-actions--open");
            }}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="hero" id="hero-section">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-badge reveal">
            <span className="hero-badge-dot" />
            Now with real-time collaboration
          </div>
          <h1 className="hero-title reveal">
            Notes that flow<br />
            <span className="hero-title-accent">with your thoughts</span>
          </h1>
          <p className="hero-subtitle reveal">
            A focused, block-based workspace for fast notes and structured docs.
            Beautiful, blazing-fast, and built for clarity.
          </p>
          <div className="hero-cta-row reveal">
            <a href="/register" className="btn btn--primary btn--lg" id="hero-signup-btn">
              Get started free
              <span className="btn-arrow">→</span>
            </a>
            <a href="/login" className="btn btn--glass btn--lg" id="hero-login-btn">
              Log in to your workspace
            </a>
          </div>
          <p className="hero-note reveal">No credit card required · Free forever for individuals</p>
        </div>

        {/* Hero visual */}
        <div className="hero-visual reveal">
          <div className="hero-window">
            <div className="hero-window-bar">
              <span className="dot dot--red" />
              <span className="dot dot--yellow" />
              <span className="dot dot--green" />
              <span className="hero-window-title">My Project Notes</span>
            </div>
            <div className="hero-window-body">
              <div className="mock-block mock-h1">
                <span className="mock-handle">⋮⋮</span>
                Sprint Planning — Q2 2026
              </div>
              <div className="mock-block mock-text">
                <span className="mock-handle">⋮⋮</span>
                Key objectives for the upcoming quarter, organised by priority and team capacity.
              </div>
              <div className="mock-block mock-h2">
                <span className="mock-handle">⋮⋮</span>
                🎯 Top Priorities
              </div>
              <div className="mock-block mock-todo">
                <span className="mock-handle">⋮⋮</span>
                <span className="mock-check mock-check--done">✓</span>
                Finalise API v2 contracts
              </div>
              <div className="mock-block mock-todo">
                <span className="mock-handle">⋮⋮</span>
                <span className="mock-check mock-check--done">✓</span>
                Ship landing page redesign
              </div>
              <div className="mock-block mock-todo">
                <span className="mock-handle">⋮⋮</span>
                <span className="mock-check" />
                Performance audit & lighthouse scoring
              </div>
              <div className="mock-block mock-code">
                <span className="mock-handle">⋮⋮</span>
                <code>const velocity = sprintPoints / daysRemaining;</code>
              </div>
              <div className="mock-cursor" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Logos / trust bar ─── */}
      <section className="trust-bar reveal" id="trust-bar">
        <p className="trust-label">Trusted by teams at</p>
        <div className="trust-logos">
          <span className="trust-logo">Acme Corp</span>
          <span className="trust-logo">Nebula AI</span>
          <span className="trust-logo">PixelForge</span>
          <span className="trust-logo">CloudSync</span>
          <span className="trust-logo">DataVista</span>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="features-section" id="features">
        <div className="section-header reveal">
          <p className="section-eyebrow">Capabilities</p>
          <h2 className="section-title">Everything you need, nothing you don't</h2>
          <p className="section-subtitle">
            Powerful primitives that adapt to how you think and work.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card reveal" id="feature-blocks">
            <div className="feature-icon">🧱</div>
            <h3>Block-based editing</h3>
            <p>
              Paragraphs, headings, code, images, to-dos — every content type
              is a draggable, composable block.
            </p>
          </div>
          <div className="feature-card reveal" id="feature-themes">
            <div className="feature-icon">🎨</div>
            <h3>Light &amp; Dark themes</h3>
            <p>
              A hand-crafted colour palette for both modes, easy on the eyes
              from morning to midnight.
            </p>
          </div>
          <div className="feature-card reveal" id="feature-slash">
            <div className="feature-icon">⚡</div>
            <h3>Slash commands</h3>
            <p>
              Type <kbd>/</kbd> to summon any block type instantly. No mouse
              required — keyboard-first workflow.
            </p>
          </div>
          <div className="feature-card reveal" id="feature-share">
            <div className="feature-icon">🔗</div>
            <h3>Instant sharing</h3>
            <p>
              Generate a public link for any document. Share your notes with
              anyone — no account needed to view.
            </p>
          </div>
          <div className="feature-card reveal" id="feature-fast">
            <div className="feature-icon">🚀</div>
            <h3>Blazing fast</h3>
            <p>
              Zero-bloat architecture. Sub-100ms saves, instant page loads,
              and buttery-smooth interactions.
            </p>
          </div>
          <div className="feature-card reveal" id="feature-secure">
            <div className="feature-icon">🔒</div>
            <h3>Secure by default</h3>
            <p>
              Token-based auth, encrypted at rest, and automatic session
              management. Your data stays yours.
            </p>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="how-section" id="how-it-works">
        <div className="section-header reveal">
          <p className="section-eyebrow">Workflow</p>
          <h2 className="section-title">From zero to productive in seconds</h2>
        </div>

        <div className="steps-row">
          <div className="step-card reveal">
            <div className="step-number">01</div>
            <h3>Create an account</h3>
            <p>Sign up in seconds — just an email and password. No friction, no forms.</p>
          </div>
          <div className="step-connector reveal" aria-hidden="true" />
          <div className="step-card reveal">
            <div className="step-number">02</div>
            <h3>Start a document</h3>
            <p>Hit "New document" and begin typing. Blocks appear as you write.</p>
          </div>
          <div className="step-connector reveal" aria-hidden="true" />
          <div className="step-card reveal">
            <div className="step-number">03</div>
            <h3>Share &amp; collaborate</h3>
            <p>Generate a public link and share your notes with the world — instantly.</p>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="testimonials-section" id="testimonials">
        <div className="section-header reveal">
          <p className="section-eyebrow">What people say</p>
          <h2 className="section-title">Loved by note-takers everywhere</h2>
        </div>

        <div className="testimonials-grid">
          <blockquote className="testimonial-card reveal" id="testimonial-1">
            <p>
              "FluxNotes replaced three tools for me. The slash commands and
              block system make writing feel effortless."
            </p>
            <footer>
              <strong>Priya Sharma</strong>
              <span>Product Manager</span>
            </footer>
          </blockquote>
          <blockquote className="testimonial-card reveal" id="testimonial-2">
            <p>
              "Finally a notes app that doesn't get in the way. Dark mode is
              gorgeous and the sharing feature is clutch."
            </p>
            <footer>
              <strong>James Chen</strong>
              <span>Software Engineer</span>
            </footer>
          </blockquote>
          <blockquote className="testimonial-card reveal" id="testimonial-3">
            <p>
              "I use it for lecture notes and project planning. Clean, fast,
              and everything just works."
            </p>
            <footer>
              <strong>Amira El-Amin</strong>
              <span>Graduate Researcher</span>
            </footer>
          </blockquote>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="cta-banner reveal" id="cta-banner">
        <div className="cta-banner-glow" aria-hidden="true" />
        <h2>Ready to let your notes flow?</h2>
        <p>Join thousands of thinkers, builders, and creators using FluxNotes.</p>
        <div className="cta-banner-actions">
          <a href="/register" className="btn btn--primary btn--lg" id="cta-signup-btn">
            Create free account
            <span className="btn-arrow">→</span>
          </a>
          <a href="/login" className="btn btn--glass btn--lg" id="cta-login-btn">
            Log in
          </a>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing-footer" id="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="nav-logo-icon">⚡</span>
            <span className="nav-logo-text">FluxNotes</span>
            <p className="footer-tagline">Block-based notes, beautifully simple.</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How it works</a>
              <a href="#testimonials">Testimonials</a>
            </div>
            <div className="footer-col">
              <h4>Account</h4>
              <a href="/login">Log in</a>
              <a href="/register">Sign up</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} FluxNotes. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
