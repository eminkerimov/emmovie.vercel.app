import React, { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../../components/Loading/Loading";
import MovieCard from "../../components/MovieCard/MovieCard";
import { IMG_API, POSTER_API } from "../../helpers/baseURL";
import useWatchlist from "../../hooks/useWatchlist";
import useMovieCollection from "../Movie/useMovieCollection";
import "./index.scss";

const getReleaseTime = (movie) => {
  if (!movie?.release_date) return Number.POSITIVE_INFINITY;

  const releaseTime = Date.parse(`${movie.release_date}T00:00:00`);
  return Number.isNaN(releaseTime)
    ? Number.POSITIVE_INFINITY
    : releaseTime;
};

export const prepareCollectionMovies = (parts = []) => {
  const uniqueMovies = new Map();

  parts.forEach((movie) => {
    if (movie?.id && !uniqueMovies.has(movie.id)) {
      uniqueMovies.set(movie.id, movie);
    }
  });

  return Array.from(uniqueMovies.values()).sort(
    (firstMovie, secondMovie) =>
      getReleaseTime(firstMovie) - getReleaseTime(secondMovie) ||
      (firstMovie.title || "").localeCompare(secondMovie.title || "")
  );
};

const getReleaseSpan = (movies) => {
  const years = movies
    .map((movie) => Number.parseInt(movie.release_date?.slice(0, 4), 10))
    .filter(Number.isFinite)
    .sort((firstYear, secondYear) => firstYear - secondYear);

  if (!years.length) return "Release dates pending";
  if (years[0] === years[years.length - 1]) return `${years[0]}`;

  return `${years[0]}–${years[years.length - 1]}`;
};

const Collection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const request = useMovieCollection(id);
  const {
    toggleWatchlist,
    toggleWatched,
    isInWatchlist,
    isWatched,
  } = useWatchlist();
  const collection = request.data;
  const movies = useMemo(
    () => prepareCollectionMovies(collection?.parts),
    [collection]
  );

  useEffect(() => {
    document.title = collection?.name
      ? `${collection.name} | M-movie`
      : "Collection | M-movie";
  }, [collection?.name]);

  if (request.loading) {
    return (
      <main className="collection-page collection-page--state">
        <Loading />
      </main>
    );
  }

  if (request.error) {
    return (
      <main className="collection-page collection-page--state" role="alert">
        <div className="page-container collection-page__state">
          <span>Collection unavailable</span>
          <h1>This collection could not be loaded</h1>
          <p>Check your connection and return to the previous page.</p>
          <button type="button" onClick={() => navigate(-1)}>
            Go back
          </button>
        </div>
      </main>
    );
  }

  if (!collection?.id) {
    return (
      <main className="collection-page collection-page--state" role="status">
        <div className="page-container collection-page__state">
          <span>Collection unavailable</span>
          <h1>Collection not found</h1>
          <p>The requested collection does not exist or has been removed.</p>
          <button type="button" onClick={() => navigate(-1)}>
            Go back
          </button>
        </div>
      </main>
    );
  }

  const heroStyle = collection.backdrop_path
    ? {
        backgroundImage: `linear-gradient(90deg, rgba(5, 12, 17, 0.98) 0%, rgba(5, 12, 17, 0.86) 48%, rgba(5, 12, 17, 0.44) 100%), url(${IMG_API}${collection.backdrop_path})`,
      }
    : undefined;
  const movieCountLabel = `${movies.length} ${
    movies.length === 1 ? "film" : "films"
  }`;

  return (
    <main className="collection-page">
      <section
        className="collection-page__hero"
        style={heroStyle}
        aria-labelledby="collection-title"
      >
        <div className="page-container">
          <button
            className="collection-page__back"
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
            Back
          </button>

          <div className="collection-page__hero-layout">
            <div className="collection-page__hero-copy">
              <span className="collection-page__eyebrow">Collection archive</span>
              <h1 id="collection-title">{collection.name}</h1>
              <p>
                {collection.overview ||
                  "Explore every released title in this movie collection."}
              </p>

              <dl className="collection-page__facts">
                <div>
                  <dt>Titles</dt>
                  <dd>{movieCountLabel}</dd>
                </div>
                <div>
                  <dt>Timeline</dt>
                  <dd>{getReleaseSpan(movies)}</dd>
                </div>
              </dl>

              <a
                className="collection-page__tmdb-link"
                href={`https://www.themoviedb.org/collection/${collection.id}`}
                target="_blank"
                rel="noreferrer"
              >
                View on TMDB
                <i
                  className="fa-solid fa-arrow-up-right-from-square"
                  aria-hidden="true"
                ></i>
              </a>
            </div>

            {collection.poster_path && (
              <figure className="collection-page__poster">
                <img
                  src={POSTER_API + collection.poster_path}
                  alt={`${collection.name} collection poster`}
                  decoding="async"
                />
              </figure>
            )}
          </div>
        </div>
      </section>

      <section
        className="collection-page__catalog"
        aria-labelledby="collection-films-title"
      >
        <div className="page-container">
          <header className="collection-page__catalog-header">
            <div>
              <span>Chronological order</span>
              <h2 id="collection-films-title">Films in this collection</h2>
            </div>
            <p>{movieCountLabel}</p>
          </header>

          {movies.length > 0 ? (
            <div className="collection-page__grid">
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  {...movie}
                  isFavorite={isInWatchlist(movie.id)}
                  isWatched={isWatched(movie.id)}
                  onToggleFavorite={toggleWatchlist}
                  onToggleWatched={toggleWatched}
                />
              ))}
            </div>
          ) : (
            <div className="collection-page__empty" role="status">
              <i className="fa-solid fa-film" aria-hidden="true"></i>
              <h3>No films are listed yet</h3>
              <p>TMDB has not added any titles to this collection.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Collection;
