import React, { useMemo } from "react";
import MovieCard from "../../components/MovieCard/MovieCard";
import { IMG_API } from "../../helpers/baseURL";
import useReveal from "../../hooks/useReveal";

const MovieCollection = ({
  collection,
  currentMovieId,
  request,
  toggleWatchlist,
  toggleWatched,
  watchlist,
  isWatched,
}) => {
  const { elementRef, isVisible } = useReveal();
  const collectionData = request.data;
  const title = collectionData?.name || collection?.name;
  const backdropPath =
    collectionData?.backdrop_path || collection?.backdrop_path;
  const parts = useMemo(
    () =>
      [...(collectionData?.parts || [])]
        .filter(
          (part) =>
            part.id !== Number(currentMovieId) && part.poster_path
        )
        .sort((first, second) =>
          (first.release_date || "9999").localeCompare(
            second.release_date || "9999"
          )
        )
        .slice(0, 5),
    [collectionData, currentMovieId]
  );

  if (!collection) return null;

  return (
    <section
      ref={elementRef}
      className={`movie-collection movie-section-reveal ${
        isVisible ? "is-visible" : ""
      }`}
      aria-labelledby="movie-collection-title"
    >
      <div className="page-container">
        <div
          className="movie-collection__banner movie-section-content"
          style={
            backdropPath
              ? {
                  backgroundImage: `linear-gradient(90deg, rgba(5, 11, 16, 0.97), rgba(5, 11, 16, 0.78) 58%, rgba(5, 11, 16, 0.3)), url(${IMG_API}${backdropPath})`,
                }
              : undefined
          }
        >
          <div className="movie-collection__copy">
            <span>Franchise</span>
            <h2 id="movie-collection-title">Part of {title}</h2>
            {collectionData?.overview && <p>{collectionData.overview}</p>}
            <a
              href={`https://www.themoviedb.org/collection/${collection.id}`}
              target="_blank"
              rel="noreferrer"
            >
              Explore collection on TMDB
              <i
                className="fa-solid fa-arrow-up-right-from-square"
                aria-hidden="true"
              ></i>
            </a>
          </div>
        </div>

        {request.loading ? (
          <p className="movie-collection__status" role="status">
            Loading the collection…
          </p>
        ) : request.error ? (
          <p className="movie-collection__status" role="status">
            Collection titles are temporarily unavailable.
          </p>
        ) : parts.length ? (
          <div className="movie-collection__grid">
            {parts.map((movie) => (
              <MovieCard
                key={movie.id}
                {...movie}
                isFavorite={watchlist.some(
                  (savedMovie) => savedMovie.id === movie.id
                )}
                isWatched={isWatched?.(movie.id) || false}
                onToggleFavorite={toggleWatchlist}
                onToggleWatched={toggleWatched}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default MovieCollection;
