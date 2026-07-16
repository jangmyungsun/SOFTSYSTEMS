"use client";

import { useState } from "react";

import { useLanguage } from "./LanguageProvider";

const MOVEMENT_TYPES = [
  "yoga",
  "walking",
  "running",
  "stretching",
  "strength",
  "dance",
  "swimming",
  "cycling",
  "performance",
  "housework",
  "other",
];

const ARTISTIC_TYPES = [
  "book",
  "film",
  "performance",
  "exhibition",
  "music",
  "other",
];

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm = {
  date: getTodayString(),
  state: {
    body_state: "",
    breathing_state: "",
    energy: "",
    mood: "",
    weight: "",
    temperature: "",
  },
  movement: {
    type: "",
    time: "",
    intensity: "",
    notes: "",
  },
  work: {
    time: "",
    project: "",
    items: [],
  },
  learning_time: "",
  learning_subject: "",
  artistic_input: {
    type: "",
    title: "",
    creator: "",
    note: "",
  },
  observation: "",
  alignment: "",
  tomorrow: [],
  is_public: true,
};

function makeEmptyForm() {
  return {
    ...emptyForm,
    state: { ...emptyForm.state },
    movement: { ...emptyForm.movement },
    work: { ...emptyForm.work, items: [] },
    artistic_input: { ...emptyForm.artistic_input },
    tomorrow: [],
  };
}

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
  const firstEntry = Array.isArray(initial?.learning) && initial.learning.length ? initial.learning[0] : "";
  const match = String(firstEntry).match(/^\s*(\d+(?:\.\d+)?\s*(?:h|hr|hrs|hour|hours|m|min|mins|minute|minutes))\s*(?:—|-|:)?\s*(.*)$/i);

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

function getSafeObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  return {};
}

function prepareInitialForm(initial) {
  if (!initial) {
    return makeEmptyForm();
  }

  const learning = parseLearning(initial);
  const movement = getSafeObject(initial.movement);
  const artisticInput = getSafeObject(initial.artistic_input);

  return {
    ...makeEmptyForm(),
    ...initial,
    state: {
      ...emptyForm.state,
      ...getSafeObject(initial.state),
    },
    movement: {
      ...emptyForm.movement,
      ...movement,
    },
    work: {
      ...emptyForm.work,
      ...getSafeObject(initial.work),
      items: Array.isArray(initial.work?.items) ? initial.work.items : [],
    },
    learning_time: learning.learning_time,
    learning_subject: learning.learning_subject,
    artistic_input: {
      ...emptyForm.artistic_input,
      ...artisticInput,
    },
    tomorrow: Array.isArray(initial.tomorrow) ? initial.tomorrow : [],
    is_public: true,
  };
}

