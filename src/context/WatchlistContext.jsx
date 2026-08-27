import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNotifications } from "./NotificationContext";

export const WATCHLIST_KEY = "emmovie_watchlist";
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
  status: "want",
  personalRating: null,
  note: "",
  watchedAt: "",
  addedAt: new Date().toISOString(),
});

const getTodayDateValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const WatchlistProvider = ({ children }) => {
  const { notify } = useNotifications();
  const [watchlist, setWatchlist] = useState(() =>
    readStorage(WATCHLIST_KEY, parseWatchlist)
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
        setWatchlistMetadata({});
        return;
      }

      if (event.key === WATCHLIST_KEY) {
        setWatchlist(parseWatchlist(event.newValue));
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
      const removedMetadata =
        watchlistMetadata[movie.id] || createDefaultMetadata();

      setWatchlist((currentWatchlist) =>
        currentWatchlist.filter((item) => item.id !== movie.id)
      );
      setWatchlistMetadata((currentMetadata) => {
        const nextMetadata = { ...currentMetadata };
        delete nextMetadata[movie.id];
        return nextMetadata;
      });

      notify({
        message: `${movieTitle} removed from My Library.`,
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
          setWatchlistMetadata((currentMetadata) => ({
            ...currentMetadata,
            [movie.id]: removedMetadata,
          }));
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
      message: `${movieTitle} added to My Library.`,
      tone: "success",
    });
  }, [notify, watchlist, watchlistMetadata]);

  const clearWatchlist = useCallback(() => {
    if (!watchlist.length) return;

    const previousWatchlist = watchlist;
    const previousMetadata = watchlistMetadata;

    setWatchlist([]);
    setWatchlistMetadata({});
    notify({
      message: "My Library was cleared.",
      actionLabel: "Undo",
      onAction: () => {
        setWatchlist(previousWatchlist);
        setWatchlistMetadata(previousMetadata);
      },
    });
  }, [notify, watchlist, watchlistMetadata]);

  const restoreWatchlist = useCallback((movies, metadata = {}) => {
    setWatchlist(Array.isArray(movies) ? movies : []);
    setWatchlistMetadata(
      metadata && typeof metadata === "object" ? metadata : {}
    );
  }, []);

  const updateWatchlistMeta = useCallback((movieId, patch) => {
    if (!movieId || !patch || typeof patch !== "object") return;

    setWatchlistMetadata((currentMetadata) => {
      const currentMovieMetadata = {
        ...createDefaultMetadata(),
        ...currentMetadata[movieId],
      };
      const statusPatch =
        patch.status === "watched"
          ? {
              watchedAt:
                currentMovieMetadata.watchedAt ||
                getTodayDateValue(),
            }
          : patch.status === "want"
            ? { watchedAt: "" }
            : {};

      return {
        ...currentMetadata,
        [movieId]: {
          ...currentMovieMetadata,
          ...statusPatch,
          ...patch,
        },
      };
    });

    const movieTitle =
      watchlist.find((movie) => movie.id === movieId)?.title ||
      "Movie";

    if (Object.prototype.hasOwnProperty.call(patch, "status")) {
      notify({
        message:
          patch.status === "watched"
            ? `${movieTitle} marked as watched.`
            : `${movieTitle} moved to Want to watch.`,
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
  }, [notify, watchlist]);

  const getWatchlistMeta = useCallback(
    (movieId) => ({
      status: "want",
      personalRating: null,
      note: "",
      watchedAt: "",
      addedAt: "",
      ...watchlistMetadata[movieId],
    }),
    [watchlistMetadata]
  );

  const isInWatchlist = useCallback(
    (movieId) =>
      watchlist.some((movie) => movie.id === movieId),
    [watchlist]
  );

  const value = useMemo(
    () => ({
      watchlist,
      setWatchlist,
      watchlistMetadata,
      toggleWatchlist,
      clearWatchlist,
      restoreWatchlist,
      updateWatchlistMeta,
      getWatchlistMeta,
      isInWatchlist,
    }),
    [
      clearWatchlist,
      getWatchlistMeta,
      isInWatchlist,
      restoreWatchlist,
      toggleWatchlist,
      updateWatchlistMeta,
      watchlist,
      watchlistMetadata,
    ]
  );

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
};

export default WatchlistContext;
