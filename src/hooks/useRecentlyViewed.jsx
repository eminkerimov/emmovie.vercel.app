import { useCallback, useEffect, useState } from "react";

export const RECENTLY_VIEWED_KEY =
  "emmovie_recently_viewed";
const RECENTLY_VIEWED_LIMIT = 12;

const parseRecentlyViewed = (value) => {
  try {
    const parsedValue = value ? JSON.parse(value) : [];

    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
};

const getStoredMovies = () => {
  if (typeof window === "undefined") return [];

  try {
    return parseRecentlyViewed(
      window.localStorage.getItem(RECENTLY_VIEWED_KEY)
    );
  } catch {
    return [];
  }
};

const getMovieSummary = (movie) => ({
  id: movie.id,
  title: movie.title,
  poster_path: movie.poster_path,
  overview: movie.overview,
  vote_average: movie.vote_average,
  release_date: movie.release_date,
});

const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] =
    useState(getStoredMovies);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        RECENTLY_VIEWED_KEY,
        JSON.stringify(recentlyViewed)
      );
    } catch {
      // Browsing history remains available in memory.
    }
  }, [recentlyViewed]);

  const addRecentlyViewed = useCallback((movie) => {
    if (!movie?.id || !movie?.title) return;

    setRecentlyViewed((currentMovies) => [
      getMovieSummary(movie),
      ...currentMovies.filter(
        (currentMovie) => currentMovie.id !== movie.id
      ),
    ].slice(0, RECENTLY_VIEWED_LIMIT));
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
  }, []);

  return {
    recentlyViewed,
    addRecentlyViewed,
    clearRecentlyViewed,
  };
};

export default useRecentlyViewed;
