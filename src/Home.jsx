import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { supabase } from './supabaseClient';
import { COLORS } from './theme';
import { GlobalStyles } from './ui';
import Contacts from './Providers';
import TrackedItems from './TrackedItems';

const TABS = [
  { key: 'contacts', label: 'Contacts' },
  { key: 'tracked', label: 'Tracked Items' },
];

export default function Home({ session }) {
  const [tab, setTab] = useState('contacts');

  const signOut = () => supabase.auth.signOut();

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', fontFamily: "'Inter', ui-sans-serif, system-ui", color: COLORS.ink }}>
      <GlobalStyles />

      <header style={{ borderBottom: `1px solid ${COLORS.line}`, padding: '24px 24px 0', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ margin: 0, color: COLORS.inkDim, fontSize: 13, wordBreak: 'break-all' }}>{session.user.email}</p>
          <button
            onClick={signOut}
            title="Sign out"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, padding: '6px 12px', borderRadius: 6, border: `1px solid ${COLORS.line}`, background: 'transparent', color: COLORS.inkDim }}
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
        <nav style={{ display: 'flex', gap: 4, marginTop: 18 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                fontSize: 13.5, fontWeight: 600, padding: '9px 4px', marginRight: 18,
                background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.key ? COLORS.accent : 'transparent'}`,
                color: tab === t.key ? COLORS.ink : COLORS.inkDim,
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '22px 24px 80px' }}>
        {tab === 'contacts' && <Contacts session={session} />}
        {tab === 'tracked' && <TrackedItems session={session} />}
      </main>
    </div>
  );
}
