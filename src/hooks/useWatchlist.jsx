import { useEffect, useState } from "react";

const WATCHLIST_KEY = "emmovie_watchlist";

const getStoredWatchlist = () => {
  try {
    const savedWatchlist = localStorage.getItem(WATCHLIST_KEY);

    return savedWatchlist ? JSON.parse(savedWatchlist) : [];
  } catch {
    return [];
  }
};

const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState(getStoredWatchlist);

  useEffect(() => {
    localStorage.setItem(
      WATCHLIST_KEY,
      JSON.stringify(watchlist)
    );
  }, [watchlist]);

  const toggleWatchlist = (movie) => {
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
  };

  const clearWatchlist = () => {
    setWatchlist([]);
  };

  const isInWatchlist = (movieId) => {
    return watchlist.some((movie) => movie.id === movieId);
  };

  return {
    watchlist,
    toggleWatchlist,
    clearWatchlist,
    isInWatchlist,
  };
};

export default useWatchlist;