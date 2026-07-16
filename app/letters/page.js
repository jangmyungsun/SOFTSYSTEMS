"use client";

import { useEffect, useState } from "react";

import { supabase } from "../../lib/supabaseClient";

const EMPTY_FORM = {
  name: "",
  message: "",
  wants_public: true,
};

function formatLetterDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function VisitorLettersPage() {
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

    const response = await fetch("/api/letters", {
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

    const cleanName = form.name.trim() || "Anonymous";
    const cleanMessage = form.message.trim();

    if (!cleanMessage) {
      setErrorMessage("Please write a message before sending.");
      return;
    }

    if (cleanName.length > 80) {
      setErrorMessage("The name must be 80 characters or fewer.");
      return;
    }

    if (cleanMessage.length > 2000) {
      setErrorMessage("The letter must be 2,000 characters or fewer.");
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
      setErrorMessage(error.message || "The letter could not be sent.");
      setSubmitting(false);
      return;
    }

    setForm(EMPTY_FORM);
    setStatusMessage("Your letter has been sent.");
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

    const response = await fetch("/api/letters", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ id, field, value }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setErrorMessage(payload.error || "The update could not be completed.");
    } else {
      setStatusMessage("The letter status has been updated.");
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
    const { error } = await supabase.from("visitor_letters").delete().eq("id", id);

    if (error) {
      setErrorMessage(error.message || "The letter could not be deleted.");
    } else {
      setStatusMessage("The letter has been deleted.");
      await loadLetters();
      await loadLatestLetter();
    }

    setAdminActioning(false);
  }

  return (
    <>
      <section className="panel">
        <p className="eyebrow">Visitor Letters</p>

        <h1>Leave a letter for the system</h1>

        <p className="subtitle">
          A place for responses, traces, questions, and small messages from visitors.
        </p>
      </section>

      <section className="panel">
        <h2>Write a Letter</h2>

        <form onSubmit={submitLetter}>
          <div className="grid two">
            <label>
              Name
              <input
                type="text"
                maxLength={80}
                placeholder="Anonymous"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </label>
          </div>

          <label>
            Message
            <textarea
              rows={8}
              maxLength={2000}
              placeholder="Write a letter..."
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
            />
          </label>

          <p className="muted">{form.message.length}/2000</p>

          <div className="radio-group" role="radiogroup" aria-label="Letter visibility">
            <label className="radio-option">
              <input
                type="radio"
                name="letter-visibility"
                checked={form.wants_public}
                onChange={() => updateField("wants_public", true)}
              />
              <span>
                <strong>Public</strong>
                This letter may be shown on the Visitor Letters page.
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
                <strong>Private</strong>
                This letter will only be visible to the logged-in owner.
              </span>
            </label>
          </div>

          <div className="actions">
            <button className="primary" type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Send Letter"}
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
              <p className="eyebrow">Latest Incoming Letter</p>
              <h2>Owner view</h2>
            </div>
          </div>

          {adminLoading ? <p className="muted">Loading latest letter…</p> : null}

          {!adminLoading && latestLetter ? (
            <div className="admin-card">
              <p className="visitor-letter-message">{latestLetter.message}</p>

              <div className="visitor-letter-meta">
                <span>— {latestLetter.name || "Anonymous"}</span>
                <span className="muted">{formatLetterDate(latestLetter.created_at)}</span>
              </div>

              <p className="muted">
                Status: {latestLetter.is_public ? "Public" : "Private"} · Wants public: {latestLetter.wants_public ? "Yes" : "No"}
              </p>

              <div className="admin-actions">
                <button type="button" disabled={adminActioning} onClick={() => handleAdminAction(latestLetter.id, "is_public", true)}>
                  Make Public
                </button>
                <button type="button" disabled={adminActioning} onClick={() => handleAdminAction(latestLetter.id, "is_public", false)}>
                  Make Private
                </button>
                <button type="button" disabled={adminActioning} onClick={() => handleDelete(latestLetter.id)}>
                  Delete
                </button>
              </div>
            </div>
          ) : null}

          {!adminLoading && !latestLetter ? <p className="muted">No letters yet.</p> : null}
        </section>
      ) : null}

      <section className="panel">
        <div className="entry-head">
          <div>
            <p className="eyebrow">Public Letters</p>
            <h2>Letters left behind</h2>
          </div>
        </div>

        {loading ? <p className="muted">Loading letters…</p> : null}

        {!loading && !letters.length ? <p className="muted">No public letters yet.</p> : null}

        {!loading && letters.length > 0 ? (
          <div className="visitor-letter-list">
            {letters.map((letter) => (
              <article className="visitor-letter" key={letter.id}>
                <p className="visitor-letter-message">{letter.message}</p>

                <div className="visitor-letter-meta">
                  <span>— {letter.name || "Anonymous"}</span>
                  <span className="muted">{formatLetterDate(letter.created_at)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}