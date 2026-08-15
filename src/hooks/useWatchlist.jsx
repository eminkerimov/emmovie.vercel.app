import { useCallback, useEffect, useState } from "react";

const WATCHLIST_KEY = "emmovie_watchlist";

const parseWatchlist = (value) => {
  try {
    const parsedWatchlist = value ? JSON.parse(value) : [];

    return Array.isArray(parsedWatchlist) ? parsedWatchlist : [];
  } catch {
    return [];
  }
};

const getStoredWatchlist = () => {
  if (typeof window === "undefined") return [];

  try {
    return parseWatchlist(localStorage.getItem(WATCHLIST_KEY));
  } catch {
    return [];
  }
};

const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState(getStoredWatchlist);

  useEffect(() => {
    try {
      localStorage.setItem(
        WATCHLIST_KEY,
        JSON.stringify(watchlist)
      );
    } catch {
      // Keep the in-memory watchlist usable if storage is unavailable.
    }
  }, [watchlist]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === WATCHLIST_KEY) {
        setWatchlist(parseWatchlist(event.newValue));
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const toggleWatchlist = useCallback((movie) => {
    setWatchlist((currentWatchlist) => {
      const movieExists = currentWatchlist.some(
        (item) => item.id === movie.id
      );

      if (movieExists) {
        return currentWatchlist.filter(
          (item) => item.id !== movie.id
        );
      }

      return [movie, ...currentWatchlist];
    });
  }, []);

  const clearWatchlist = useCallback(() => {
    setWatchlist([]);
  }, []);

  const isInWatchlist = useCallback(
    (movieId) => {
      return watchlist.some((movie) => movie.id === movieId);
    },
    [watchlist]
  );

  return {
    watchlist,
    setWatchlist,
    toggleWatchlist,
    clearWatchlist,
    isInWatchlist,
  };
};

export default useWatchlist;
