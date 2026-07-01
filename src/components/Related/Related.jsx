import React from "react";
import MovieCard from "../../components/MovieCard/MovieCard";

const Related = ({ data, watchlist, setWatchlist }) => {
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
    <section className="related">
      <div className="container">
        <div className="related__header">
          <span>DISCOVER</span>
          <h2>Related Movies</h2>
        </div>

        <div className="movie-container">
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