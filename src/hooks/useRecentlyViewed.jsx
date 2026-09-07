import { useCallback, useEffect, useState } from "react";
import {
  getLibraryItemKey,
  getMediaSummary,
  getMediaTitle,
} from "../helpers/media";

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
    if (!movie?.id || !getMediaTitle(movie)) return;

    const movieKey = getLibraryItemKey(movie);

    setRecentlyViewed((currentMovies) => [
      getMediaSummary(movie),
      ...currentMovies.filter(
        (currentMovie) => getLibraryItemKey(currentMovie) !== movieKey
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
