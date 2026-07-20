import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MovieCard from "../../components/MovieCard/MovieCard";
import useWatchlist from "../../hooks/useWatchlist";
import HomeHeader from "../Home/components/HomeHeader";
import "./index.scss";

const Watchlist = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const {
    watchlist,
    toggleWatchlist,
    clearWatchlist,
    isInWatchlist,
  } = useWatchlist();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="watchlist-page">
      <HomeHeader
        menuOpen={menuOpen}
        isScrolled={isScrolled}
        onMenuToggle={() =>
          setMenuOpen((currentValue) => !currentValue)
        }
        onMenuClose={() => setMenuOpen(false)}
      />

      <main className="watchlist-layout">
        <section className="watchlist-hero">
          <div className="watchlist-hero__content">
            <span>Saved collection</span>

            <h1>Watchlist</h1>

            <p>
              Keep your saved movies in one place and return to
              them whenever you want.
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
                  isFavorite={isInWatchlist(movie.id)}
                  onToggleFavorite={toggleWatchlist}
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
              Explore the catalogue and use the heart button to
              save movies here.
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