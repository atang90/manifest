import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { COLORS } from './theme';

export default function Auth() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setMessage('Account created. Check your email to confirm, then sign in.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', ui-sans-serif, system-ui", color: COLORS.ink, padding: 16 }}>
      <style>{`
        .cm-input {
          background: ${COLORS.bg}; border: 1px solid ${COLORS.line}; color: ${COLORS.ink};
          border-radius: 6px; padding: 9px 11px; font-size: 14px; width: 100%;
        }
        .cm-input:focus { outline: none; border-color: ${COLORS.accent}; }
        button { cursor: pointer; font-family: inherit; }
      `}</style>
      <div style={{ width: '100%', maxWidth: 360, background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 28 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 650, letterSpacing: '-0.01em' }}>Manifest</h1>
        <p style={{ margin: '0 0 20px', color: COLORS.inkDim, fontSize: 13 }}>
          {mode === 'signin' ? 'Sign in to your account' : 'Create an account'}
        </p>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5, color: COLORS.inkDim }}>
            Email
            <input
              className="cm-input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5, color: COLORS.inkDim }}>
            Password
            <input
              className="cm-input"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {error && <p style={{ margin: 0, color: COLORS.clay, fontSize: 12.5 }}>{error}</p>}
          {message && <p style={{ margin: 0, color: COLORS.sage, fontSize: 12.5 }}>{message}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4, background: COLORS.accent, border: 'none', color: '#0E1416', fontSize: 13.5, fontWeight: 600,
              padding: '10px 14px', borderRadius: 6, opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <p style={{ marginTop: 18, marginBottom: 0, fontSize: 12.5, color: COLORS.inkDim, textAlign: 'center' }}>
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); }}
            style={{ background: 'none', border: 'none', color: COLORS.accent, fontSize: 12.5, fontWeight: 600, padding: 0 }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
