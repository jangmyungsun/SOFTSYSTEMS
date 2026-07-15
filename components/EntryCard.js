import MediaPreview from "./MediaPreview";

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
            Daily
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
              ? "public"
              : "private"}
          </span>
        </div>
      </div>

      <div className="entry-grid">
        <section className="block">
          <p className="block-title">
            Body
          </p>

          {hasBodyData ? (
            <>
              {state.body_state !== "" && (
                <p>
                  Body State —{" "}
                  {state.body_state}
                </p>
              )}
              {state.breathing_state && (
                <p>
                  <strong>Breathing State</strong> —{" "}
                  {state.breathing_state}
                  </p>
                )}

              {state.energy !== "" && (
                <p>
                  Energy —{" "}
                  {state.energy}
                </p>
              )}

              {state.mood !== "" && (
                <p>
                  Mood —{" "}
                  {state.mood}
                </p>
              )}

              {state.weight !== "" && (
                <p>
                  Weight —{" "}
                  {state.weight}
                </p>
              )}

              {state.temperature !== "" && (
                <p>
                  Body Temperature —{" "}
                  {state.temperature}
                </p>
              )}
            </>
          ) : (
            <p className="muted">
              No body data recorded.
            </p>
          )}
        </section>

        <section className="block">
          <p className="block-title">
            Body Practice
          </p>

          {hasMovement ? (
            <>
              {movement.type && (
                <p>
                  Type —{" "}
                  {formatLabel(
                    movement.type
                  )}
                </p>
              )}

              {movement.time && (
                <p>
                  Time —{" "}
                  {movement.time}
                </p>
              )}

              {movement.intensity && (
                <p>
                  Intensity —{" "}
                  {movement.intensity}/5
                </p>
              )}

              {movement.notes && (
                <p>
                  Notes —{" "}
                  {movement.notes}
                </p>
              )}
            </>
          ) : (
            <p className="muted">
              No body practice recorded.
            </p>
          )}
        </section>

        <section className="block">
          <p className="block-title">
            Environment
          </p>

          {hasEnvironmentData ? (
            <>
              {weather && (
                <p>
                  Weather —{" "}
                  {weather}
                </p>
              )}

              {weatherTemperature !== "" && (
                <p>
                  Temperature —{" "}
                  {weatherTemperature}
                  {temperatureUnit}
                </p>
              )}

              {humidity !== "" && (
                <p>
                  Humidity —{" "}
                  {humidity}
                  {humidityUnit}
                </p>
              )}

              {pressure !== "" && (
                <p>
                  Pressure —{" "}
                  {pressure}
                  {pressureUnit}
                </p>
              )}

              {wind !== "" && (
                <p>
                  Wind —{" "}
                  {wind}
                  {windUnit}
                </p>
              )}

              {sunrise && (
                <p>
                  Sunrise —{" "}
                  {sunrise}
                </p>
              )}

              {sunset && (
                <p>
                  Sunset —{" "}
                  {sunset}
                </p>
              )}
            </>
          ) : (
            <p className="muted">
              Weather data was not collected.
            </p>
          )}
        </section>

        <section className="block">
          <p className="block-title">
            Making
          </p>

          {hasMakingData ? (
            <>
              {work.time && (
                <p>
                  Time —{" "}
                  {work.time}
                </p>
              )}

              {work.project && (
                <p>
                  Project —{" "}
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
              No Making record.
            </p>
          )}
        </section>

        <section className="block">
          <p className="block-title">
            Learning
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
              No Learning record.
            </p>
          )}
        </section>

        <section className="block full">
          <p className="block-title">
            Artistic Input
          </p>

          {hasArtisticInput ? (
            <>
              {artisticInput.type && (
                <p>
                  Type —{" "}
                  {formatLabel(
                    artisticInput.type
                  )}
                </p>
              )}

              {artisticInput.title && (
                <p>
                  Title —{" "}
                  {artisticInput.title}
                </p>
              )}

              {artisticInput.creator && (
                <p>
                  Creator —{" "}
                  {artisticInput.creator}
                </p>
              )}

              {artisticInput.note && (
                <p>
                  Reference Note —{" "}
                  {artisticInput.note}
                </p>
              )}
            </>
          ) : (
            <p className="muted">
              No artistic input recorded.
            </p>
          )}
        </section>

        <section className="block full">
          <p className="block-title">
            Collection
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
              No collected media.
            </p>
          )}
        </section>

        <section className="block full">
          <p className="block-title">
            Observation
          </p>

          <p>
            {log.observation ||
              "No observation recorded."}
          </p>
        </section>

        <section className="block full">
          <p className="block-title">
            Alignment
          </p>

          <p>
            {log.alignment ||
              "No alignment recorded."}
          </p>
        </section>

        <section className="block full">
          <p className="block-title">
            Tomorrow
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
              Nothing recorded for tomorrow.
            </p>
          )}
        </section>

        {aiAnalysis?.summary && (
          <section className="block full ai-reading">
            <p className="block-title">
              System Reading
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
                      Emotions
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
                      Themes
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
                      Keywords
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
                Edit
              </button>

              <button
                type="button"
                onClick={() =>
                  onToggle?.(log)
                }
              >
                {log.is_public
                  ? "Make Private"
                  : "Make Public"}
              </button>

              <button
                type="button"
                onClick={() =>
                  onDelete?.(log)
                }
              >
                Delete
              </button>
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
