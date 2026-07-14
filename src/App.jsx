import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { COLORS } from './theme';
import Auth from './Auth';
import Home from './Home';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{ background: COLORS.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.inkDim, fontFamily: 'ui-sans-serif' }}>
        Loading…
      </div>
    );
  }

  return session ? <Home session={session} /> : <Auth />;
}
