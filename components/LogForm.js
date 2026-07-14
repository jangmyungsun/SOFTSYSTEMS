"use client";

import { useState } from "react";

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),

  state: {
    body_state: "",
    energy: "",
    mood: "",
    weight: "",
    temperature: "",
  },

  work: {
    time: "",
    project: "",
    items: [],
  },

  learning_time: "",
  learning_subject: "",

  observation: "",
  alignment: "",
  tomorrow: [],

  is_public: true,
};

function textToLines(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function linesToText(lines) {
  if (Array.isArray(lines)) {
    return lines.join("\n");
  }

  return String(lines || "");
}

function parseLearning(initial) {
  const firstEntry =
    Array.isArray(initial?.learning) &&
    initial.learning.length > 0
      ? initial.learning[0]
      : "";

  const match = String(firstEntry).match(
    /^\s*(\d+(?:\.\d+)?\s*(?:h|hr|hrs|hour|hours|m|min|mins|minute|minutes))\s*(?:—|-|:)?\s*(.*)$/i
  );

  if (!match) {
    return {
      learning_time: "",
      learning_subject: firstEntry,
    };
  }

  return {
    learning_time: match[1] || "",
    learning_subject: match[2] || "",
  };
}

function prepareInitialForm(initial) {
  if (!initial) {
    return structuredClone(emptyForm);
  }

  const learning = parseLearning(initial);

  return {
    ...structuredClone(emptyForm),
    ...initial,

    state: {
      ...emptyForm.state,
      ...(initial.state || {}),
    },

    work: {
      ...emptyForm.work,
      ...(initial.work || {}),
      items: Array.isArray(initial.work?.items)
        ? initial.work.items
        : [],
    },

    learning_time: learning.learning_time,
    learning_subject: learning.learning_subject,

    tomorrow: Array.isArray(initial.tomorrow)
      ? initial.tomorrow
      : [],

    is_public: true,
  };
}

export default function LogForm({
  initial,
  onSubmit,
}) {
  const [form, setForm] = useState(() =>
    prepareInitialForm(initial)
  );

  const updateField = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const updateState = (key, value) => {
    setForm((previous) => ({
      ...previous,
      state: {
        ...previous.state,
        [key]: value,
      },
    }));
  };

  const updateWork = (key, value) => {
    setForm((previous) => ({
      ...previous,
      work: {
        ...previous.work,
        [key]: value,
      },
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const learningEntry = [
      form.learning_time,
      form.learning_subject,
    ]
      .filter(Boolean)
      .join(" — ");

    const payload = {
      date: form.date,

      pace: initial?.pace || "Normal",

      state: {
        body_state:
          form.state.body_state,

        energy:
          form.state.energy,

        mood:
          form.state.mood,

        weight:
          form.state.weight,

        temperature:
          form.state.temperature,

        weather:
          initial?.state?.weather ||
          "",

        weather_temperature:
          initial?.state
            ?.weather_temperature ||
          "",

        humidity:
          initial?.state?.humidity ||
          "",

        pressure:
          initial?.state?.pressure ||
          "",

        wind:
          initial?.state?.wind ||
          "",

        sunrise:
          initial?.state?.sunrise ||
          "",

        sunset:
          initial?.state?.sunset ||
          "",
      },

      work: {
        time: form.work.time,
        project: form.work.project,
        items: textToLines(
          form.work.items
        ),
      },

      learning: learningEntry
        ? [learningEntry]
        : [],

      body:
        initial?.body || [],

      nourishment:
        initial?.nourishment || {},

      media:
        initial?.media || [],

      observation:
        form.observation,

      alignment:
        form.alignment,

      tomorrow:
        textToLines(form.tomorrow),

      is_public: true,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid two">
        <label>
          Date

          <input
            type="date"
            value={form.date}
            onChange={(event) =>
              updateField(
                "date",
                event.target.value
              )
            }
          />
        </label>
      </div>

      <h2>Body</h2>

      <div className="grid three">
        <label>
          Body State

          <input
            type="number"
            min="1"
            max="10"
            step="1"
            placeholder="1–10"
            value={
              form.state.body_state
            }
            onChange={(event) =>
              updateState(
                "body_state",
                event.target.value
              )
            }
          />
        </label>

        <label>
          Energy

          <input
            type="number"
            min="1"
            max="10"
            step="1"
            placeholder="1–10"
            value={
              form.state.energy
            }
            onChange={(event) =>
              updateState(
                "energy",
                event.target.value
              )
            }
          />
        </label>

        <label>
          Mood

          <input
            type="number"
            min="1"
            max="10"
            step="1"
            placeholder="1–10"
            value={
              form.state.mood
            }
            onChange={(event) =>
              updateState(
                "mood",
                event.target.value
              )
            }
          />
        </label>

        <label>
          Weight

          <input
            type="number"
            step="0.1"
            placeholder="Optional"
            value={
              form.state.weight
            }
            onChange={(event) =>
              updateState(
                "weight",
                event.target.value
              )
            }
          />
        </label>

        <label>
          Body Temperature

          <input
            type="number"
            step="0.01"
            placeholder="Optional"
            value={
              form.state.temperature
            }
            onChange={(event) =>
              updateState(
                "temperature",
                event.target.value
              )
            }
          />
        </label>
      </div>

      <h2>Practice</h2>

      <h3>Making</h3>

      <div className="grid two">
        <label>
          Time

          <input
            type="text"
            placeholder="Example: 2h 30m"
            value={
              form.work.time
            }
            onChange={(event) =>
              updateWork(
                "time",
                event.target.value
              )
            }
          />
        </label>

        <label>
          Project

          <input
            type="text"
            placeholder="Project name"
            value={
              form.work.project
            }
            onChange={(event) =>
              updateWork(
                "project",
                event.target.value
              )
            }
          />
        </label>
      </div>

      <label>
        Making Notes

        <textarea
          placeholder="One item per line"
          value={linesToText(
            form.work.items
          )}
          onChange={(event) =>
            updateWork(
              "items",
              event.target.value
            )
          }
        />
      </label>

      <h3>Learning</h3>

      <div className="grid two">
        <label>
          Time

          <input
            type="text"
            placeholder="Example: 1h"
            value={
              form.learning_time
            }
            onChange={(event) =>
              updateField(
                "learning_time",
                event.target.value
              )
            }
          />
        </label>

        <label>
          Subject

          <input
            type="text"
            placeholder="English, coding, reading..."
            value={
              form.learning_subject
            }
            onChange={(event) =>
              updateField(
                "learning_subject",
                event.target.value
              )
            }
          />
        </label>
      </div>

      <h2>Notes</h2>

      <label>
        Observation

        <textarea
          value={
            form.observation
          }
          onChange={(event) =>
            updateField(
              "observation",
              event.target.value
            )
          }
        />
      </label>

      <label>
        Alignment

        <textarea
          value={
            form.alignment
          }
          onChange={(event) =>
            updateField(
              "alignment",
              event.target.value
            )
          }
        />
      </label>

      <label>
        Tomorrow

        <textarea
          placeholder="One item per line"
          value={linesToText(
            form.tomorrow
          )}
          onChange={(event) =>
            updateField(
              "tomorrow",
              event.target.value
            )
          }
        />
      </label>

      <div className="actions">
        <button
          className="primary"
          type="submit"
        >
          Save Daily
        </button>
      </div>
    </form>
  );
}
