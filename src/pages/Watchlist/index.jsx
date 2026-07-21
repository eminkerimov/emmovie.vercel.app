import React from "react";
import { Link } from "react-router-dom";
import MovieCard from "../../components/MovieCard/MovieCard";
import useWatchlist from "../../hooks/useWatchlist";
import "./index.scss";

const Watchlist = () => {
  const {
    watchlist,
    toggleWatchlist,
    clearWatchlist,
    isInWatchlist,
  } = useWatchlist();

  return (
    <div className="watchlist-page">
      <main className="watchlist-layout">
        <section className="watchlist-hero">
          <div className="watchlist-hero__content">
            <span>Saved collection</span>

            <h1>Watchlist</h1>

            <p>
              Keep your saved movies in one place
              and return to them whenever you want.
            </p>
          </div>

          {watchlist.length > 0 && (
            <div className="watchlist-hero__actions">
              <div className="watchlist-hero__count">
                <strong>{watchlist.length}</strong>

                <span>
                  {watchlist.length === 1
                    ? "saved movie"
                    : "saved movies"}
                </span>
              </div>

              <button
                type="button"
                onClick={clearWatchlist}
              >
                Clear watchlist
              </button>
            </div>
          )}
        </section>

        {watchlist.length > 0 ? (
          <section className="watchlist-content">
            <div className="watchlist-grid">
              {watchlist.map((movie) => (
                <MovieCard
                  key={movie.id}
                  {...movie}
                  isFavorite={isInWatchlist(
                    movie.id
                  )}
                  onToggleFavorite={
                    toggleWatchlist
                  }
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="watchlist-empty">
            <div className="watchlist-empty__icon">
              <i className="fa-regular fa-heart"></i>
            </div>

            <span>Your collection is empty</span>

            <h2>No saved movies yet</h2>

            <p>
              Explore the catalogue and use the
              heart button to save movies here.
            </p>

            <Link to="/discover">
              Discover movies
              <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </section>
        )}
      </main>
    </div>
  );
};

export default Watchlist;