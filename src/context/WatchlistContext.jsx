import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNotifications } from "./NotificationContext";

export const WATCHLIST_KEY = "emmovie_watchlist";
export const WATCHED_KEY = "emmovie_watched";
export const WATCHLIST_META_KEY = "emmovie_watchlist_meta";

const WatchlistContext = createContext(null);

const parseWatchlist = (value) => {
  try {
    const parsedValue = value ? JSON.parse(value) : [];

    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
};

const parseMetadata = (value) => {
  try {
    const parsedValue = value ? JSON.parse(value) : {};

    return parsedValue &&
      typeof parsedValue === "object" &&
      !Array.isArray(parsedValue)
      ? parsedValue
      : {};
  } catch {
    return {};
  }
};

const readStorage = (key, parser) => {
  if (typeof window === "undefined") {
    return parser(null);
  }

  try {
    return parser(window.localStorage.getItem(key));
  } catch {
    return parser(null);
  }
};

const createDefaultMetadata = () => ({
  personalRating: null,
  note: "",
  watchedAt: "",
  addedAt: new Date().toISOString(),
});

const withoutLegacyStatus = (metadata) => {
  const nextMetadata = { ...metadata };
  delete nextMetadata.status;
  return nextMetadata;
};

const getTodayDateValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const readInitialWatchedMovies = () => {
  if (typeof window === "undefined") return [];

  try {
    const storedWatchedMovies = window.localStorage.getItem(WATCHED_KEY);

    if (storedWatchedMovies !== null) {
      return parseWatchlist(storedWatchedMovies);
    }
  } catch {
    return [];
  }

  const legacyWatchlist = readStorage(WATCHLIST_KEY, parseWatchlist);
  const legacyMetadata = readStorage(WATCHLIST_META_KEY, parseMetadata);

  return legacyWatchlist.filter(
    (movie) => legacyMetadata[movie.id]?.status === "watched"
  );
};

export const WatchlistProvider = ({ children }) => {
  const { notify } = useNotifications();
  const [watchlist, setWatchlist] = useState(() =>
    readStorage(WATCHLIST_KEY, parseWatchlist)
  );
  const [watchedMovies, setWatchedMovies] = useState(
    readInitialWatchedMovies
  );
  const [watchlistMetadata, setWatchlistMetadata] = useState(() =>
    readStorage(WATCHLIST_META_KEY, parseMetadata)
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        WATCHLIST_KEY,
        JSON.stringify(watchlist)
      );
    } catch {
      // The library remains usable in memory when storage is unavailable.
    }
  }, [watchlist]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        WATCHED_KEY,
        JSON.stringify(watchedMovies)
      );
    } catch {
      // Watched movies remain usable in memory when storage is unavailable.
    }
  }, [watchedMovies]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        WATCHLIST_META_KEY,
        JSON.stringify(watchlistMetadata)
      );
    } catch {
      // Personal fields remain usable in memory when storage is unavailable.
    }
  }, [watchlistMetadata]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === null) {
        setWatchlist([]);
        setWatchedMovies([]);
        setWatchlistMetadata({});
        return;
      }

      if (event.key === WATCHLIST_KEY) {
        setWatchlist(parseWatchlist(event.newValue));
      }

      if (event.key === WATCHED_KEY) {
        setWatchedMovies(parseWatchlist(event.newValue));
      }

      if (event.key === WATCHLIST_META_KEY) {
        setWatchlistMetadata(parseMetadata(event.newValue));
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const toggleWatchlist = useCallback((movie) => {
    if (!movie?.id) return;

    const movieIndex = watchlist.findIndex(
      (item) => item.id === movie.id
    );
    const movieTitle = movie.title || "Movie";

    if (movieIndex >= 0) {
      setWatchlist((currentWatchlist) =>
        currentWatchlist.filter((item) => item.id !== movie.id)
      );

      notify({
        message: `${movieTitle} removed from Want to watch.`,
        actionLabel: "Undo",
        onAction: () => {
          setWatchlist((currentWatchlist) => {
            if (
              currentWatchlist.some((item) => item.id === movie.id)
            ) {
              return currentWatchlist;
            }

            const nextWatchlist = [...currentWatchlist];
            nextWatchlist.splice(
              Math.min(movieIndex, nextWatchlist.length),
              0,
              movie
            );
            return nextWatchlist;
          });
        },
      });
      return;
    }

    setWatchlist((currentWatchlist) => [movie, ...currentWatchlist]);
    setWatchlistMetadata((currentMetadata) => ({
      ...currentMetadata,
      [movie.id]:
        currentMetadata[movie.id] || createDefaultMetadata(),
    }));
    notify({
      message: `${movieTitle} added to Want to watch.`,
      tone: "success",
    });
  }, [notify, watchlist]);

  const clearWatchlist = useCallback(() => {
    if (!watchlist.length) return;

    const previousWatchlist = watchlist;
    setWatchlist([]);
    notify({
      message: "Want to watch was cleared.",
      actionLabel: "Undo",
      onAction: () => {
        setWatchlist(previousWatchlist);
      },
    });
  }, [notify, watchlist]);

  const restoreWatchlist = useCallback((movies, metadata = {}) => {
    setWatchlist(Array.isArray(movies) ? movies : []);
    setWatchlistMetadata(
      metadata && typeof metadata === "object" ? metadata : {}
    );
  }, []);

  const updateWatchlistMeta = useCallback((movieId, patch) => {
    if (!movieId || !patch || typeof patch !== "object") return;

    const requestedStatus =
      patch.status === "watched" || patch.status === "want"
        ? patch.status
        : null;
    const metadataPatch = { ...patch };
    delete metadataPatch.status;
    const movie =
      watchlist.find((item) => item.id === movieId) ||
      watchedMovies.find((item) => item.id === movieId);

    if (requestedStatus && movie) {
      setWatchedMovies((currentMovies) => {
        const alreadyWatched = currentMovies.some(
          (item) => item.id === movieId
        );

        if (requestedStatus === "watched") {
          return alreadyWatched ? currentMovies : [movie, ...currentMovies];
        }

        return alreadyWatched
          ? currentMovies.filter((item) => item.id !== movieId)
          : currentMovies;
      });
    }

    setWatchlistMetadata((currentMetadata) => {
      const currentMovieMetadata = withoutLegacyStatus({
        ...createDefaultMetadata(),
        ...currentMetadata[movieId],
      });
      const statusPatch =
        requestedStatus === "watched"
          ? {
              watchedAt:
                currentMovieMetadata.watchedAt ||
                getTodayDateValue(),
            }
          : requestedStatus === "want"
            ? { watchedAt: "" }
            : {};

      return {
        ...currentMetadata,
        [movieId]: {
          ...currentMovieMetadata,
          ...statusPatch,
          ...metadataPatch,
        },
      };
    });

    const movieTitle = movie?.title || "Movie";

    if (requestedStatus) {
      notify({
        message:
          requestedStatus === "watched"
            ? `${movieTitle} marked as watched.`
            : `${movieTitle} removed from Watched.`,
        tone: "success",
      });
    } else if (
      Object.prototype.hasOwnProperty.call(
        patch,
        "personalRating"
      )
    ) {
      notify({
        message: patch.personalRating
          ? `Your rating for ${movieTitle} was saved.`
          : `Your rating for ${movieTitle} was removed.`,
        tone: "success",
      });
    }
  }, [notify, watchedMovies, watchlist]);

  const toggleWatched = useCallback((movie) => {
    if (!movie?.id) return;

    const isCurrentlyWatched =
      watchedMovies.some((item) => item.id === movie.id);
    const nextStatus = isCurrentlyWatched ? "want" : "watched";

    setWatchedMovies((currentMovies) =>
      isCurrentlyWatched
        ? currentMovies.filter((item) => item.id !== movie.id)
        : [movie, ...currentMovies]
    );

    setWatchlistMetadata((currentMetadata) => {
      const currentMovieMetadata = withoutLegacyStatus({
        ...createDefaultMetadata(),
        ...currentMetadata[movie.id],
      });

      return {
        ...currentMetadata,
        [movie.id]: {
          ...currentMovieMetadata,
          watchedAt:
            nextStatus === "watched"
              ? currentMovieMetadata.watchedAt || getTodayDateValue()
              : "",
        },
      };
    });

    notify({
      message:
        nextStatus === "watched"
          ? `${movie.title || "Movie"} marked as watched.`
          : `${movie.title || "Movie"} removed from Watched.`,
      tone: "success",
    });
  }, [notify, watchedMovies]);

  const clearWatched = useCallback(() => {
    if (!watchedMovies.length) return;

    const previousWatchedMovies = watchedMovies;
    const watchedIds = new Set(
      watchedMovies.map((movie) => String(movie.id))
    );
    const previousWatchedAt = Object.fromEntries(
      watchedMovies.map((movie) => [
        String(movie.id),
        watchlistMetadata[movie.id]?.watchedAt || "",
      ])
    );

    setWatchedMovies([]);
    setWatchlistMetadata((currentMetadata) =>
      Object.fromEntries(
        Object.entries(currentMetadata).map(([movieId, metadata]) => [
          movieId,
          watchedIds.has(movieId)
            ? {
                ...withoutLegacyStatus(metadata),
                watchedAt: "",
              }
            : withoutLegacyStatus(metadata),
        ])
      )
    );
    notify({
      message: "Watched was cleared.",
      actionLabel: "Undo",
      onAction: () => {
        setWatchedMovies(previousWatchedMovies);
        setWatchlistMetadata((currentMetadata) => {
          const nextMetadata = { ...currentMetadata };

          previousWatchedMovies.forEach((movie) => {
            nextMetadata[movie.id] = {
              ...createDefaultMetadata(),
              ...withoutLegacyStatus(currentMetadata[movie.id]),
              watchedAt: previousWatchedAt[String(movie.id)],
            };
          });

          return nextMetadata;
        });
      },
    });
  }, [notify, watchedMovies, watchlistMetadata]);

  const getWatchlistMeta = useCallback(
    (movieId) => ({
      personalRating: null,
      note: "",
      watchedAt: "",
      addedAt: "",
      ...watchlistMetadata[movieId],
      status: watchedMovies.some((movie) => movie.id === movieId)
        ? "watched"
        : "want",
    }),
    [watchedMovies, watchlistMetadata]
  );

  const isInWatchlist = useCallback(
    (movieId) =>
      watchlist.some((movie) => movie.id === movieId),
    [watchlist]
  );

  const isWatched = useCallback(
    (movieId) =>
      watchedMovies.some((movie) => movie.id === movieId),
    [watchedMovies]
  );

  const value = useMemo(
    () => ({
      watchlist,
      watchedMovies,
      setWatchlist,
      watchlistMetadata,
      toggleWatchlist,
      clearWatchlist,
      clearWatched,
      restoreWatchlist,
      updateWatchlistMeta,
      toggleWatched,
      getWatchlistMeta,
      isInWatchlist,
      isWatched,
    }),
    [
      clearWatchlist,
      clearWatched,
      getWatchlistMeta,
      isInWatchlist,
      isWatched,
      restoreWatchlist,
      toggleWatchlist,
      toggleWatched,
      updateWatchlistMeta,
      watchlist,
      watchlistMetadata,
      watchedMovies,
    ]
  );

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
};

export default WatchlistContext;
