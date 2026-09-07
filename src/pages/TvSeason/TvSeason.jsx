import React, { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import ProgressiveImage from "../../components/ProgressiveImage/ProgressiveImage";
import { API_KEY, IMG_API, POSTER_API } from "../../helpers/baseURL";
import useFetch from "../../helpers/useFetch";
import useEpisodeProgress from "../../hooks/useEpisodeProgress";
import "./TvSeason.scss";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const formatDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return "Date unknown";

  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? "Date unknown"
    : DATE_FORMATTER.format(date);
};

const TvSeason = () => {
  const { id, seasonNumber } = useParams();
  const seriesRequest = useFetch(
    `${id}?${API_KEY}&language=en-US`,
    "tv"
  );
  const seasonRequest = useFetch(
    `${id}/season/${seasonNumber}?${API_KEY}&language=en-US`,
    "tv"
  );
  const {
    getSeasonProgress,
    isEpisodeWatched,
    setSeasonWatched,
    toggleEpisode,
  } = useEpisodeProgress();
  const season = seasonRequest.data;
  const series = seriesRequest.data;
  const episodes = useMemo(
    () =>
      [...(Array.isArray(season?.episodes) ? season.episodes : [])].sort(
        (first, second) => first.episode_number - second.episode_number
      ),
    [season?.episodes]
  );
  const episodeNumbers = useMemo(
    () => episodes.map((episode) => episode.episode_number),
    [episodes]
  );
  const seasonProgress = getSeasonProgress(
    id,
    seasonNumber,
    episodes.length
  );
  const seriesTitle = series?.name || series?.title || "Series";
  const parsedSeasonNumber = Number.parseInt(seasonNumber, 10);
  const seasonTitle =
    season?.name ||
    (parsedSeasonNumber === 0
      ? "Specials"
      : `Season ${parsedSeasonNumber || seasonNumber}`);

  useEffect(() => {
    if (!season) return;

    document.title = `${seriesTitle}: ${seasonTitle} | M-movie`;
  }, [season, seasonTitle, seriesTitle]);

  if (seasonRequest.loading) {
    return (
      <main className="tv-season-page tv-season-page--state" role="status">
        <div className="page-container tv-season-page__state">
          <span className="tv-season-page__state-mark" aria-hidden="true" />
          <h1>Loading season</h1>
          <p>Preparing the episode guide.</p>
        </div>
      </main>
    );
  }

  if (seasonRequest.error) {
    return (
      <main className="tv-season-page tv-season-page--state" role="alert">
        <div className="page-container tv-season-page__state">
          <h1>Season could not be loaded</h1>
          <p>Check your connection and return to the series page.</p>
          <Link to={`/tv/${id}`}>Back to series</Link>
        </div>
      </main>
    );
  }

  if (!season) {
    return (
      <main className="tv-season-page tv-season-page--state" role="status">
        <div className="page-container tv-season-page__state">
          <h1>Season not found</h1>
          <p>The requested episode guide is unavailable.</p>
          <Link to={`/tv/${id}`}>Back to series</Link>
        </div>
      </main>
    );
  }

  const headerStyle = series?.backdrop_path
    ? {
        backgroundImage: `linear-gradient(90deg, rgba(5, 11, 16, 0.98), rgba(5, 11, 16, 0.72)), url(${IMG_API}${series.backdrop_path})`,
      }
    : undefined;

  return (
    <main className="tv-season-page">
      <header className="tv-season-hero" style={headerStyle}>
        <div className="page-container">
          <Link className="tv-season-hero__back" to={`/tv/${id}`}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true" />
            Back to {seriesTitle}
          </Link>

          <div className="tv-season-hero__layout">
            <div className="tv-season-hero__poster">
              {season.poster_path || series?.poster_path ? (
                <ProgressiveImage
                  src={`${POSTER_API}${season.poster_path || series.poster_path}`}
                  alt={`${seasonTitle} poster`}
                  decoding="async"
                />
              ) : (
                <span aria-hidden="true">
                  <i className="fa-solid fa-film" />
                </span>
              )}
            </div>

            <div className="tv-season-hero__content">
              <span className="tv-season-hero__eyebrow">{seriesTitle}</span>
              <h1>{seasonTitle}</h1>
              <div className="tv-season-hero__meta">
                <span>{formatDate(season.air_date)}</span>
                <span>
                  {episodes.length} {episodes.length === 1 ? "episode" : "episodes"}
                </span>
              </div>
              <p>
                {season.overview ||
                  `Browse every episode from ${seasonTitle} and track your progress locally.`}
              </p>

              {episodes.length > 0 && (
                <div className="tv-season-hero__progress-panel">
                  <div>
                    <span>Season progress</span>
                    <strong>
                      {seasonProgress.watched} / {seasonProgress.total}
                    </strong>
                  </div>
                  <span
                    className="tv-season-hero__progress"
                    role="progressbar"
                    aria-label={`${seasonTitle} viewing progress`}
                    aria-valuemin="0"
                    aria-valuemax={seasonProgress.total}
                    aria-valuenow={seasonProgress.watched}
                  >
                    <span
                      style={{
                        "--season-progress": `${seasonProgress.percentage}%`,
                      }}
                    />
                  </span>
                  <button
                    type="button"
                    aria-pressed={seasonProgress.isComplete}
                    onClick={() =>
                      setSeasonWatched(
                        id,
                        seasonNumber,
                        episodeNumbers,
                        !seasonProgress.isComplete
                      )
                    }
                  >
                    {seasonProgress.isComplete
                      ? "Clear season progress"
                      : "Mark season watched"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <section
        className="tv-season-episodes"
        aria-labelledby="tv-season-episodes-title"
      >
        <div className="page-container">
          <header className="tv-season-episodes__heading">
            <div>
              <span>Episode guide</span>
              <h2 id="tv-season-episodes-title">Episodes</h2>
            </div>
            <p>{seasonProgress.percentage}% complete</p>
          </header>

          {episodes.length > 0 ? (
            <ol className="tv-season-episodes__list">
              {episodes.map((episode) => {
                const watched = isEpisodeWatched(
                  id,
                  seasonNumber,
                  episode.episode_number
                );
                const episodeTitle =
                  episode.name || `Episode ${episode.episode_number}`;

                return (
                  <li key={episode.id || episode.episode_number}>
                    <article
                      className={`tv-episode-card ${watched ? "is-watched" : ""}`}
                    >
                      <div className="tv-episode-card__still">
                        {episode.still_path ? (
                          <ProgressiveImage
                            src={`${POSTER_API}${episode.still_path}`}
                            alt={`${episodeTitle} still`}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <span aria-hidden="true">
                            <i className="fa-solid fa-film" />
                          </span>
                        )}
                        <strong>
                          {String(episode.episode_number).padStart(2, "0")}
                        </strong>
                      </div>

                      <div className="tv-episode-card__content">
                        <div className="tv-episode-card__title-row">
                          <div>
                            <span>Episode {episode.episode_number}</span>
                            <h3>{episodeTitle}</h3>
                          </div>
                          <button
                            type="button"
                            className={watched ? "is-active" : ""}
                            aria-pressed={watched}
                            aria-label={`Mark ${episodeTitle} as ${
                              watched ? "unwatched" : "watched"
                            }`}
                            onClick={() =>
                              toggleEpisode(
                                id,
                                seasonNumber,
                                episode.episode_number
                              )
                            }
                          >
                            <i
                              className={watched ? "fa-solid fa-check" : "fa-regular fa-eye"}
                              aria-hidden="true"
                            />
                            {watched ? "Watched" : "Mark watched"}
                          </button>
                        </div>

                        <div className="tv-episode-card__meta">
                          <time dateTime={episode.air_date || undefined}>
                            {formatDate(episode.air_date)}
                          </time>
                          {episode.runtime > 0 && <span>{episode.runtime} min</span>}
                          {episode.vote_average > 0 && (
                            <span>
                              <i className="fa-solid fa-star" aria-hidden="true" />
                              {episode.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>

                        <p>
                          {episode.overview || "No episode overview is available."}
                        </p>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="tv-season-episodes__empty" role="status">
              <h3>No episodes listed</h3>
              <p>TMDB has not published an episode guide for this season.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default TvSeason;
