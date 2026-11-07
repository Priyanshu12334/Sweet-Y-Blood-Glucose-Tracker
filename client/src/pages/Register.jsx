import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { authErrorMessage, validateEmail } from './authValidation.js';
import './AuthPage.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const normalizedName = name.trim();
    const normalizedEmail = email.trim();
    if (normalizedName.length < 2 || normalizedName.length > 50) return setError('Name must be between 2 and 50 characters.');
    if (!validateEmail(normalizedEmail)) return setError('Enter a valid email address.');
    if (password.length < 6 || password.length > 100) return setError('Password must be between 6 and 100 characters.');
    if (password !== confirmPassword) return setError('Your passwords do not match.');

    setSubmitting(true);
    try {
      const user = await register({ name: normalizedName, email: normalizedEmail, password });
      navigate('/login', { replace: true, state: { registeredEmail: user.email, notice: 'Your account is ready. Log in to continue.' } });
    } catch (requestError) {
      setError(authErrorMessage(requestError, 'We could not create your account. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout eyebrow="GET STARTED" title="Create your account"
      description="A few details are all you need to begin tracking."
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {error && <div className="form-alert form-alert--error" role="alert">{error}</div>}
        <div className="form-field">
          <label htmlFor="register-name">Your name</label>
          <input id="register-name" name="name" type="text" autoComplete="name" placeholder="Name"
            value={name} onChange={(event) => setName(event.target.value)} maxLength={50} disabled={submitting} />
        </div>
        <div className="form-field">
          <label htmlFor="register-email">Email address</label>
          <input id="register-email" name="email" type="email" autoComplete="email" inputMode="email"
            placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={submitting} />
        </div>
        <div className="form-field">
          <label htmlFor="register-password">Password</label>
          <div className="password-input-wrap">
            <input id="register-password" name="new-password" type={showPassword ? 'text' : 'password'}
              autoComplete="new-password" placeholder="At least 6 characters" value={password}
              onChange={(event) => setPassword(event.target.value)} disabled={submitting} />
            <button className="password-toggle" type="button" onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} disabled={submitting}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="register-confirm-password">Confirm password</label>
          <div className="password-input-wrap">
            <input id="register-confirm-password" name="confirm-password" type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password" placeholder="Enter your password again" value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)} disabled={submitting} />
            <button className="password-toggle" type="button" onClick={() => setShowConfirmPassword((shown) => !shown)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} aria-pressed={showConfirmPassword} disabled={submitting}>
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <Button type="submit" className="auth-submit" disabled={submitting}>
          {submitting ? <><span className="button-spinner" /> Creating account…</> : 'Create account'}
        </Button>
        <p className="form-legal">By continuing, you agree to use Sweet-y to support your personal health tracking.</p>
      </form>
    </AuthLayout>
  );
}
