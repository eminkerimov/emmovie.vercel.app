import React from "react";
import MovieCard from "../../components/MovieCard/MovieCard";
import useReveal from "../../hooks/useReveal";

const Related = ({
  data,
  error = false,
  loading = false,
  mode = "recommendations",
  watchlist,
  isInWatchlist: checkWatchlist,
  toggleWatchlist,
  toggleWatched,
  isWatched,
  mediaType = "movie",
}) => {
  const { elementRef, isVisible } = useReveal();
  const movies = data?.results?.slice(0, 5) || [];

  const isInWatchlist = (movieId) => {
    if (checkWatchlist) return checkWatchlist(movieId, mediaType);

    return watchlist.some(
      (movie) => movie.id === movieId && (movie.media_type || "movie") === mediaType
    );
  };

  return (
    <section
      ref={elementRef}
      className={`related movie-section-reveal ${
        isVisible ? "is-visible" : ""
      }`}
      aria-labelledby="related-movies-title"
    >
      <div className="page-container">
        <header className="movie-section-heading related__header">
          <div className="movie-section-heading__copy">
            <span className="movie-section-heading__eyebrow">Next watch</span>
            <h2 id="related-movies-title">
              {mode === "recommendations"
                ? "Recommendations"
                : mediaType === "tv"
                ? "Similar series"
                : "Similar Movies"}
            </h2>
          </div>

          <span className="movie-section-heading__line" aria-hidden="true"></span>
        </header>

        {loading ? (
          <p className="related__status movie-section-content" role="status">
            Loading movie suggestions…
          </p>
        ) : error ? (
          <p className="related__status movie-section-content" role="status">
            Movie suggestions are temporarily unavailable.
          </p>
        ) : movies.length ? (
          <div className="related__grid movie-section-content">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                {...movie}
                media_type={mediaType}
                isFavorite={isInWatchlist(movie.id)}
                isWatched={isWatched?.(movie.id, mediaType) || false}
                onToggleFavorite={toggleWatchlist}
                onToggleWatched={toggleWatched}
              />
            ))}
          </div>
        ) : (
          <p className="related__status movie-section-content" role="status">
            No suggestions are available for this movie yet.
          </p>
        )}
      </div>
    </section>
  );
};

export default Related;
