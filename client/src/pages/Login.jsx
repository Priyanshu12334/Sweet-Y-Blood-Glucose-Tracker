import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { authErrorMessage, validateEmail } from './authValidation.js';
import './AuthPage.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const normalizedEmail = email.trim();
    if (!validateEmail(normalizedEmail)) return setError('Enter a valid email address.');
    if (!password) return setError('Enter your password.');

    setSubmitting(true);
    try {
      await login({ email: normalizedEmail, password });
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(authErrorMessage(requestError, 'We could not sign you in. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout eyebrow="WELCOME BACK" title="Log in to Sweet-y"
      description="Pick up where you left off with your health tracking."
      footer={<>New to Sweet-y? <Link to="/register">Create an account</Link></>}>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {error && <div className="form-alert form-alert--error" role="alert">{error}</div>}
        <div className="form-field">
          <label htmlFor="login-email">Email address</label>
          <input id="login-email" type="email" name="email" autoComplete="email" inputMode="email"
            placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={submitting} />
        </div>
        <div className="form-field">
          <div className="field-label-row"><label htmlFor="login-password">Password</label></div>
          <div className="password-input-wrap">
            <input id="login-password" type={showPassword ? 'text' : 'password'} name="password"
              autoComplete="current-password" placeholder="Enter your password" value={password}
              onChange={(event) => setPassword(event.target.value)} disabled={submitting} />
            <button className="password-toggle" type="button" onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} disabled={submitting}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <Button type="submit" className="auth-submit" disabled={submitting}>
          {submitting ? <><span className="button-spinner" /> Signing in…</> : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
