import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from './supabaseClient';
import { COLORS } from './theme';
import { Field } from './ui';

export default function Profile({ session, onClose }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const changePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage('Password updated.');
      setPassword('');
      setConfirm('');
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 100 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 380, background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 22 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 650 }}>Profile</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: COLORS.inkFaint, padding: 4, display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>
        <p style={{ margin: '0 0 18px', color: COLORS.inkDim, fontSize: 13, wordBreak: 'break-all' }}>{session.user.email}</p>

        <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: COLORS.inkDim }}>
            Change password
          </h3>
          <Field label="New password">
            <input
              className="cm-input"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Field label="Confirm new password">
            <input
              className="cm-input"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          {error && <p style={{ margin: 0, color: COLORS.clay, fontSize: 12.5 }}>{error}</p>}
          {message && <p style={{ margin: 0, color: COLORS.sage, fontSize: 12.5 }}>{message}</p>}

          <button
            type="submit"
            disabled={saving}
            style={{ marginTop: 4, background: COLORS.accent, border: 'none', color: '#0E1416', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 6, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Updating…' : 'Update password'}
          </button>
        </form>

        <DangerZone session={session} />
      </div>
    </div>
  );
}

// Deleting sets a flag rather than removing the account or its data (see
// [[manifest_backlog]] recoverable-delete pattern) -- signs out locally right
// after, so recovery is an admin-only action (a SQL update), not something
// reachable from inside the app once deleted.
function DangerZone({ session }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const deleteAccount = async () => {
    setDeleting(true);
    setError('');
    try {
      const { error: upsertError } = await supabase
        .from('user_settings')
        .upsert({ user_id: session.user.id, deleted_at: new Date().toISOString() });
      if (upsertError) throw upsertError;
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      setError(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${COLORS.line}` }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: COLORS.clay }}>
        Danger zone
      </h3>
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          style={{ background: 'none', border: `1px solid ${COLORS.clay}`, color: COLORS.clay, fontSize: 12.5, fontWeight: 600, padding: '7px 14px', borderRadius: 6 }}
        >
          Delete account
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ margin: 0, fontSize: 12.5, color: COLORS.inkDim }}>
            Your account will be locked and your data hidden immediately. This cannot be undone from within the app, but your account can be recovered by request to the Supabase admin within 30 days. After that, it and all its data are permanently deleted.
          </p>
          {error && <p style={{ margin: 0, color: COLORS.clay, fontSize: 12.5 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              style={{ background: 'none', border: `1px solid ${COLORS.line}`, color: COLORS.inkDim, fontSize: 12.5, fontWeight: 600, padding: '7px 14px', borderRadius: 6 }}
            >
              Cancel
            </button>
            <button
              onClick={deleteAccount}
              disabled={deleting}
              style={{ background: COLORS.clay, border: 'none', color: '#0E1416', fontSize: 12.5, fontWeight: 600, padding: '7px 14px', borderRadius: 6, opacity: deleting ? 0.6 : 1 }}
            >
              {deleting ? 'Deleting…' : 'Yes, delete my account'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
