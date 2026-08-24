import React from "react";
import MovieCard from "../../components/MovieCard/MovieCard";
import useReveal from "../../hooks/useReveal";

const Related = ({ data, watchlist, setWatchlist }) => {
  const { elementRef, isVisible } = useReveal();
  const toggleWatchlist = (movie) => {
    setWatchlist((prev) => {
      const alreadySaved = prev.some((item) => item.id === movie.id);

      if (alreadySaved) {
        return prev.filter((item) => item.id !== movie.id);
      }

      return [movie, ...prev];
    });
  };

  const isInWatchlist = (movieId) => {
    return watchlist.some((movie) => movie.id === movieId);
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
            <span className="movie-section-heading__eyebrow">Discover</span>
            <h2 id="related-movies-title">Related Movies</h2>
          </div>

          <span className="movie-section-heading__line" aria-hidden="true"></span>
        </header>

        <div className="related__grid movie-section-content">
          {data?.results?.slice(0, 5).map((movie) => (
            <MovieCard
              key={movie.id}
              {...movie}
              isFavorite={isInWatchlist(movie.id)}
              onToggleFavorite={toggleWatchlist}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Related;
