import MediaPreview from "./MediaPreview";
import TranslateButton from "./TranslateButton";
import { useLanguage } from "./LanguageProvider";

function formatLabel(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
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
  const environment =
    log.environment &&
    typeof log.environment === "object" &&
    !Array.isArray(log.environment)
      ? log.environment
      : {};

  const state =
    log.state &&
    typeof log.state === "object" &&
    !Array.isArray(log.state)
      ? log.state
      : {};

  const movement =
    log.movement &&
    typeof log.movement === "object" &&
    !Array.isArray(log.movement)
      ? log.movement
      : {};

  const work =
    log.work &&
    typeof log.work === "object" &&
    !Array.isArray(log.work)
      ? log.work
      : {};

  const artisticInput =
    log.artistic_input &&
    typeof log.artistic_input === "object" &&
    !Array.isArray(log.artistic_input)
      ? log.artistic_input
      : {};

  const aiAnalysis =
    log.ai_analysis &&
    typeof log.ai_analysis === "object" &&
    !Array.isArray(log.ai_analysis)
      ? log.ai_analysis
      : null;

  const weather =
    environment.weather ||
    state.weather ||
    "";

  const weatherTemperature =
    environment.temperature ??
    state.weather_temperature ??
    "";

  const humidity =
    environment.humidity ??
    state.humidity ??
    "";

  const pressure =
    environment.pressure ??
    state.pressure ??
    "";

  const wind =
    environment.wind ??
    state.wind ??
    "";

  const sunrise =
    environment.sunrise ||
    state.sunrise ||
    "";

  const sunset =
    environment.sunset ||
    state.sunset ||
    "";

  const temperatureUnit =
    environment.units?.temperature ||
    "";

  const humidityUnit =
    environment.units?.humidity ||
    "";

  const pressureUnit =
    environment.units?.pressure ||
    "";

  const windUnit =
    environment.units?.wind ||
    "";

  const learningItems =
    Array.isArray(log.learning)
      ? log.learning
      : [];

  const mediaItems =
    Array.isArray(log.media)
      ? log.media
      : [];

  const tomorrowItems =
    Array.isArray(log.tomorrow)
      ? log.tomorrow
      : [];

  const makingItems =
    Array.isArray(work.items)
      ? work.items
      : [];

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

  const hasMakingData =
    Boolean(work.time) ||
    Boolean(work.project) ||
    makingItems.length > 0;

  const hasArtisticInput =
    Boolean(artisticInput.type) ||
    Boolean(artisticInput.title) ||
    Boolean(artisticInput.creator) ||
    Boolean(artisticInput.note);

  return (
    <article className="entry">
      <div className="entry-head">
        <div>
          <p className="eyebrow">
            {t("common.daily")}
          </p>

          <div className="entry-date">
            {log.date}
          </div>
        </div>

        <div className="actions">
          {log.pace && (
            <span className="pace">
              {log.pace}
            </span>
          )}

          <span className="badge">
            {log.is_public
              ? t("common.public")
              : t("common.private")}
          </span>
        </div>
      </div>

      <div className="entry-grid">
        <section className="block">
          <p className="block-title">
            {t("common.body")}
          </p>

          {hasBodyData ? (
            <>
              {state.body_state !== "" && (
                <p>
                  {t("common.bodyState")}{" — "}
                  {state.body_state}
                </p>
              )}
            {state.breathing_state && (
                <p>
                  {t("common.breathingState")}{" — "}{state.breathing_state}
                  </p>
                )}

              {state.energy !== "" && (
                <p>
                  {t("common.energy")}{" — "}
                  {state.energy}
                </p>
              )}

              {state.mood !== "" && (
                <p>
                  {t("common.mood")}{" — "}
                  {state.mood}
                </p>
              )}

              {state.weight !== "" && (
                <p>
                  {t("common.weight")}{" — "}
                  {state.weight}
                </p>
              )}

              {state.temperature !== "" && (
                <p>
                  {t("common.bodyTemperature")}{" — "}
                  {state.temperature}
                </p>
              )}
            </>
          ) : (
            <p className="muted">
              {t("common.noBodyData")}
            </p>
          )}
        </section>

        <section className="block">
          <p className="block-title">
            {t("common.bodyPractice")}
          </p>

          {hasMovement ? (
            <>
              {movement.type && (
                <p>
                  {t("common.bodyMovingType")}{" — "}
                  {formatLabel(
                    movement.type
                  )}
                </p>
              )}

              {movement.time && (
                <p>
                  {t("common.bodyMovingTime")}{" — "}
                  {movement.time}
                </p>
              )}

              {movement.intensity && (
                <p>
                  {t("common.bodyMovingIntensity")}{" — "}
                  {movement.intensity}/5
                </p>
              )}

              {movement.notes && (
                <p>
                  {t("common.bodyMovingNotes")}{" — "}
                  {movement.notes}
                </p>
              )}
            </>
          ) : (
            <p className="muted">
              {t("common.noBodyPractice")}
            </p>
          )}
        </section>

        <section className="block">
          <p className="block-title">
            {t("common.environment")}
          </p>

          {hasEnvironmentData ? (
            <>
              {weather && (
                <p>
                  {t("common.weather")}{" — "}
                  {weather}
                </p>
              )}

              {weatherTemperature !== "" && (
                <p>
                  {t("common.temperature")}{" — "}
                  {weatherTemperature}
                  {temperatureUnit}
                </p>
              )}

              {humidity !== "" && (
                <p>
                  {t("common.humidity")}{" — "}
                  {humidity}
                  {humidityUnit}
                </p>
              )}

              {pressure !== "" && (
                <p>
                  {t("common.pressure")}{" — "}
                  {pressure}
                  {pressureUnit}
                </p>
              )}

              {wind !== "" && (
                <p>
                  {t("common.wind")}{" — "}
                  {wind}
                  {windUnit}
                </p>
              )}

              {sunrise && (
                <p>
                  {t("common.sunrise")}{" — "}
                  {sunrise}
                </p>
              )}

              {sunset && (
                <p>
                  {t("common.sunset")}{" — "}
                  {sunset}
                </p>
              )}
            </>
          ) : (
            <p className="muted">
              {t("common.noWeatherData")}
            </p>
          )}
        </section>

        <section className="block">
          <p className="block-title">
            {t("common.making")}
          </p>

          {hasMakingData ? (
            <>
              {work.time && (
                <p>
                  {t("common.bodyMovingTime")}{" — "}
                  {work.time}
                </p>
              )}

              {work.project && (
                <p>
                  {t("common.project")}{" — "}
                  {work.project}
                </p>
              )}

              {makingItems.map(
                (item, index) => (
                  <p
                    key={`${item}-${index}`}
                  >
                    {item}
                  </p>
                )
              )}
            </>
          ) : (
            <p className="muted">
              {t("common.noMakingRecord")}
            </p>
          )}
        </section>

        <section className="block">
          <p className="block-title">
            {t("common.learning")}
          </p>

          {learningItems.length > 0 ? (
            learningItems.map(
              (item, index) => (
                <p
                  key={`${item}-${index}`}
                >
                  {item}
                </p>
              )
            )
          ) : (
            <p className="muted">
              {t("common.noLearningRecord")}
            </p>
          )}
        </section>

        <section className="block full">
          <p className="block-title">
            {t("common.artisticInput")}
          </p>

          {hasArtisticInput ? (
            <>
              {artisticInput.type && (
                <p>
                  {t("common.bodyMovingType")}{" — "}
                  {formatLabel(
                    artisticInput.type
                  )}
                </p>
              )}

              {artisticInput.title && (
                <p>
                  {t("common.title")}{" — "}
                  {artisticInput.title}
                </p>
              )}

              {artisticInput.creator && (
                <p>
                  {t("common.creator")}{" — "}
                  {artisticInput.creator}
                </p>
              )}

              {artisticInput.note && (
                <p>
                  {t("common.referenceNote")}{" — "}
                  {artisticInput.note}
                </p>
              )}
            </>
          ) : (
            <p className="muted">
              {t("common.noArtisticInput")}
            </p>
          )}
        </section>

        <section className="block full">
          <p className="block-title">
            {t("common.collection")}
          </p>

          {mediaItems.length > 0 ? (
            <div className="media-gallery">
              {mediaItems.map(
                (item, index) => (
                  <MediaPreview
                    key={
                      item.path ||
                      item.id ||
                      `${item.name || "media"}-${index}`
                    }
                    logId={log.id}
                    item={item}
                  />
                )
              )}
            </div>
          ) : (
            <p className="muted">
              {t("common.noCollectedMedia")}
            </p>
          )}
        </section>

        <section className="block full">
          <p className="block-title">
            {t("common.observation")}
          </p>

          <TranslateButton
            originalText={log.observation || "No observation recorded."}
            sourceLanguage="en"
            targetLanguage="ko"
            contentKey={`daily-observation:${log.id || log.date || "entry"}`}
            className="translate-block"
          />
        </section>

        <section className="block full">
          <p className="block-title">
            {t("common.alignment")}
          </p>

          <TranslateButton
            originalText={log.alignment || "No alignment recorded."}
            sourceLanguage="en"
            targetLanguage="ko"
            contentKey={`daily-alignment:${log.id || log.date || "entry"}`}
            className="translate-block"
          />
        </section>

        <section className="block full">
          <p className="block-title">
            {t("common.tomorrow")}
          </p>

          {tomorrowItems.length > 0 ? (
            tomorrowItems.map(
              (item, index) => (
                <p
                  key={`${item}-${index}`}
                >
                  {item}
                </p>
              )
            )
          ) : (
            <p className="muted">
              {t("common.noTomorrow")}
            </p>
          )}
        </section>

        {aiAnalysis?.summary && (
          <section className="block full ai-reading">
            <p className="block-title">
              {t("process.system")}
            </p>

            <p className="ai-summary">
              {aiAnalysis.summary}
            </p>

            {aiAnalysis.relationship && (
              <p className="muted">
                {aiAnalysis.relationship}
              </p>
            )}

            <div className="ai-groups">
              {Array.isArray(
                aiAnalysis.emotions
              ) &&
                aiAnalysis.emotions.length >
                  0 && (
                  <div>
                    <p className="block-title">
                      {t("process.emotions")}
                    </p>

                    <div className="tag-list">
                      {aiAnalysis.emotions.map(
                        (item, index) => (
                          <span
                            className="tag"
                            key={`${item}-${index}`}
                          >
                            {item}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

              {Array.isArray(
                aiAnalysis.themes
              ) &&
                aiAnalysis.themes.length >
                  0 && (
                  <div>
                    <p className="block-title">
                      {t("process.themes")}
                    </p>

                    <div className="tag-list">
                      {aiAnalysis.themes.map(
                        (item, index) => (
                          <span
                            className="tag"
                            key={`${item}-${index}`}
                          >
                            {item}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

              {Array.isArray(
                aiAnalysis.keywords
              ) &&
                aiAnalysis.keywords.length >
                  0 && (
                  <div>
                    <p className="block-title">
                      {t("process.keywords")}
                    </p>

                    <div className="tag-list">
                      {aiAnalysis.keywords.map(
                        (item, index) => (
                          <span
                            className="tag"
                            key={`${item}-${index}`}
                          >
                            {item}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

              {Array.isArray(
                aiAnalysis.body_signals
              ) &&
                aiAnalysis.body_signals.length >
                  0 && (
                  <div>
                    <p className="block-title">
                      Body Signals
                    </p>

                    <div className="tag-list">
                      {aiAnalysis.body_signals.map(
                        (item, index) => (
                          <span
                            className="tag"
                            key={`${item}-${index}`}
                          >
                            {item}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

              {Array.isArray(
                aiAnalysis.practice_signals
              ) &&
                aiAnalysis.practice_signals.length >
                  0 && (
                  <div>
                    <p className="block-title">
                      Practice Signals
                    </p>

                    <div className="tag-list">
                      {aiAnalysis.practice_signals.map(
                        (item, index) => (
                          <span
                            className="tag"
                            key={`${item}-${index}`}
                          >
                            {item}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          </section>
        )}

        {admin && (
          <section className="block full">
            <div className="actions">
              <button
                type="button"
                onClick={() =>
                  onEdit?.(log)
                }
              >
                {t("common.edit")}
              </button>

              <button
                type="button"
                onClick={() =>
                  onToggle?.(log)
                }
              >
                {log.is_public
                  ? t("common.makePrivate")
                  : t("common.makePublic")}
              </button>

              <button
                type="button"
                onClick={() =>
                  onDelete?.(log)
                }
              >
                {t("common.delete")}
              </button>
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
