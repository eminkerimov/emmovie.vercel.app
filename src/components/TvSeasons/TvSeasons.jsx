import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { POSTER_API } from "../../helpers/baseURL";
import useEpisodeProgress from "../../hooks/useEpisodeProgress";
import Default from "../../images/Default.jpg";
import ProgressiveImage from "../ProgressiveImage/ProgressiveImage";
import "./TvSeasons.scss";

const INITIAL_SEASON_COUNT = 6;

const sortSeasons = (seasons) =>
  [...seasons].sort((first, second) => {
    if (first.season_number === 0) return 1;
    if (second.season_number === 0) return -1;
    return first.season_number - second.season_number;
  });

const TvSeasons = ({ data }) => {
  const [showAll, setShowAll] = useState(false);
  const { getSeasonProgress } = useEpisodeProgress();
  const seasons = useMemo(
    () =>
      sortSeasons(
        (Array.isArray(data?.seasons) ? data.seasons : []).filter(
          (season) => season?.season_number >= 0 && season?.episode_count > 0
        )
      ),
    [data?.seasons]
  );

  if (!data?.id || seasons.length === 0) return null;

  const visibleSeasons = showAll
    ? seasons
    : seasons.slice(0, INITIAL_SEASON_COUNT);

  return (
    <section
      className="movie-tv-seasons"
      aria-labelledby="movie-tv-seasons-title"
    >
      <div className="page-container">
        <header className="movie-section-heading movie-tv-seasons__heading">
          <div className="movie-section-heading__copy">
            <span className="movie-section-heading__eyebrow">
              Episode guide
            </span>
            <h2 id="movie-tv-seasons-title">Seasons</h2>
          </div>
          <span className="movie-section-heading__line" aria-hidden="true" />
          <p>
            {seasons.length} {seasons.length === 1 ? "season" : "seasons"}
          </p>
        </header>

        <div className="movie-tv-seasons__grid">
          {visibleSeasons.map((season) => {
            const seasonProgress = getSeasonProgress(
              data.id,
              season.season_number,
              season.episode_count
            );
            const seasonLabel =
              season.season_number === 0
                ? "Specials"
                : season.name || `Season ${season.season_number}`;

            return (
              <article
                className="movie-tv-season-card"
                key={season.id || season.season_number}
              >
                <Link
                  to={`/tv/${data.id}/season/${season.season_number}`}
                  aria-label={`Open ${seasonLabel} episode guide`}
                >
                  <div className="movie-tv-season-card__poster">
                    <ProgressiveImage
                      src={
                        season.poster_path
                          ? POSTER_API + season.poster_path
                          : Default
                      }
                      alt={season.poster_path ? `${seasonLabel} poster` : ""}
                      loading="lazy"
                      decoding="async"
                    />
                    <span>
                      {season.episode_count} {season.episode_count === 1 ? "episode" : "episodes"}
                    </span>
                  </div>

                  <div className="movie-tv-season-card__content">
                    <div>
                      <h3>{seasonLabel}</h3>
                      <span>
                        {season.air_date?.slice(0, 4) || "Date unknown"}
                      </span>
                    </div>

                    <div className="movie-tv-season-card__progress-copy">
                      <span>
                        {seasonProgress.watched} of {seasonProgress.total} watched
                      </span>
                      {seasonProgress.isComplete && <strong>Complete</strong>}
                    </div>
                    <span
                      className="movie-tv-season-card__progress"
                      role="progressbar"
                      aria-label={`${seasonLabel} viewing progress`}
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
                  </div>
                </Link>
              </article>
            );
          })}
        </div>

        {seasons.length > INITIAL_SEASON_COUNT && (
          <button
            className="movie-tv-seasons__toggle"
            type="button"
            aria-expanded={showAll}
            onClick={() => setShowAll((currentValue) => !currentValue)}
          >
            {showAll ? "Show fewer seasons" : `Show all ${seasons.length} seasons`}
          </button>
        )}
      </div>
    </section>
  );
};

export default TvSeasons;
