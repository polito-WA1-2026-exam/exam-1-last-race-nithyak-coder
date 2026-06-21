import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import API from '../../api.js';
import './LoginPage.css';

export default function LoginPage() {
  const [tab,      setTab]      = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [email,    setEmail]    = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);

  // Forgot-password mini-flow state
  const [showForgot,    setShowForgot]    = useState(false);
  const [forgotInput,   setForgotInput]   = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  // Auth context and navigation
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  // Handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter your username or email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(username.trim(), password);
      navigate('/game');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  // Handle signup form submission
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password || !confirm) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signup(username.trim(), email.trim(), password);
      navigate('/game');
    } catch (err) {
      setError(err.message || 'Could not create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  // Handle forgot-password form submission
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotInput.trim()) {
      setForgotMessage('Please enter your username or email.');
      return;
    }
    setForgotLoading(true);
    setForgotMessage('');
    try {
      const res = await API.requestPasswordReset(forgotInput.trim());
      setForgotMessage(res.message);
    } catch (err) {
      setForgotMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };
  // Switch between login and signup tabs
  const switchTab = (t) => {
    setTab(t);
    setError('');
    setUsername('');
    setPassword('');
    setConfirm('');
    setEmail('');
  };
  // Open and close the forgot-password mini-flow
  const openForgot = () => {
    setShowForgot(true);
    setForgotInput('');
    setForgotMessage('');
  };
  // Close forgot-password mini-flow and reset state
  const closeForgot = () => {
    setShowForgot(false);
  };
  // Render the login page
  return (
    <div className="login-page">
      <div className="login-wrap">

        <div className="login-brand">
          <div className="login-dots">
            <span className="dot dot-red" />
            <span className="dot dot-blue" />
            <span className="dot dot-green" />
            <span className="dot dot-yellow" />
          </div>
          <h1 className="login-title">Last Race</h1>
          <p className="login-sub">A metro network strategy game</p>
        </div>

        {!showForgot ? (
          <>
            <div className="login-tabs">
              <button
                className={`login-tab ${tab === 'login' ? 'active' : ''}`}
                onClick={() => switchTab('login')}
              >
                Sign in
              </button>
              <button
                className={`login-tab ${tab === 'signup' ? 'active' : ''}`}
                onClick={() => switchTab('signup')}
              >
                Sign up
              </button>
            </div>

            <div className="card">

              {/* ── Sign in ── */}
              {tab === 'login' && (
                <form onSubmit={handleLogin} noValidate>
                  <div className="login-field">
                    <label htmlFor="username">Username or email</label>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="login-field">
                    <label htmlFor="password">
                      Password
                      <button
                        type="button"
                        className="show-pwd-toggle"
                        onClick={() => setShowPwd(v => !v)}
                      >
                        {showPwd ? 'Hide' : 'Show'}
                      </button>
                    </label>
                    <input
                      id="password"
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                  </div>

                  {error && <p className="error-msg">{error}</p>}

                  <button
                    type="submit"
                    className="btn btn-primary btn-full login-submit"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign in'}
                  </button>

                  <div className="login-forgot">
                    <button type="button" className="forgot-btn" onClick={openForgot}>
                      Forgot your password?
                    </button>
                  </div>
                </form>
              )}

              {/* ── Sign up ── */}
              {tab === 'signup' && (
                <form onSubmit={handleSignup} noValidate>
                  <div className="login-field">
                    <label htmlFor="su-username">Username</label>
                    <input
                      id="su-username"
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Choose a username"
                      autoFocus
                    />
                  </div>

                  <div className="login-field">
                    <label htmlFor="su-email">Email</label>
                    <input
                      id="su-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="login-field">
                    <label htmlFor="su-password">Password</label>
                    <input
                      id="su-password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                    />
                  </div>

                  <div className="login-field">
                    <label htmlFor="su-confirm">Confirm password</label>
                    <input
                      id="su-confirm"
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat your password"
                    />
                  </div>

                  {error && <p className="error-msg">{error}</p>}

                  <button
                    type="submit"
                    className="btn btn-primary btn-full login-submit"
                    disabled={loading}
                  >
                    {loading ? 'Creating account...' : 'Create account'}
                  </button>
                </form>
              )}

              <div className="login-divider"><span>or</span></div>

              <Link to="/" className="btn btn-full guest-btn">
                Continue as guest
              </Link>
            </div>
          </>
        ) : (
          /* ── Forgot password mini-flow ── */
          <div className="card">
            <h2 className="forgot-title">Reset your password</h2>
            <p className="forgot-desc">
              Enter your username or email and we'll send you instructions to reset your password.
            </p>

            <form onSubmit={handleForgotSubmit} noValidate>
              <div className="login-field">
                <label htmlFor="forgot-id">Username or email</label>
                <input
                  id="forgot-id"
                  type="text"
                  value={forgotInput}
                  onChange={e => setForgotInput(e.target.value)}
                  placeholder="mario or mario@lastrace.com"
                  autoFocus
                />
              </div>

              {forgotMessage && <p className="forgot-msg">{forgotMessage}</p>}

              <button
                type="submit"
                className="btn btn-primary btn-full login-submit"
                disabled={forgotLoading}
              >
                {forgotLoading ? 'Sending...' : 'Send reset instructions'}
              </button>

              <button type="button" className="btn btn-full" style={{ marginTop: '10px' }} onClick={closeForgot}>
                ← Back to sign in
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
