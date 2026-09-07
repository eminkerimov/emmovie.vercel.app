import { useCallback, useEffect, useState } from "react";

export const EPISODE_PROGRESS_KEY = "emmovie_episode_progress";

export const getSeasonProgressKey = (tvId, seasonNumber) => {
  const normalizedTvId = Number.parseInt(tvId, 10);
  const normalizedSeasonNumber = Number.parseInt(seasonNumber, 10);

  if (
    !Number.isInteger(normalizedTvId) ||
    normalizedTvId <= 0 ||
    !Number.isInteger(normalizedSeasonNumber) ||
    normalizedSeasonNumber < 0
  ) {
    return null;
  }

  return `${normalizedTvId}:${normalizedSeasonNumber}`;
};

const parseProgress = (value) => {
  try {
    const parsedValue = value ? JSON.parse(value) : {};

    if (
      !parsedValue ||
      typeof parsedValue !== "object" ||
      Array.isArray(parsedValue)
    ) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsedValue)
        .map(([seasonKey, episodeNumbers]) => [
          seasonKey,
          Array.isArray(episodeNumbers)
            ? [...new Set(
                episodeNumbers
                  .map((episodeNumber) => Number.parseInt(episodeNumber, 10))
                  .filter(
                    (episodeNumber) =>
                      Number.isInteger(episodeNumber) && episodeNumber > 0
                  )
              )].sort((first, second) => first - second)
            : [],
        ])
        .filter(([, episodeNumbers]) => episodeNumbers.length > 0)
    );
  } catch {
    return {};
  }
};

const readProgress = () => {
  if (typeof window === "undefined") return {};

  try {
    return parseProgress(
      window.localStorage.getItem(EPISODE_PROGRESS_KEY)
    );
  } catch {
    return {};
  }
};

const persistProgress = (progress) => {
  try {
    window.localStorage.setItem(
      EPISODE_PROGRESS_KEY,
      JSON.stringify(progress)
    );
  } catch {
    // Episode progress remains usable in memory when storage is unavailable.
  }
};

const useEpisodeProgress = () => {
  const [progress, setProgress] = useState(readProgress);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === null) {
        setProgress({});
        return;
      }

      if (event.key === EPISODE_PROGRESS_KEY) {
        setProgress(parseProgress(event.newValue));
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const updateProgress = useCallback((updater) => {
    setProgress((currentProgress) => {
      const nextProgress = updater(currentProgress);
      persistProgress(nextProgress);
      return nextProgress;
    });
  }, []);

  const isEpisodeWatched = useCallback(
    (tvId, seasonNumber, episodeNumber) => {
      const seasonKey = getSeasonProgressKey(tvId, seasonNumber);
      const normalizedEpisodeNumber = Number.parseInt(episodeNumber, 10);

      return Boolean(
        seasonKey &&
          Number.isInteger(normalizedEpisodeNumber) &&
          progress[seasonKey]?.includes(normalizedEpisodeNumber)
      );
    },
    [progress]
  );

  const toggleEpisode = useCallback(
    (tvId, seasonNumber, episodeNumber) => {
      const seasonKey = getSeasonProgressKey(tvId, seasonNumber);
      const normalizedEpisodeNumber = Number.parseInt(episodeNumber, 10);

      if (
        !seasonKey ||
        !Number.isInteger(normalizedEpisodeNumber) ||
        normalizedEpisodeNumber <= 0
      ) {
        return;
      }

      updateProgress((currentProgress) => {
        const currentEpisodes = currentProgress[seasonKey] || [];
        const isWatched = currentEpisodes.includes(normalizedEpisodeNumber);
        const nextEpisodes = isWatched
          ? currentEpisodes.filter(
              (currentEpisode) =>
                currentEpisode !== normalizedEpisodeNumber
            )
          : [...currentEpisodes, normalizedEpisodeNumber].sort(
              (first, second) => first - second
            );
        const nextProgress = { ...currentProgress };

        if (nextEpisodes.length) {
          nextProgress[seasonKey] = nextEpisodes;
        } else {
          delete nextProgress[seasonKey];
        }

        return nextProgress;
      });
    },
    [updateProgress]
  );

  const setSeasonWatched = useCallback(
    (tvId, seasonNumber, episodeNumbers, watched) => {
      const seasonKey = getSeasonProgressKey(tvId, seasonNumber);

      if (!seasonKey || !Array.isArray(episodeNumbers)) return;

      const normalizedEpisodeNumbers = [...new Set(
        episodeNumbers
          .map((episodeNumber) => Number.parseInt(episodeNumber, 10))
          .filter(
            (episodeNumber) =>
              Number.isInteger(episodeNumber) && episodeNumber > 0
          )
      )].sort((first, second) => first - second);

      updateProgress((currentProgress) => {
        const nextProgress = { ...currentProgress };

        if (watched && normalizedEpisodeNumbers.length) {
          nextProgress[seasonKey] = normalizedEpisodeNumbers;
        } else {
          delete nextProgress[seasonKey];
        }

        return nextProgress;
      });
    },
    [updateProgress]
  );

  const getSeasonProgress = useCallback(
    (tvId, seasonNumber, episodeCount = 0) => {
      const seasonKey = getSeasonProgressKey(tvId, seasonNumber);
      const total = Math.max(0, Number.parseInt(episodeCount, 10) || 0);
      const watchedEpisodes = seasonKey ? progress[seasonKey] || [] : [];
      const watched = total
        ? watchedEpisodes.filter((episodeNumber) => episodeNumber <= total)
            .length
        : watchedEpisodes.length;

      return {
        watched,
        total,
        percentage: total ? Math.round((watched / total) * 100) : 0,
        isComplete: total > 0 && watched === total,
      };
    },
    [progress]
  );

  return {
    progress,
    getSeasonProgress,
    isEpisodeWatched,
    setSeasonWatched,
    toggleEpisode,
  };
};

export default useEpisodeProgress;
