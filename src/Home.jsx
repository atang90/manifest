import React, { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { supabase } from './supabaseClient';
import { COLORS } from './theme';
import { GlobalStyles, useDragReorder } from './ui';
import Contacts from './Providers';
import TrackedItems from './TrackedItems';
import Notes from './Notes';
import Profile from './Profile';

const DEFAULT_TABS = [
  { key: 'contacts', label: 'Contacts' },
  { key: 'tracked', label: 'Tracked Items' },
  { key: 'notes', label: 'Notes' },
];

// Tab order is synced per-user via Supabase (not per-device localStorage),
// so it stays consistent across browsers/devices.
function tabsFromOrder(saved) {
  if (!Array.isArray(saved)) return DEFAULT_TABS;
  const byKey = Object.fromEntries(DEFAULT_TABS.map((t) => [t.key, t]));
  const ordered = saved.map((k) => byKey[k]).filter(Boolean);
  const missing = DEFAULT_TABS.filter((t) => !saved.includes(t.key));
  return [...ordered, ...missing];
}

export default function Home({ session }) {
  const [tab, setTab] = useState(null);
  const [tabs, setTabs] = useState(null); // null = still loading from Supabase
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('user_settings')
      .select('tab_order')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const loaded = tabsFromOrder(data?.tab_order);
        setTabs(loaded);
        setTab(loaded[0].key);
      });
    return () => { cancelled = true; };
  }, [session.user.id]);

  const persistTabOrder = (next) => {
    supabase
      .from('user_settings')
      .upsert({ user_id: session.user.id, tab_order: next.map((t) => t.key) })
      .then(({ error }) => {
        if (error) console.error('Failed to save tab order:', error);
      });
  };

  const { handleDragStart, handleDragOver, handleDrop } = useDragReorder(
    tabs || [],
    setTabs,
    persistTabOrder
  );

  const signOut = () => supabase.auth.signOut({ scope: 'local' });

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', fontFamily: "'Inter', ui-sans-serif, system-ui", color: COLORS.ink }}>
      <GlobalStyles />

      <header style={{ borderBottom: `1px solid ${COLORS.line}`, padding: '24px 24px 0', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => setShowProfile(true)}
            title="Profile"
            style={{ margin: 0, color: COLORS.inkDim, fontSize: 13, wordBreak: 'break-all', background: 'none', border: 'none', padding: 0, textAlign: 'left', textDecoration: 'underline', textDecorationColor: 'transparent', textUnderlineOffset: 3 }}
            onMouseEnter={(e) => { e.currentTarget.style.textDecorationColor = COLORS.inkDim; }}
            onMouseLeave={(e) => { e.currentTarget.style.textDecorationColor = 'transparent'; }}
          >
            {session.user.email}
          </button>
          <button
            onClick={signOut}
            title="Sign out"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, padding: '6px 12px', borderRadius: 6, border: `1px solid ${COLORS.line}`, background: 'transparent', color: COLORS.inkDim }}
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
        <nav style={{ display: 'flex', gap: 4, marginTop: 18 }}>
          {tabs === null ? (
            <p style={{ margin: '9px 0', color: COLORS.inkDim, fontSize: 13 }}>Loading…</p>
          ) : (
            tabs.map((t, i) => (
              <button
                key={t.key}
                draggable
                onDragStart={handleDragStart(i)}
                onDragOver={handleDragOver}
                onDrop={handleDrop(i)}
                onClick={() => setTab(t.key)}
                title="Drag to reorder"
                style={{
                  fontSize: 13.5, fontWeight: 600, padding: '9px 4px', marginRight: 18, cursor: 'pointer',
                  background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.key ? COLORS.accent : 'transparent'}`,
                  color: tab === t.key ? COLORS.ink : COLORS.inkDim,
                }}
              >
                {t.label}
              </button>
            ))
          )}
        </nav>
      </header>

      {tabs !== null && (
        <main style={{ maxWidth: 720, margin: '0 auto', padding: '22px 24px 80px' }}>
          {tab === 'contacts' && <Contacts session={session} />}
          {tab === 'tracked' && <TrackedItems session={session} />}
          {tab === 'notes' && <Notes session={session} />}
        </main>
      )}

      {showProfile && <Profile session={session} onClose={() => setShowProfile(false)} />}
    </div>
  );
}
