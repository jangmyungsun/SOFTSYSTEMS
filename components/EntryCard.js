import TranslateButton from "./TranslateButton";
import { useLanguage } from "./LanguageProvider";

function toValueKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatLabel(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function translateValue(t, prefix, value) {
  const key = `${prefix}.${toValueKey(value)}`;
  const translated = t(key);

  return translated === key ? formatLabel(value) : translated;
}

function getSafeObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  return {};
}

export default function EntryCard({
  log,
  admin = false,
  onEdit,
  onDelete,
  onToggle,
}) {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);

  const environment = getSafeObject(log.environment);
  const state = getSafeObject(log.state);
  const movement = getSafeObject(log.movement);
  const work = getSafeObject(log.work);
  const artisticInput = getSafeObject(log.artistic_input);
  const aiAnalysis =
    log.ai_analysis &&
    typeof log.ai_analysis === "object" &&
    !Array.isArray(log.ai_analysis)
      ? log.ai_analysis
      : null;

  const weather = environment.weather || state.weather || "";
  const weatherTemperature = environment.temperature ?? state.weather_temperature ?? "";
  const humidity = environment.humidity ?? state.humidity ?? "";
  const pressure = environment.pressure ?? state.pressure ?? "";
  const wind = environment.wind ?? state.wind ?? "";
  const sunrise = environment.sunrise || state.sunrise || "";
  const sunset = environment.sunset || state.sunset || "";

  const temperatureUnit = environment.units?.temperature || "";
  const humidityUnit = environment.units?.humidity || "";
  const pressureUnit = environment.units?.pressure || "";
  const windUnit = environment.units?.wind || "";

  const learningItems = Array.isArray(log.learning) ? log.learning : [];
  const tomorrowItems = Array.isArray(log.tomorrow) ? log.tomorrow : [];
  const makingItems = Array.isArray(work.items) ? work.items : [];

  const hasBodyData =
    state.body_state !== "" ||
    Boolean(state.breathing_state) ||
    state.energy !== "" ||
    state.mood !== "" ||
    state.weight !== "" ||
    state.temperature !== "";

  const hasMovement =
    Boolean(movement.time) ||
    Boolean(movement.type) ||
    Boolean(movement.intensity) ||
    Boolean(movement.notes);

  const hasEnvironmentData =
    Boolean(weather) ||
    weatherTemperature !== "" ||
    humidity !== "" ||
    pressure !== "" ||
    wind !== "" ||
    Boolean(sunrise) ||
    Boolean(sunset);

  const hasMakingData = Boolean(work.time) || Boolean(work.project) || makingItems.length > 0;
  const hasArtisticInput =
    Boolean(artisticInput.type) ||
    Boolean(artisticInput.title) ||
    Boolean(artisticInput.creator) ||
    Boolean(artisticInput.note);

  return (
    <article className="entry">
      <div className="entry-head">
        <div>
          <p className="eyebrow">{t("common.daily")}</p>
          <div className="entry-date">{log.date}</div>
        </div>

        <div className="actions">
          {log.pace ? (
            <span className="pace">
              {t(`values.${toValueKey(log.pace)}`) !== `values.${toValueKey(log.pace)}`
                ? t(`values.${toValueKey(log.pace)}`)
                : log.pace}
            </span>
          ) : null}

          <span className="badge">{log.is_public ? t("common.public") : t("common.private")}</span>
        </div>
      </div>

      <div className="entry-grid">
        <section className="block">
          <p className="block-title">{t("common.body")}</p>

          {hasBodyData ? (
            <>
              {state.body_state !== "" ? <p>{t("common.bodyState")} {" — "}{state.body_state}</p> : null}
              {state.breathing_state ? <p>{t("common.breathingState")} {" — "}{state.breathing_state}</p> : null}
              {state.energy !== "" ? <p>{t("common.energy")} {" — "}{state.energy}</p> : null}
              {state.mood !== "" ? <p>{t("common.mood")} {" — "}{state.mood}</p> : null}
              {state.weight !== "" ? <p>{t("common.weight")} {" — "}{state.weight}</p> : null}
              {state.temperature !== "" ? <p>{t("common.bodyTemperature")} {" — "}{state.temperature}</p> : null}
            </>
          ) : (
            <p className="muted">{t("common.noBodyData")}</p>
          )}
        </section>

        <section className="block">
          <p className="block-title">{t("common.bodyPractice")}</p>

          {hasMovement ? (
            <>
              {movement.type ? <p>{t("common.bodyMovingType")} {" — "}{translateValue(t, "movement.types", movement.type)}</p> : null}
              {movement.time ? <p>{t("common.bodyMovingTime")} {" — "}{movement.time}</p> : null}
              {movement.intensity ? <p>{t("common.bodyMovingIntensity")} {" — "}{movement.intensity}/5</p> : null}
              {movement.notes ? <p>{t("common.bodyMovingNotes")} {" — "}{movement.notes}</p> : null}
            </>
          ) : (
            <p className="muted">{t("common.noBodyPractice")}</p>
          )}
        </section>

        <section className="block">
          <p className="block-title">{t("common.environment")}</p>

          {hasEnvironmentData ? (
            <>
              {weather ? <p>{t("common.weather")} {" — "}{weather}</p> : null}
              {weatherTemperature !== "" ? <p>{t("common.temperature")} {" — "}{weatherTemperature}{temperatureUnit}</p> : null}
              {humidity !== "" ? <p>{t("common.humidity")} {" — "}{humidity}{humidityUnit}</p> : null}
              {pressure !== "" ? <p>{t("common.pressure")} {" — "}{pressure}{pressureUnit}</p> : null}
              {wind !== "" ? <p>{t("common.wind")} {" — "}{wind}{windUnit}</p> : null}
              {sunrise ? <p>{t("common.sunrise")} {" — "}{sunrise}</p> : null}
              {sunset ? <p>{t("common.sunset")} {" — "}{sunset}</p> : null}
            </>
          ) : (
            <p className="muted">{t("common.noWeatherData")}</p>
          )}
        </section>

        <section className="block">
          <p className="block-title">{t("common.making")}</p>

          {hasMakingData ? (
            <>
              {work.time ? <p>{t("common.bodyMovingTime")} {" — "}{work.time}</p> : null}
              {work.project ? <p>{t("common.project")} {" — "}{work.project}</p> : null}
              {makingItems.map((item, index) => <p key={`${item}-${index}`}>{item}</p>)}
            </>
          ) : (
            <p className="muted">{t("common.noMakingRecord")}</p>
          )}
        </section>

        <section className="block">
          <p className="block-title">{t("common.learning")}</p>

          {learningItems.length > 0 ? (
            learningItems.map((item, index) => <p key={`${item}-${index}`}>{item}</p>)
          ) : (
            <p className="muted">{t("common.noLearningRecord")}</p>
          )}
        </section>

        <section className="block full">
          <p className="block-title">{t("common.artisticInput")}</p>

          {hasArtisticInput ? (
            <>
              {artisticInput.type ? <p>{t("common.bodyMovingType")} {" — "}{translateValue(t, "artistic.types", artisticInput.type)}</p> : null}
              {artisticInput.title ? <p>{t("common.title")} {" — "}{artisticInput.title}</p> : null}
              {artisticInput.creator ? <p>{t("common.creator")} {" — "}{artisticInput.creator}</p> : null}
              {artisticInput.note ? <p>{t("common.referenceNote")} {" — "}{artisticInput.note}</p> : null}
            </>
          ) : (
            <p className="muted">{t("common.noArtisticInput")}</p>
          )}
        </section>

        <section className="block full">
          <p className="block-title">{t("common.observation")}</p>

          <TranslateButton
            originalText={log.observation || t("common.noObservation")}
            sourceLanguage="en"
            contentKey={`daily-observation:${log.id || log.date || "entry"}`}
            className="translate-block"
          />
        </section>

        <section className="block full">
          <p className="block-title">{t("common.alignment")}</p>

          <TranslateButton
            originalText={log.alignment || t("common.noAlignment")}
            sourceLanguage="en"
            contentKey={`daily-alignment:${log.id || log.date || "entry"}`}
            className="translate-block"
          />
        </section>

        <section className="block full">
          <p className="block-title">{t("common.tomorrow")}</p>

          {tomorrowItems.length > 0 ? (
            tomorrowItems.map((item, index) => <p key={`${item}-${index}`}>{item}</p>)
          ) : (
            <p className="muted">{t("common.noTomorrow")}</p>
          )}
        </section>

        {aiAnalysis?.summary ? (
          <section className="block full ai-reading">
            <p className="block-title">{t("process.system")}</p>
            <p className="ai-summary">
              <TranslateButton
                text={aiAnalysis.summary}
                sourceLanguage="en"
                contentKey={`daily-ai:${log.id || log.date || "entry"}:summary`}
                className="translate-block"
                as="span"
                showControls={false}
              />
            </p>
            {aiAnalysis.relationship ? (
              <p className="muted ai-relationship">
                <TranslateButton
                  text={aiAnalysis.relationship}
                  sourceLanguage="en"
                  contentKey={`daily-ai:${log.id || log.date || "entry"}:relationship`}
                  className="translate-block"
                  as="span"
                  showControls={false}
                />
              </p>
            ) : null}

            <div className="ai-groups">
              {Array.isArray(aiAnalysis.emotions) && aiAnalysis.emotions.length > 0 ? (
                <div>
                  <p className="block-title">{t("process.emotions")}</p>
                  <div className="tag-list">
                    {aiAnalysis.emotions.map((item, index) => <span className="tag" key={`${item}-${index}`}>{item}</span>)}
                  </div>
                </div>
              ) : null}

              {Array.isArray(aiAnalysis.themes) && aiAnalysis.themes.length > 0 ? (
                <div>
                  <p className="block-title">{t("process.themes")}</p>
                  <div className="tag-list">
                    {aiAnalysis.themes.map((item, index) => <span className="tag" key={`${item}-${index}`}>{item}</span>)}
                  </div>
                </div>
              ) : null}

              {Array.isArray(aiAnalysis.keywords) && aiAnalysis.keywords.length > 0 ? (
                <div>
                  <p className="block-title">{t("process.keywords")}</p>
                  <div className="tag-list">
                    {aiAnalysis.keywords.map((item, index) => <span className="tag" key={`${item}-${index}`}>{item}</span>)}
                  </div>
                </div>
              ) : null}

              {Array.isArray(aiAnalysis.body_signals) && aiAnalysis.body_signals.length > 0 ? (
                <div>
                  <p className="block-title">{t("process.bodySignals")}</p>
                  <div className="tag-list">
                    {aiAnalysis.body_signals.map((item, index) => <span className="tag" key={`${item}-${index}`}>{item}</span>)}
                  </div>
                </div>
              ) : null}

              {Array.isArray(aiAnalysis.practice_signals) && aiAnalysis.practice_signals.length > 0 ? (
                <div>
                  <p className="block-title">{t("process.practiceSignals")}</p>
                  <div className="tag-list">
                    {aiAnalysis.practice_signals.map((item, index) => <span className="tag" key={`${item}-${index}`}>{item}</span>)}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {admin ? (
          <section className="block full">
            <div className="actions">
              <button type="button" onClick={() => onEdit?.(log)}>{t("common.edit")}</button>
              <button type="button" onClick={() => onToggle?.(log)}>{log.is_public ? t("common.makePrivate") : t("common.makePublic")}</button>
              <button type="button" onClick={() => onDelete?.(log)}>{t("common.delete")}</button>
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
}
