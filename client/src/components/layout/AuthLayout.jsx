import Card from '../common/Card.jsx';

export default function AuthLayout({ eyebrow, title, description, children, footer }) {
  return (
    <main className="auth-page">
      <a className="auth-brand" href="/login" aria-label="Sweet-y home">sweet<span>y</span></a>
      <div className="auth-layout">
        <section className="auth-intro" aria-label="Sweet-y introduction">
          <div className="intro-orb intro-orb--one" />
          <div className="intro-orb intro-orb--two" />
          <div className="intro-content">
            <span className="intro-mark" aria-hidden="true">✳</span>
            <p className="intro-overline">A LITTLE MORE IN TUNE</p>
            <h2>Your health journey,<br />one reading at a time.</h2>
            <p className="intro-copy">A calm, clear space to keep track of your glucose and notice your patterns.</p>
            <div className="intro-note"><span className="intro-note-dot" /> Private health tracking, made simple</div>
          </div>
        </section>
        <section className="auth-panel">
          <div className="auth-heading">
            <p className="auth-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <Card className="auth-card">{children}</Card>
          <p className="auth-footer">{footer}</p>
          <p className="auth-privacy"><span aria-hidden="true">⌑</span> Your health information stays private and secure.</p>
        </section>
      </div>
    </main>
  );
}
