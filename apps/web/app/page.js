const featureChecklist = [
  "JWT auth with refresh tokens",
  "Document dashboard",
  "Typed block editor",
  "Auto-save with stale write protection",
  "Public read-only sharing",
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Phase 1.2 Setup</p>
        <h1>BlockNote workspace is ready for implementation.</h1>
        <p className="lede">
          This scaffold keeps the frontend on Next.js and the backend on an
          Express REST API so the project stays aligned with the assignment
          requirements from day one.
        </p>
        <ul className="feature-list">
          {featureChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
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
