"use client";

import { useEffect, useState } from "react";

import { getIntlLocale } from "../../lib/i18n";
import { useLanguage } from "../../components/LanguageProvider";
import { supabase } from "../../lib/supabaseClient";

const EMPTY_FORM = {
  name: "",
  message: "",
  wants_public: true,
};

function formatLetterDate(value, locale) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(getIntlLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function VisitorLettersPage() {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);
  const locale = language?.locale ?? "en";
  const [letters, setLetters] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [session, setSession] = useState(null);
  const [latestLetter, setLatestLetter] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminActioning, setAdminActioning] = useState(false);

  async function loadLetters() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("visitor_letters")
      .select("id, name, message, created_at")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Visitor Letters load error:", error);
      setLetters([]);
      setErrorMessage(error.message);
    } else {
      setLetters(data || []);
    }

    setLoading(false);
  }

  async function loadLatestLetter() {
    if (!session) {
      setLatestLetter(null);
      return;
    }

    setAdminLoading(true);

    const { data, error } = await supabase.auth.getSession();
    const accessToken = data?.session?.access_token;

    if (!accessToken) {
      setAdminLoading(false);
      setLatestLetter(null);
      return;
    }

    const response = await fetch("/api/letters/latest", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      const payload = await response.json();
      setLatestLetter(payload.letter || null);
    } else {
      setLatestLetter(null);
    }

    setAdminLoading(false);
  }

  useEffect(() => {
    loadLetters();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadLatestLetter();
    }
  }, [session]);

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function submitLetter(event) {
    event.preventDefault();

    setStatusMessage("");
    setErrorMessage("");

    const cleanName = form.name.trim() || t("letters.anonymous");
    const cleanMessage = form.message.trim();

    if (!cleanMessage) {
      setErrorMessage(t("letters.validationMessage"));
      return;
    }

    if (cleanName.length > 80) {
      setErrorMessage(t("letters.validationName"));
      return;
    }

    if (cleanMessage.length > 2000) {
      setErrorMessage(t("letters.validationLength"));
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase.from("visitor_letters").insert({
      name: cleanName,
      message: cleanMessage,
      wants_public: form.wants_public,
      is_public: form.wants_public,
    }).select("id").single();

    if (error) {
      console.error("Visitor Letter submit error:", error);
      setErrorMessage(error.message || t("letters.submitError"));
      setSubmitting(false);
      return;
    }

    setForm(EMPTY_FORM);
    setStatusMessage(t("letters.success"));
    await loadLetters();

    if (session) {
      await loadLatestLetter();
    }

    setSubmitting(false);
  }

  async function handleAdminAction(id, field, value) {
    if (!session) {
      return;
    }

    setAdminActioning(true);

    const { data, error } = await supabase.auth.getSession();
    const accessToken = data?.session?.access_token;

    if (!accessToken) {
      setAdminActioning(false);
      return;
    }

    const response = await fetch("/api/letters/latest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ id, field, value }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setErrorMessage(payload.error || t("letters.updateError"));
    } else {
      setStatusMessage(t("letters.updateSuccess"));
      await loadLetters();
      await loadLatestLetter();
    }

    setAdminActioning(false);
  }

  async function handleDelete(id) {
    if (!session) {
      return;
    }

    setAdminActioning(true);

    const { data, error } = await supabase.auth.getSession();
    const accessToken = data?.session?.access_token;

    if (!accessToken) {
      setAdminActioning(false);
      return;
    }

    const response = await fetch("/api/letters/latest", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setErrorMessage(payload.error || t("letters.deleteError"));
    } else {
      setStatusMessage(t("letters.deleteSuccess"));
      await loadLetters();
      await loadLatestLetter();
    }

    setAdminActioning(false);
  }

  return (
    <>
      <section className="panel">
        <p className="eyebrow">{t("letters.title")}</p>

        <h1>{t("letters.heading")}</h1>

        <p className="subtitle">
          {t("letters.subtitle")}
        </p>
      </section>

      <section className="panel">
        <h2>{t("letters.writeTitle")}</h2>

        <form onSubmit={submitLetter}>
          <div className="grid two">
            <label>
              {t("letters.name")}
              <input
                type="text"
                maxLength={80}
                placeholder={t("letters.anonymous")}
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </label>
          </div>

          <label>
            {t("letters.message")}
            <textarea
              rows={8}
              maxLength={2000}
              placeholder={t("letters.placeholder")}
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
            />
          </label>

          <p className="muted">{form.message.length}/2000</p>

          <div className="radio-group" role="radiogroup" aria-label={t("letters.visibility")}> 
            <label className="radio-option">
              <input
                type="radio"
                name="letter-visibility"
                checked={form.wants_public}
                onChange={() => updateField("wants_public", true)}
              />
              <span>
                <strong>{t("letters.public")}</strong>
                {t("letters.publicHelp")}
              </span>
            </label>

            <label className="radio-option">
              <input
                type="radio"
                name="letter-visibility"
                checked={!form.wants_public}
                onChange={() => updateField("wants_public", false)}
              />
              <span>
                <strong>{t("letters.private")}</strong>
                {t("letters.privateHelp")}
              </span>
            </label>
          </div>

          <div className="actions">
            <button className="primary" type="submit" disabled={submitting}>
              {submitting ? t("letters.sending") : t("letters.send")}
            </button>
          </div>
        </form>

        {statusMessage ? <p className="status success">{statusMessage}</p> : null}
        {errorMessage ? <p className="status error">{errorMessage}</p> : null}
      </section>

      {session ? (
        <section className="panel">
          <div className="entry-head">
            <div>
              <p className="eyebrow">{t("letters.latest")}</p>
              <h2>{t("letters.ownerView")}</h2>
            </div>
          </div>

          {adminLoading ? <p className="muted">{t("letters.latestLoading")}</p> : null}

          {!adminLoading && latestLetter ? (
            <div className="admin-card">
              <p className="visitor-letter-message">{latestLetter.message}</p>

              <div className="visitor-letter-meta">
                <span>— {latestLetter.name || t("letters.anonymous")}</span>
                <span className="muted">{formatLetterDate(latestLetter.created_at, locale)}</span>
              </div>

              <p className="muted">
                {t("letters.status")}: {latestLetter.is_public ? t("letters.publicStatus") : t("letters.privateStatus")} · {t("letters.wantsPublic")}: {latestLetter.wants_public ? t("letters.yes") : t("letters.no")}
              </p>

              <div className="admin-actions">
                <button type="button" disabled={adminActioning} onClick={() => handleAdminAction(latestLetter.id, "is_public", true)}>
                  {t("letters.makePublic")}
                </button>
                <button type="button" disabled={adminActioning} onClick={() => handleAdminAction(latestLetter.id, "is_public", false)}>
                  {t("letters.makePrivate")}
                </button>
                <button type="button" disabled={adminActioning} onClick={() => handleDelete(latestLetter.id)}>
                  {t("letters.delete")}
                </button>
              </div>
            </div>
          ) : null}

          {!adminLoading && !latestLetter ? <p className="muted">{t("letters.latestEmpty")}</p> : null}
        </section>
      ) : null}

      <section className="panel">
        <div className="entry-head">
          <div>
            <p className="eyebrow">{t("letters.publicLetters")}</p>
            <h2>{t("letters.publicLettersSub")}</h2>
          </div>
        </div>

        {loading ? <p className="muted">{t("letters.loading")}</p> : null}

        {!loading && !letters.length ? <p className="muted">{t("letters.empty")}</p> : null}

        {!loading && letters.length > 0 ? (
          <div className="visitor-letter-list">
            {letters.map((letter) => (
              <article className="visitor-letter" key={letter.id}>
                <p className="visitor-letter-message">{letter.message}</p>

                <div className="visitor-letter-meta">
                  <span>— {letter.name || t("letters.anonymous")}</span>
                  <span className="muted">{formatLetterDate(letter.created_at, locale)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}