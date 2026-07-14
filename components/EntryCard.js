export default function EntryCard({
  log,
  admin = false,
  onEdit,
  onDelete,
  onToggle,
}) {
  const environment = log.environment || {};

  const weather =
    environment.weather ||
    log.state?.weather ||
    "";

  const weatherTemperature =
    environment.temperature ??
    log.state?.weather_temperature ??
    "";

  const humidity =
    environment.humidity ??
    log.state?.humidity ??
    "";

  const pressure =
    environment.pressure ??
    log.state?.pressure ??
    "";

  const wind =
    environment.wind ??
    log.state?.wind ??
    "";

  const sunrise =
    environment.sunrise ||
    log.state?.sunrise ||
    "";

  const sunset =
    environment.sunset ||
    log.state?.sunset ||
    "";

  const learningText = Array.isArray(log.learning)
    ? log.learning
    : [];

  const mediaItems = Array.isArray(log.media)
    ? log.media
    : [];

  const tomorrowItems = Array.isArray(log.tomorrow)
    ? log.tomorrow
    : [];
  
  const aiAnalysis =
  log.ai_analysis &&
  typeof log.ai_analysis ===
    "object"
    ? log.ai_analysis
    : null;

  const hasEnvironmentData =
    weather ||
    weatherTemperature !== "" ||
    humidity !== "" ||
    pressure !== "" ||
    wind !== "" ||
    sunrise ||
    sunset;

  return (
    <article className="entry">
      <div className="entry-head">
        <div>
          <p className="eyebrow">Daily</p>

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

          <p>
            Body State —{" "}
            {log.state?.body_state || ""}
          </p>

          <p>
            Energy —{" "}
            {log.state?.energy || ""}
          </p>

          <p>
            Mood —{" "}
            {log.state?.mood || ""}
          </p>

          {log.state?.weight && (
            <p>
              Weight —{" "}
              {log.state.weight}
            </p>
          )}

          {log.state?.temperature && (
            <p>
              Body Temperature —{" "}
              {log.state.temperature}
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
                  Weather — {weather}
                </p>
              )}

              {weatherTemperature !== "" && (
                <p>
                  Temperature —{" "}
                  {weatherTemperature}
                </p>
              )}

              {humidity !== "" && (
                <p>
                  Humidity — {humidity}
                </p>
              )}

              {pressure !== "" && (
                <p>
                  Pressure — {pressure}
                </p>
              )}

              {wind !== "" && (
                <p>
                  Wind — {wind}
                </p>
              )}

              {sunrise && (
                <p>
                  Sunrise — {sunrise}
                </p>
              )}

              {sunset && (
                <p>
                  Sunset — {sunset}
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

          {log.work?.time && (
            <p>
              Time — {log.work.time}
            </p>
          )}

          {log.work?.project && (
            <p>
              Project —{" "}
              {log.work.project}
            </p>
          )}

          {(log.work?.items || []).map(
            (item, index) => (
              <p
                key={`${item}-${index}`}
              >
                {item}
              </p>
            )
          )}

          {!log.work?.time &&
            !log.work?.project &&
            !(log.work?.items || [])
              .length && (
              <p className="muted">
                No Making record.
              </p>
            )}
        </section>

        <section className="block">
          <p className="block-title">
            Learning
          </p>

          {learningText.length > 0 ? (
            learningText.map(
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
            Collection
          </p>

          {mediaItems.length > 0 ? (
            <div className="media-list">
              {mediaItems.map(
                (item, index) => (
                  <div
                    className="media-item"
                    key={
                      item.id ||
                      `${item.name || "media"}-${index}`
                    }
                  >
                    <p>
                      {item.type ||
                        "media"}{" "}
                      —{" "}
                      {item.name ||
                        item.file_name ||
                        ""}
                    </p>

                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="button-link"
                      >
                        Open
                      </a>
                    )}
                  </div>
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
