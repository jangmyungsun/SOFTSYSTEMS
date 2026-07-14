"use client";

import { useState } from "react";

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),

  is_public: true,

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

  learning: {
    time: "",
    subject: "",
  },

  observation: "",
  alignment: "",
  tomorrow: [],

  media: [],

  environment: {},
};

function textToLines(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function linesToText(lines) {
  return Array.isArray(lines) ? lines.join("\n") : String(lines || "");
}

function parseLearning(initial) {
  const first = initial?.learning?.[0] || "";

  const match = String(first).match(
    /^\s*(\d+(?:\.\d+)?\s*(?:h|hr|hrs|hour|hours|m|min|mins|minute|minutes))\s*(?:—|-|:)?\s*(.*)$/i
  );

  if (!match) {
    return {
      learning_time: "",
      learning_subject: first,
    };
  }

  return {
    learning_time: match[1] || "",
    learning_subject: match[2] || "",
  };
}

function prepareInitialForm(initial) {
  if (!initial) return emptyForm;

  const learning = parseLearning(initial);

  return {
    ...emptyForm,
    ...initial,

    state: {
      ...emptyForm.state,
      ...(initial.state || {}),
    },

    work: {
      ...emptyForm.work,
      ...(initial.work || {}),
    },

    learning_time: learning.learning_time,
    learning_subject: learning.learning_subject,

    media: initial.media || [],
    tomorrow: initial.tomorrow || [],
  };
}

export default function LogForm({ initial, onSubmit }) {
  const [form, setForm] = useState(() => prepareInitialForm(initial));

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

      /*
       * 현재 데이터베이스 호환성을 위해 mode 값은 유지한다.
       * Daily 화면에서는 따로 입력받지 않고 기본값으로 저장한다.
       */
      pace: initial?.pace || "Normal",

      state: {
        body_state: form.state.body_state,
        energy: form.state.energy,
        mood: form.state.mood,
        weight: form.state.weight,
        temperature: form.state.temperature,

        /*
         * 자동 날씨 연동 전까지 기존 환경 데이터가 있다면 보존한다.
         */
        weather: initial?.state?.weather || "",
        weather_temperature:
          initial?.state?.weather_temperature || "",
        humidity: initial?.state?.humidity || "",
        pressure: initial?.state?.pressure || "",
        wind: initial?.state?.wind || "",
        sunrise: initial?.state?.sunrise || "",
        sunset: initial?.state?.sunset || "",
      },

      /*
       * 기존 field_logs 테이블과의 호환을 위해
       * Making 데이터는 work 안에 저장한다.
       */
      work: {
        time: form.work.time,
        project: form.work.project,
        items: textToLines(form.work.items),
      },

      /*
       * 기존 데이터 분석 함수가 시간을 읽을 수 있도록
       * "1h — Coding" 형식으로 저장한다.
       */
      learning: learningEntry ? [learningEntry] : [],

      /*
       * 실제 파일 업로드는 Supabase Storage 연결 단계에서 추가한다.
       * 현재는 기존 media 데이터를 보존한다.
       */
      media: form.media || [],

      /*
       * 기존 body 배열은 예전 기록의 호환을 위해 유지한다.
       */
      body: initial?.body || [],

      /*
       * Nourishment 입력은 제거하지만 기존 값은 삭제하지 않는다.
       */
      nourishment: initial?.nourishment || {},

      observation: form.observation,
      alignment: form.alignment,
      tomorrow: textToLines(form.tomorrow),

      is_public: form.is_public,
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
              updateField("date", event.target.value)
            }
          />
        </label>

        <label>
          Visibility
          <select
            value={form.is_public ? "public" : "private"}
            onChange={(event) =>
              updateField(
                "is_public",
                event.target.value === "public"
              )
            }
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
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
            value={form.state.body_state}
            onChange={(event) =>
              updateState("body_state", event.target.value)
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
            value={form.state.energy}
            onChange={(event) =>
              updateState("energy", event.target.value)
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
            value={form.state.mood}
            onChange={(event) =>
              updateState("mood", event.target.value)
            }
          />
        </label>

        <label>
          Weight
          <input
            type="number"
            step="0.1"
            placeholder="Optional"
            value={form.state.weight}
            onChange={(event) =>
              updateState("weight", event.target.value)
            }
          />
        </label>

        <label>
          Body Temperature
          <input
            type="number"
            step="0.01"
            placeholder="Optional"
            value={form.state.temperature}
            onChange={(event) =>
              updateState("temperature", event.target.value)
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
            value={form.work.time}
            onChange={(event) =>
              updateWork("time", event.target.value)
            }
          />
        </label>

        <label>
          Project
          <input
            type="text"
            placeholder="Project name"
            value={form.work.project}
            onChange={(event) =>
              updateWork("project", event.target.value)
            }
          />
        </label>
      </div>

      <label>
        Making Notes
        <textarea
          placeholder="One item per line"
          value={linesToText(form.work.items)}
          onChange={(event) =>
            updateWork("items", event.target.value)
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
            value={form.learning_time}
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
            value={form.learning_subject}
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
          value={form.observation}
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
          value={form.alignment}
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
          value={linesToText(form.tomorrow)}
          onChange={(event) =>
            updateField(
              "tomorrow",
              event.target.value
            )
          }
        />
      </label>

      <div className="actions">
        <button className="primary" type="submit">
          Save Daily
        </button>
      </div>
    </form>
  );
}
