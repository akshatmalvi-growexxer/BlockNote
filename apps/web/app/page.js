export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">FluxNotes</p>
        <h1>FluxNotes</h1>
        <p className="lede">
          A focused, block-based workspace for fast notes and structured docs.
        </p>
        <div className="cta-row">
          <a className="cta primary" href="/login">
            Log in
          </a>
          <a className="cta secondary" href="/register">
            Create account
          </a>
        </div>
      </section>
    </main>
  );
}
