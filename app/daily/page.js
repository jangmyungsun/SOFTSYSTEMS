"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "../../lib/supabaseClient";
import { getCurrentWeather } from "../../lib/weather";

import EntryCard from "../../components/EntryCard";
import LogForm from "../../components/LogForm";
import MediaUploader from "../../components/MediaUploader";
import VideoForm from "../../components/VideoForm";
import VideoCard from "../../components/VideoCard";

export default function DailyPage() {
  const [session, setSession] =
    useState(null);

  const [logs, setLogs] =
    useState([]);

  const [videos, setVideos] =
    useState([]);

  const [editing, setEditing] =
    useState(null);

  const [media, setMedia] =
    useState([]);

  const [environment, setEnvironment] =
    useState(null);

  const [
    weatherStatus,
    setWeatherStatus,
  ] = useState("idle");

  const load = async () => {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    setSession(currentSession);

    if (!currentSession) {
      return;
    }

    const {
      data: rows,
      error: logError,
    } = await supabase
      .from("field_logs")
      .select("*")
      .order("date", {
        ascending: false,
      });

    if (logError) {
      console.error(logError);
    }

    setLogs(rows || []);

    const {
      data: videoRows,
      error: videoError,
    } = await supabase
      .from("video_archive")
      .select("*")
      .order("date", {
        ascending: false,
      });

    if (videoError) {
      console.error(videoError);
    }

    setVideos(videoRows || []);
  };

  const collectWeather = async () => {
    setWeatherStatus("loading");

    try {
      const weather =
        await getCurrentWeather();

      setEnvironment(weather);
      setWeatherStatus("success");
    } catch (error) {
      console.error(error);

      setEnvironment(null);
      setWeatherStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    collectWeather();
  }, []);

  const saveLog = async (payload) => {
    if (!session) {
      alert("Please log in first.");
      return;
    }

    const finalPayload = {
      ...payload,

      /*
       * 자동 수집된 환경 데이터를
       * environment 컬럼에 저장한다.
       */
      environment:
        environment ||
        editing?.environment ||
        {},

      /*
       * Supabase Storage에 업로드된
       * 파일 메타데이터를 저장한다.
       */
      media,
    };

    let result;

    if (editing) {
      result = await supabase
        .from("field_logs")
        .update(finalPayload)
        .eq("id", editing.id);
    } else {
      result = await supabase
        .from("field_logs")
        .insert({
          ...finalPayload,
          user_id: session.user.id,
        });
    }

    if (result.error) {
      console.error(result.error);
      alert(result.error.message);
      return;
    }

    setEditing(null);
    setMedia([]);
    await collectWeather();
    await load();

    alert("Daily saved.");
  };

  const startEditing = (log) => {
    setEditing(log);

    setMedia(
      Array.isArray(log.media)
        ? log.media
        : []
    );

    setEnvironment(
      log.environment || null
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const cancelEditing = () => {
    setEditing(null);
    setMedia([]);
    collectWeather();
  };

  const toggleLog = async (log) => {
    const { error } = await supabase
      .from("field_logs")
      .update({
        is_public: !log.is_public,
      })
      .eq("id", log.id);

    if (error) {
      alert(error.message);
      return;
    }

    await load();
  };

  const deleteLog = async (log) => {
    const confirmed =
      window.confirm(
        "Delete this Daily entry?"
      );

    if (!confirmed) {
      return;
    }

    /*
     * 연결된 Storage 파일부터 삭제한다.
     */
    const paths = (
      Array.isArray(log.media)
        ? log.media
        : []
    )
      .map((item) => item.path)
      .filter(Boolean);

    if (paths.length) {
      const { error: storageError } =
        await supabase
          .storage
          .from("softsystems-media")
          .remove(paths);

      if (storageError) {
        console.error(storageError);
      }
    }

    const { error } = await supabase
      .from("field_logs")
      .delete()
      .eq("id", log.id);

    if (error) {
      alert(error.message);
      return;
    }

    await load();
  };

  const saveVideo = async (payload) => {
    if (!session) {
      return;
    }

    const { error } = await supabase
      .from("video_archive")
      .insert({
        ...payload,
        user_id: session.user.id,
      });

    if (error) {
      alert(error.message);
      return;
    }

    await load();
  };

  const toggleVideo = async (video) => {
    const { error } = await supabase
      .from("video_archive")
      .update({
        is_public:
          !video.is_public,
      })
      .eq("id", video.id);

    if (error) {
      alert(error.message);
      return;
    }

    await load();
  };

  const deleteVideo = async (video) => {
    const confirmed =
      window.confirm(
        "Delete this video record?"
      );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("video_archive")
      .delete()
      .eq("id", video.id);

    if (error) {
      alert(error.message);
      return;
    }

    await load();
  };

  const exportAll = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            logs,
            videos,
          },
          null,
          2
        ),
      ],
      {
        type: "application/json",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "SOFTSYSTEMS_archive.json";

    link.click();

    URL.revokeObjectURL(url);
  };

  if (!session) {
    return (
      <section className="panel">
        <h2>Daily</h2>

        <p className="muted">
          Please log in first.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="panel">
        <div className="entry-head">
          <div>
            <p className="eyebrow">
              Daily
            </p>

            <h2>
              {editing
                ? "Edit Daily"
                : "New Daily"}
            </h2>
          </div>

          {editing && (
            <button
              type="button"
              onClick={cancelEditing}
            >
              Cancel Edit
            </button>
          )}
        </div>

        <section className="block">
          <p className="block-title">
            Environment
          </p>

          {weatherStatus ===
            "loading" && (
            <p>
              Collecting weather…
            </p>
          )}

          {weatherStatus ===
            "error" && (
            <>
              <p className="muted">
                Weather could not be
                collected. Check browser
                location permission.
              </p>

              <button
                type="button"
                onClick={collectWeather}
              >
                Try Again
              </button>
            </>
          )}

          {environment && (
            <div className="grid three">
              <p>
                Weather —{" "}
                {environment.weather}
              </p>

              <p>
                Temperature —{" "}
                {environment.temperature}
                {
                  environment.units
                    ?.temperature
                }
              </p>

              <p>
                Humidity —{" "}
                {environment.humidity}
                {
                  environment.units
                    ?.humidity
                }
              </p>

              <p>
                Pressure —{" "}
                {environment.pressure}
                {
                  environment.units
                    ?.pressure
                }
              </p>

              <p>
                Wind —{" "}
                {environment.wind}
                {
                  environment.units?.wind
                }
              </p>

              <p>
                Sunrise —{" "}
                {environment.sunrise}
              </p>

              <p>
                Sunset —{" "}
                {environment.sunset}
              </p>
            </div>
          )}
        </section>

        <LogForm
          key={
            editing?.id ||
            "new-daily"
          }
          initial={editing}
          onSubmit={saveLog}
        />

        <h2>Collection</h2>

        <MediaUploader
          media={media}
          onChange={setMedia}
        />
      </section>

      <section className="panel">
        <h2>Archive Video</h2>

        <VideoForm
          onSubmit={saveVideo}
        />
      </section>

      <section className="panel">
        <div className="actions">
          <button
            type="button"
            onClick={exportAll}
          >
            Export Full Archive JSON
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Daily Archive</h2>

        {logs.map((log) => (
          <EntryCard
            key={log.id}
            log={log}
            admin
            onEdit={startEditing}
            onDelete={deleteLog}
            onToggle={toggleLog}
          />
        ))}

        {!logs.length && (
          <p className="muted">
            No Daily entries yet.
          </p>
        )}
      </section>

      <section className="panel">
        <h2>Video Archive</h2>

        <div className="video-grid">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              admin
              onToggle={toggleVideo}
              onDelete={deleteVideo}
            />
          ))}
        </div>
      </section>
    </>
  );
}
