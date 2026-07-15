import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { COLORS } from './theme';
import Auth from './Auth';
import Home from './Home';

function FullScreenMessage({ children }) {
  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.inkDim, fontFamily: 'ui-sans-serif', textAlign: 'center', padding: 24 }}>
      {children}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const [checking, setChecking] = useState(false); // verifying deleted_at for the current session
  const [deletedNotice, setDeletedNotice] = useState(false); // sticky once true -- outlives the signOut below

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // A deleted account is just a flag on user_settings (see backlog: recoverable
  // delete) -- checked here, before Home ever mounts, so a deleted account's
  // data is never fetched or rendered.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setChecking(true);
    supabase
      .from('user_settings')
      .select('deleted_at')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.deleted_at) {
          setDeletedNotice(true);
          supabase.auth.signOut({ scope: 'local' });
        }
        setChecking(false);
      });
    return () => { cancelled = true; };
  }, [session]);

  if (deletedNotice) {
    return <FullScreenMessage>This account has been deleted.</FullScreenMessage>;
  }

  if (session === undefined || checking) {
    return <FullScreenMessage>Loading…</FullScreenMessage>;
  }

  return session ? <Home session={session} /> : <Auth />;
}
