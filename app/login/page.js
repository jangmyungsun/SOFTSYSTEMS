'use client';

import { useEffect, useState } from 'react';

import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_e, nextSession) => {
      setSession(nextSession);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    setFeedback('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setFeedback(error.message);
      return;
    }

    window.location.href = '/letters';
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setFeedback('');
  };

  return (
    <section className="panel">
      <h2>{session ? 'Account' : 'Login'}</h2>

      {session ? (
        <>
          <p>Signed in as {session.user.email}</p>
          <div className="actions">
            <button onClick={signOut}>Sign out</button>
          </div>
        </>
      ) : (
        <>
          <p className="muted">Use the owner account created in Supabase Auth.</p>

          <div className="grid two">
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>

            <label>
              Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
          </div>

          <div className="actions">
            <button className="primary" onClick={signIn}>Sign in</button>
          </div>

          {feedback ? <p className="status error">{feedback}</p> : null}
        </>
      )}
    </section>
  );
}
