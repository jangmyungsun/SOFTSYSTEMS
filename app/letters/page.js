"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../../lib/supabaseClient";

const EMPTY_FORM = {
  name: "",
  message: "",
  wants_public: true,
};

function formatLetterDate(value) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
}

export default function VisitorLettersPage() {
  const [
    letters,
    setLetters,
  ] = useState([]);

  const [
    form,
    setForm,
  ] = useState(
    EMPTY_FORM
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    statusMessage,
    setStatusMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  async function loadLetters() {
    setLoading(true);
    setErrorMessage("");

    const {
      data,
      error,
    } = await supabase
      .from(
        "visitor_letters"
      )
      .select(
        `
          id,
          name,
          message,
          created_at
        `
      )
      .eq(
        "is_public",
        true
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (error) {
      console.error(
        "Visitor Letters load error:",
        error
      );

      setLetters([]);

      setErrorMessage(
        error.message
      );
    } else {
      setLetters(
        data || []
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadLetters();
  }, []);

  function updateField(
    key,
    value
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]:
          value,
      })
    );
  }

  async function submitLetter(
    event
  ) {
    event.preventDefault();

    setStatusMessage("");
    setErrorMessage("");

    const cleanName =
      form.name.trim() ||
      "Anonymous";

    const cleanMessage =
      form.message.trim();

    if (!cleanMessage) {
      setErrorMessage(
        "Please write a message before sending."
      );

      return;
    }

    if (
      cleanName.length >
      80
    ) {
      setErrorMessage(
        "The name must be 80 characters or fewer."
      );

      return;
    }

    if (
      cleanMessage.length >
      2000
    ) {
      setErrorMessage(
        "The letter must be 2,000 characters or fewer."
      );

      return;
    }

    setSubmitting(true);

    const {
      error,
    } = await supabase
      .from(
        "visitor_letters"
      )
      .insert({
        name:
          cleanName,

        message:
          cleanMessage,

        wants_public:
          form.wants_public,

        is_public:
          false,
      });

    if (error) {
      console.error(
        "Visitor Letter submit error:",
        error
      );

      setErrorMessage(
        error.message ||
          "The letter could not be sent."
      );

      setSubmitting(false);

      return;
    }

    setForm(
      EMPTY_FORM
    );

    setStatusMessage(
      form.wants_public
        ? "Your letter has been sent. It may appear here after review."
        : "Your private letter has been sent."
    );

    setSubmitting(false);
  }

  return (
    <>
      <section className="panel">
        <p className="eyebrow">
          Visitor Letters
        </p>

        <h1>
          Leave a letter for
          the system
        </h1>

        <p className="subtitle">
          A place for responses,
          traces, questions, and
          small messages from
          visitors.
        </p>
      </section>

      <section className="panel">
        <h2>
          Write a Letter
        </h2>

        <form
          onSubmit={
            submitLetter
          }
        >
          <div className="grid two">
            <label>
              Name

              <input
                type="text"
                maxLength={80}
                placeholder="Anonymous"
                value={
                  form.name
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "name",
                    event.target
                      .value
                  )
                }
              />
            </label>
          </div>

          <label>
            Message

            <textarea
              rows={8}
              maxLength={2000}
              placeholder="Write a letter..."
              value={
                form.message
              }
              onChange={(
                event
              ) =>
                updateField(
                  "message",
                  event.target
                    .value
                )
              }
            />
          </label>

          <p className="muted">
            {
              form.message
                .length
            }
            /2000
          </p>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={
                form.wants_public
              }
              onChange={(
                event
              ) =>
                updateField(
                  "wants_public",
                  event.target
                    .checked
                )
              }
            />

            <span>
              This letter may
              appear publicly
              after review.
            </span>
          </label>

          <div className="actions">
            <button
              className="primary"
              type="submit"
              disabled={
                submitting
              }
            >
              {submitting
                ? "Sending…"
                : "Send Letter"}
            </button>
          </div>
        </form>

        {statusMessage && (
          <p className="muted">
            {statusMessage}
          </p>
        )}

        {errorMessage && (
          <p className="muted">
            {errorMessage}
          </p>
        )}
      </section>

      <section className="panel">
        <div className="entry-head">
          <div>
            <p className="eyebrow">
              Public Letters
            </p>

            <h2>
              Letters left
              behind
            </h2>
          </div>
        </div>

        {loading && (
          <p className="muted">
            Loading letters…
          </p>
        )}

        {!loading &&
          !letters.length && (
          <p className="muted">
            No public letters
            yet.
          </p>
        )}

        {!loading &&
          letters.length >
            0 && (
          <div className="visitor-letter-list">
            {letters.map(
              (letter) => (
                <article
                  className="visitor-letter"
                  key={
                    letter.id
                  }
                >
                  <p className="visitor-letter-message">
                    {
                      letter.message
                    }
                  </p>

                  <div className="visitor-letter-meta">
                    <span>
                      —{" "}
                      {letter.name ||
                        "Anonymous"}
                    </span>

                    <span className="muted">
                      {formatLetterDate(
                        letter.created_at
                      )}
                    </span>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </>
  );
}