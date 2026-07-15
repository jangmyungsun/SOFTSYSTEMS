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
    embedding,
    setEmbedding,
  ] = useState(false);

  const [
    embeddingStatus,
    setEmbeddingStatus,
  ] = useState("");

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

  /*
   * 로그인 상태 확인
   */
  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data,
        error,
      } =
        await supabase.auth
          .getUser();

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
      supabase.auth
        .onAuthStateChange(
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

            setEditingEntry(
              null
            );

            setShowForm(
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

  /*
   * 통합 Archive와 기존 Video Archive 불러오기
   */
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
         * 기존 video_archive가 없거나
         * 접근할 수 없는 환경도 허용한다.
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

  /*
   * 필터 및 일반 검색
   */
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
    setEmbeddingStatus("");

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
    setEmbeddingStatus("");

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

  /*
   * 현재 로그인 세션의 Access Token
   */
  const getAccessToken =
    async () => {
      const {
        data,
        error,
      } =
        await supabase.auth
          .getSession();

      if (error) {
        throw error;
      }

      const accessToken =
        data?.session
          ?.access_token;

      if (!accessToken) {
        throw new Error(
          "No login session was found."
        );
      }

      return accessToken;
    };

  /*
   * Archive 한 개 embedding 생성
   */
  const embedArchiveEntry =
    async (entryId) => {
      const accessToken =
        await getAccessToken();

      const response =
        await fetch(
          "/api/archive/embed",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${accessToken}`,
            },

            body:
              JSON.stringify({
                entry_id:
                  entryId,
              }),
          }
        );

      let result;

      try {
        result =
          await response.json();
      } catch {
        throw new Error(
          "The Archive memory server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Archive embedding failed."
        );
      }

      return result;
    };

  /*
   * 기존 Archive 전체 embedding 생성
   */
  const embedAllArchive =
    async () => {
      if (!user) {
        window.alert(
          "Please sign in first."
        );

        return;
      }

      setEmbedding(true);

      setEmbeddingStatus(
        "Reading Archive entries…"
      );

      setErrorMessage("");

      try {
        const accessToken =
          await getAccessToken();

        const response =
          await fetch(
            "/api/archive/embed",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${accessToken}`,
              },

              body:
                JSON.stringify({
                  all: true,
                }),
            }
          );

        let result;

        try {
          result =
            await response.json();
        } catch {
          throw new Error(
            "The Archive memory server returned an invalid response."
          );
        }

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "Archive embedding failed."
          );
        }

        setEmbeddingStatus(
          `${result.processed || 0} Archive entries processed. ` +
            `${result.skipped || 0} skipped. ` +
            `${result.failed || 0} failed.`
        );

        await loadArchive();
      } catch (error) {
        console.error(
          "Archive embedding error:",
          error
        );

        setEmbeddingStatus(
          error?.message ||
            "Archive embedding failed."
        );
      } finally {
        setEmbedding(false);
      }
    };

  /*
   * Archive 저장 및 수정
   *
   * DB 저장 후 embedding 생성.
   * embedding 실패 시 원문 데이터는 유지된다.
   */
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
      setEmbeddingStatus("");

      try {
        let savedEntryId = "";

        if (editingEntry) {
          const {
            data,
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
            )
            .select("id")
            .single();

          if (error) {
            throw error;
          }

          savedEntryId =
            data?.id ||
            editingEntry.id;
        } else {
          const {
            data,
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
            })
            .select("id")
            .single();

          if (error) {
            throw error;
          }

          if (!data?.id) {
            throw new Error(
              "The saved Archive ID was not returned."
            );
          }

          savedEntryId =
            data.id;
        }

        setEmbeddingStatus(
          "Creating Archive memory…"
        );

        try {
          await embedArchiveEntry(
            savedEntryId
          );

          setEmbeddingStatus(
            "Archive and semantic memory saved."
          );
        } catch (
          embeddingError
        ) {
          console.error(
            "Archive embedding error:",
            embeddingError
          );

          setEmbeddingStatus(
            "Archive saved. Semantic memory could not be created."
          );

          window.alert(
            `Archive was saved, but semantic memory failed: ${
              embeddingError.message
            }`
          );
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

  /*
   * Archive 삭제
   */
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
      setEmbeddingStatus("");

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

  /*
   * 공개 / 비공개 전환
   */
  const toggleVisibility =
    async (entry) => {
      if (!user) {
        return;
      }

      setErrorMessage("");
      setEmbeddingStatus("");

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
              Writing, Videos,
              and Process
            </h2>

            <p className="subtitle">
              Essays,
              reflections,
              project records,
              videos, and
              references collected
              in one memory layer.
            </p>
          </div>

          {user && (
            <div className="actions">
              <button
                type="button"
                onClick={
                  embedAllArchive
                }
                disabled={
                  embedding ||
                  submitting
                }
              >
                {embedding
                  ? "Reading Archive…"
                  : "Update Archive Memory"}
              </button>

              <button
                className="primary"
                type="button"
                onClick={
                  showForm
                    ? closeForm
                    : startNewEntry
                }
                disabled={
                  submitting ||
                  embedding
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

      {embeddingStatus && (
        <section className="panel">
          <p className="muted">
            {embeddingStatus}
          </p>
        </section>
      )}

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
        filteredEntries.length >
          0 && (
          <section className="archive-grid">
            {filteredEntries.map(
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
          </section>
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
                Videos stored in
                the original
                video_archive
                table remain here
                until they are
                moved into the
                unified Archive.
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