export default function LogForm({
  initial,
  onSubmit,
  onDateChange,
}) {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);
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

  const updateMovement = (key, value) => {
    setForm((previous) => ({
      ...previous,
      movement: {
        ...previous.movement,
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

  const updateArtisticInput = (key, value) => {
    setForm((previous) => ({
      ...previous,
      artistic_input: {
        ...previous.artistic_input,
        [key]: value,
      },
    }));
  };

  const changeDate = (value) => {
    updateField("date", value);
    onDateChange?.(value);
  };

  const selectMovementType = (type) => {
    updateMovement("type", form.movement.type === type ? "" : type);
  };

  const selectArtisticType = (type) => {
    updateArtisticInput("type", form.artistic_input.type === type ? "" : type);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const learningEntry = [form.learning_time, form.learning_subject]
      .filter(Boolean)
      .join(" — ");

    const hasMovement =
      Boolean(form.movement.type) ||
      Boolean(form.movement.time) ||
      Boolean(form.movement.intensity) ||
      Boolean(form.movement.notes);

    const hasArtisticInput =
      Boolean(form.artistic_input.type) ||
      Boolean(form.artistic_input.title) ||
      Boolean(form.artistic_input.creator) ||
      Boolean(form.artistic_input.note);

    onSubmit({
      date: form.date,
      pace: initial?.pace || "normal",
      state: {
        body_state: form.state.body_state,
        breathing_state: form.state.breathing_state,
        energy: form.state.energy,
        mood: form.state.mood,
        weight: form.state.weight,
        temperature: form.state.temperature,
      },
      movement: hasMovement
        ? {
            type: form.movement.type,
            time: form.movement.time,
            intensity: form.movement.intensity,
            notes: form.movement.notes,
          }
        : {},
      work: {
        time: form.work.time,
        project: form.work.project,
        items: textToLines(form.work.items),
      },
      learning: learningEntry ? [learningEntry] : [],
      artistic_input: hasArtisticInput
        ? {
            type: form.artistic_input.type,
            title: form.artistic_input.title,
            creator: form.artistic_input.creator,
            note: form.artistic_input.note,
          }
        : {},
      body: initial?.body || [],
      nourishment: initial?.nourishment || {},
      media: initial?.media || [],
      observation: form.observation,
      alignment: form.alignment,
      tomorrow: textToLines(form.tomorrow),
      is_public: true,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid two">
        <label>
          {t("common.date")}
          <input
            type="date"
            value={form.date}
            onChange={(event) => changeDate(event.target.value)}
          />
        </label>
      </div>

      <h2>{t("common.body")}</h2>

      <div className="grid three">
        <label>
          {t("common.bodyState")}
          <input
            type="number"
            min="1"
            max="10"
            step="1"
            placeholder={t("logForm.scalePlaceholder")}
            value={form.state.body_state}
            onChange={(event) => updateState("body_state", event.target.value)}
          />
        </label>

        <label>
          {t("common.breathingState")}
          <input
            type="text"
            placeholder={t("logForm.breathingPlaceholder")}
            value={form.state.breathing_state}
            onChange={(event) => updateState("breathing_state", event.target.value)}
          />
        </label>

        <label>
          {t("common.energy")}
          <input
            type="number"
            min="1"
            max="10"
            step="1"
            placeholder={t("logForm.scalePlaceholder")}
            value={form.state.energy}
            onChange={(event) => updateState("energy", event.target.value)}
          />
        </label>

        <label>
          {t("common.mood")}
          <input
            type="number"
            min="1"
            max="10"
            step="1"
            placeholder={t("logForm.scalePlaceholder")}
            value={form.state.mood}
            onChange={(event) => updateState("mood", event.target.value)}
          />
        </label>

        <label>
          {t("common.weight")}
          <input
            type="number"
            step="0.1"
            placeholder={t("common.optional")}
            value={form.state.weight}
            onChange={(event) => updateState("weight", event.target.value)}
          />
        </label>

        <label>
          {t("common.bodyTemperature")}
          <input
            type="number"
            step="0.01"
            placeholder={t("common.optional")}
            value={form.state.temperature}
            onChange={(event) => updateState("temperature", event.target.value)}
          />
        </label>
      </div>

      <h2>{t("common.bodyMoving")}</h2>
      <h3>{t("common.type")}</h3>

      <div className="artistic-type-list">
        {MOVEMENT_TYPES.map((item) => {
          const checked = form.movement.type === item;

          return (
            <label className={checked ? "artistic-type selected" : "artistic-type"} key={item}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => selectMovementType(item)}
              />
              <span>{t(`movement.types.${item}`)}</span>
            </label>
          );
        })}
      </div>

      <div className="grid two">
        <label>
          {t("common.time")}
          <input
            type="text"
            placeholder={t("logForm.timeExampleShort")}
            value={form.movement.time}
            onChange={(event) => updateMovement("time", event.target.value)}
          />
        </label>

        <label>
          {t("common.bodyMovingIntensity")}
          <select
            value={form.movement.intensity}
            onChange={(event) => updateMovement("intensity", event.target.value)}
          >
            <option value="">{t("common.optional")}</option>
            <option value="1">{t("movement.intensity.1")}</option>
            <option value="2">{t("movement.intensity.2")}</option>
            <option value="3">{t("movement.intensity.3")}</option>
            <option value="4">{t("movement.intensity.4")}</option>
            <option value="5">{t("movement.intensity.5")}</option>
          </select>
        </label>
      </div>

      <label>
        {t("common.bodyMovingNotes")}
        <textarea
          placeholder={t("logForm.bodyMovingNotesPlaceholder")}
          value={form.movement.notes}
          onChange={(event) => updateMovement("notes", event.target.value)}
        />
      </label>

      <h2>{t("common.practice")}</h2>
      <h3>{t("common.making")}</h3>

      <div className="grid two">
        <label>
          {t("common.time")}
          <input
            type="text"
            placeholder={t("logForm.timeExampleLong")}
            value={form.work.time}
            onChange={(event) => updateWork("time", event.target.value)}
          />
        </label>

        <label>
          {t("common.project")}
          <input
            type="text"
            placeholder={t("logForm.projectPlaceholder")}
            value={form.work.project}
            onChange={(event) => updateWork("project", event.target.value)}
          />
        </label>
      </div>

      <label>
        {t("common.makingNotes")}
        <textarea
          placeholder={t("logForm.onePerLine")}
          value={linesToText(form.work.items)}
          onChange={(event) => updateWork("items", event.target.value)}
        />
      </label>

      <h3>{t("common.learning")}</h3>

      <div className="grid two">
        <label>
          {t("common.time")}
          <input
            type="text"
            placeholder={t("logForm.timeExampleLearning")}
            value={form.learning_time}
            onChange={(event) => updateField("learning_time", event.target.value)}
          />
        </label>

        <label>
          {t("common.learningSubject")}
          <input
            type="text"
            placeholder={t("logForm.learningPlaceholder")}
            value={form.learning_subject}
            onChange={(event) => updateField("learning_subject", event.target.value)}
          />
        </label>
      </div>

      <h2>{t("common.artisticInput")}</h2>
      <h3>{t("common.type")}</h3>

      <div className="artistic-type-list">
        {ARTISTIC_TYPES.map((item) => {
          const checked = form.artistic_input.type === item;

          return (
            <label className={checked ? "artistic-type selected" : "artistic-type"} key={item}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => selectArtisticType(item)}
              />
              <span>{t(`artistic.types.${item}`)}</span>
            </label>
          );
        })}
      </div>

      <div className="grid two">
        <label>
          {t("common.title")}
          <input
            type="text"
            placeholder={t("logForm.artisticTitlePlaceholder")}
            value={form.artistic_input.title}
            onChange={(event) => updateArtisticInput("title", event.target.value)}
          />
        </label>

        <label>
          {t("common.creator")}
          <input
            type="text"
            placeholder={t("logForm.creatorPlaceholder")}
            value={form.artistic_input.creator}
            onChange={(event) => updateArtisticInput("creator", event.target.value)}
          />
        </label>
      </div>

      <label>
        {t("common.referenceNote")}
        <textarea
          placeholder={t("logForm.referencePlaceholder")}
          value={form.artistic_input.note}
          onChange={(event) => updateArtisticInput("note", event.target.value)}
        />
      </label>

      <h2>{t("common.notes")}</h2>

      <label>
        {t("common.observation")}
        <textarea
          value={form.observation}
          onChange={(event) => updateField("observation", event.target.value)}
        />
      </label>

      <label>
        {t("common.alignment")}
        <textarea
          value={form.alignment}
          onChange={(event) => updateField("alignment", event.target.value)}
        />
      </label>

      <label>
        {t("common.tomorrow")}
        <textarea
          placeholder={t("logForm.onePerLine")}
          value={linesToText(form.tomorrow)}
          onChange={(event) => updateField("tomorrow", event.target.value)}
        />
      </label>

      <div className="actions">
        <button className="primary" type="submit">
          {t("common.saveDaily")}
        </button>
      </div>
    </form>
  );
}
