'use client';

import { useEffect, useState } from 'react';

import { useLanguage } from '../../components/LanguageProvider';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);
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
      <h2>{session ? t('login.account') : t('login.title')}</h2>

      {session ? (
        <>
          <p>{t('login.signedIn')} {session.user.email}</p>
          <div className="actions">
            <button onClick={signOut}>{t('login.signOut')}</button>
          </div>
        </>
      ) : (
        <>
          <p className="muted">{t('login.instructions')}</p>

          <div className="grid two">
            <label>
              {t('login.email')}
              <input value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>

            <label>
              {t('login.password')}
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
          </div>

          <div className="actions">
            <button className="primary" onClick={signIn}>{t('login.signIn')}</button>
          </div>

          {feedback ? <p className="status error">{feedback}</p> : null}
        </>
      )}
    </section>
  );
}
