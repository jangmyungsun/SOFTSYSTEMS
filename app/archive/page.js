"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  supabase,
} from "../../lib/supabaseClient";

import ArchiveForm from "../../components/ArchiveForm";
import ArchiveCard from "../../components/ArchiveCard";
import VideoCard from "../../components/VideoCard";

const FILTERS = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "essay",
    label: "Essay",
  },
  {
    value: "reflection",
    label: "Reflection",
  },
  {
    value: "project-log",
    label: "Project Log",
  },
  {
    value: "video",
    label: "Video",
  },
  {
    value: "reference",
    label: "Reference",
  },
];

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed =
        JSON.parse(value);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeEntry(entry) {
  return {
    ...entry,

    tags:
      normalizeTags(
        entry?.tags
      ),

    is_public:
      entry?.is_public !==
      false,
  };
}

export default function ArchivePage() {
  const [
    user,
    setUser,
  ] = useState(null);

  const [
    authLoading,
    setAuthLoading,
  ] = useState(true);

  const [
    entries,
    setEntries,
  ] = useState([]);

  const [
    legacyVideos,
    setLegacyVideos,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    editingEntry,
    setEditingEntry,
  ] = useState(null);

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    activeFilter,
    setActiveFilter,
  ] = useState("all");

  const [
    searchText,
    setSearchText,
  ] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data,
        error,
      } =
        await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      if (error) {
        console.error(
          "Archive auth error:",
          error
        );
      }

      setUser(
        data?.user ||
        null
      );

      setAuthLoading(false);
    }

    loadUser();

    const {
      data:
        authListener,
    } =
      supabase.auth.onAuthStateChange(
        (
          _event,
          session
        ) => {
          if (!mounted) {
            return;
          }

          setUser(
            session?.user ||
            null
          );

          setAuthLoading(
            false
          );
        }
      );

    return () => {
      mounted = false;

      authListener
        ?.subscription
        ?.unsubscribe();
    };
  }, []);

  const loadArchive =
    useCallback(
      async () => {
        setLoading(true);
        setErrorMessage("");

        const [
          entriesResult,
          videosResult,
        ] =
          await Promise.all([
            supabase
              .from(
                "archive_entries"
              )
              .select("*")
              .order(
                "entry_date",
                {
                  ascending:
                    false,
                }
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              ),

            supabase
              .from(
                "video_archive"
              )
              .select("*")
              .eq(
                "is_public",
                true
              )
              .order(
                "date",
                {
                  ascending:
                    false,
                }
              ),
          ]);

        if (
          entriesResult.error
        ) {
          console.error(
            "Archive entries error:",
            entriesResult.error
          );

          setErrorMessage(
            entriesResult
              .error
              .message
          );

          setEntries([]);
        } else {
          setEntries(
            (
              entriesResult.data ||
              []
            ).map(
              normalizeEntry
            )
          );
        }

        /*
         * 기존 video_archive 테이블이
         * 아직 없는 환경도 고려한다.
         */
        if (
          videosResult.error
        ) {
          console.warn(
            "Legacy video archive could not be loaded:",
            videosResult.error
          );

          setLegacyVideos([]);
        } else {
          setLegacyVideos(
            videosResult.data ||
            []
          );
        }

        setLoading(false);
      },
      []
    );

  useEffect(() => {
    if (authLoading) {
      return;
    }

    loadArchive();
  }, [
    authLoading,
    user,
    loadArchive,
  ]);

  const filteredEntries =
    useMemo(() => {
      const normalizedSearch =
        searchText
          .trim()
          .toLowerCase();

      return entries.filter(
        (entry) => {
          const matchesType =
            activeFilter ===
              "all" ||
            entry.type ===
              activeFilter;

          if (!matchesType) {
            return false;
          }

          if (
            !normalizedSearch
          ) {
            return true;
          }

          const searchableText = [
            entry.title,
            entry.body,
            entry.url,
            entry.type,
            ...normalizeTags(
              entry.tags
            ),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            normalizedSearch
          );
        }
      );
    }, [
      entries,
      activeFilter,
      searchText,
    ]);

  const startNewEntry = () => {
    setEditingEntry(null);
    setShowForm(true);

    window.setTimeout(
      () => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      },
      0
    );
  };

  const startEditing = (
    entry
  ) => {
    setEditingEntry(
      entry
    );

    setShowForm(true);

    window.setTimeout(
      () => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      },
      0
    );
  };

  const closeForm = () => {
    setEditingEntry(null);
    setShowForm(false);
  };

  const saveEntry =
    async (values) => {
      if (!user) {
        window.alert(
          "Please sign in before saving an Archive entry."
        );

        return;
      }

      setSubmitting(true);
      setErrorMessage("");

      try {
        if (editingEntry) {
          const {
            error,
          } = await supabase
            .from(
              "archive_entries"
            )
            .update({
              type:
                values.type,

              title:
                values.title,

              entry_date:
                values.entry_date,

              body:
                values.body,

              url:
                values.url,

              tags:
                values.tags,

              is_public:
                values.is_public,
            })
            .eq(
              "id",
              editingEntry.id
            )
            .eq(
              "user_id",
              user.id
            );

          if (error) {
            throw error;
          }
        } else {
          const {
            error,
          } = await supabase
            .from(
              "archive_entries"
            )
            .insert({
              user_id:
                user.id,

              type:
                values.type,

              title:
                values.title,

              entry_date:
                values.entry_date,

              body:
                values.body,

              url:
                values.url,

              tags:
                values.tags,

              is_public:
                values.is_public,
            });

          if (error) {
            throw error;
          }
        }

        closeForm();

        await loadArchive();
      } catch (error) {
        console.error(
          "Archive save error:",
          error
        );

        setErrorMessage(
          error?.message ||
          "The Archive entry could not be saved."
        );
      } finally {
        setSubmitting(false);
      }
    };

  const deleteEntry =
    async (entry) => {
      if (!user) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete “${entry.title}”?`
        );

      if (!confirmed) {
        return;
      }

      setErrorMessage("");

      const {
        error,
      } = await supabase
        .from(
          "archive_entries"
        )
        .delete()
        .eq(
          "id",
          entry.id
        )
        .eq(
          "user_id",
          user.id
        );

      if (error) {
        console.error(
          "Archive delete error:",
          error
        );

        setErrorMessage(
          error.message
        );

        return;
      }

      if (
        editingEntry?.id ===
        entry.id
      ) {
        closeForm();
      }

      await loadArchive();
    };

  const toggleVisibility =
    async (entry) => {
      if (!user) {
        return;
      }

      setErrorMessage("");

      const {
        error,
      } = await supabase
        .from(
          "archive_entries"
        )
        .update({
          is_public:
            !entry.is_public,
        })
        .eq(
          "id",
          entry.id
        )
        .eq(
          "user_id",
          user.id
        );

      if (error) {
        console.error(
          "Archive visibility error:",
          error
        );

        setErrorMessage(
          error.message
        );

        return;
      }

      await loadArchive();
    };

  return (
    <>
      <section className="panel">
        <div className="entry-head">
          <div>
            <p className="eyebrow">
              Archive
            </p>

            <h2>
              Writing, Images,
              Videos, and Process
            </h2>

            <p className="subtitle">
              A shared memory layer
              for essays,
              reflections, project
              records, videos, and
              references.
            </p>
          </div>

          {user && (
            <div className="actions">
              <button
                className="primary"
                type="button"
                onClick={
                  showForm
                    ? closeForm
                    : startNewEntry
                }
              >
                {showForm
                  ? "Close Form"
                  : "New Archive"}
              </button>
            </div>
          )}
        </div>

        {!authLoading &&
          !user && (
            <p className="muted">
              Public Archive
              entries are visible
              here. Sign in to add
              or manage entries.
            </p>
          )}
      </section>

      {errorMessage && (
        <section className="panel">
          <p className="muted">
            {errorMessage}
          </p>
        </section>
      )}

      {user &&
        showForm && (
          <section className="panel">
            <ArchiveForm
              key={
                editingEntry?.id ||
                "new-archive"
              }
              initial={
                editingEntry
              }
              onSubmit={
                saveEntry
              }
              onCancel={
                closeForm
              }
              submitting={
                submitting
              }
            />
          </section>
        )}

      <section className="panel">
        <div className="grid two">
          <label>
            Search Archive

            <input
              type="search"
              placeholder="Search title, text, or tags"
              value={
                searchText
              }
              onChange={(
                event
              ) =>
                setSearchText(
                  event.target
                    .value
                )
              }
            />
          </label>
        </div>

        <div className="artistic-type-list">
          {FILTERS.map(
            (filter) => {
              const selected =
                activeFilter ===
                filter.value;

              return (
                <button
                  type="button"
                  className={
                    selected
                      ? "artistic-type selected"
                      : "artistic-type"
                  }
                  key={
                    filter.value
                  }
                  onClick={() =>
                    setActiveFilter(
                      filter.value
                    )
                  }
                >
                  {filter.label}
                </button>
              );
            }
          )}
        </div>

        <p className="muted">
          {
            filteredEntries.length
          }{" "}
          archive{" "}
          {filteredEntries.length ===
          1
            ? "entry"
            : "entries"}
        </p>
      </section>

      {loading && (
        <section className="panel">
          <p className="muted">
            Loading Archive…
          </p>
        </section>
      )}

      {!loading &&
        !filteredEntries.length && (
          <section className="panel">
            <h2>
              No Archive Entries
            </h2>

            <p className="muted">
              No entry matches the
              current filter.
            </p>
          </section>
        )}

      {!loading &&
        filteredEntries.map(
          (entry) => {
            const ownsEntry =
              Boolean(
                user &&
                  entry.user_id ===
                    user.id
              );

            return (
              <ArchiveCard
                key={
                  entry.id
                }
                entry={
                  entry
                }
                admin={
                  ownsEntry
                }
                onEdit={
                  startEditing
                }
                onDelete={
                  deleteEntry
                }
                onToggle={
                  toggleVisibility
                }
              />
            );
          }
        )}

      {legacyVideos.length >
        0 && (
        <section className="panel">
          <div className="entry-head">
            <div>
              <p className="eyebrow">
                Previous Archive
              </p>

              <h2>
                Legacy Video
                Archive
              </h2>

              <p className="subtitle">
                Videos stored in the
                original
                video_archive
                table remain visible
                until they are moved
                into the unified
                Archive.
              </p>
            </div>
          </div>

          <div className="video-grid">
            {legacyVideos.map(
              (video) => (
                <VideoCard
                  key={
                    video.id
                  }
                  video={
                    video
                  }
                />
              )
            )}
          </div>
        </section>
      )}
    </>
  );
}
