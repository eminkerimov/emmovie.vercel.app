import React, { useEffect, useId, useRef, useState } from "react";
import Default from "../../images/Default.jpg";
import { Link } from "react-router-dom";
import { POSTER_API } from "../../helpers/baseURL";
import "./MovieCard.scss";

const setVoteClass = (vote) => {
  if (vote >= 8) return "rating-high";
  if (vote >= 6) return "rating-medium";
  return "rating-low";
};

const LibraryIcon = () => (
  <svg
    className="movieCard-library-icon"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="5" cy="12" r="1.75" fill="currentColor" />
    <circle cx="12" cy="12" r="1.75" fill="currentColor" />
    <circle cx="19" cy="12" r="1.75" fill="currentColor" />
  </svg>
);

export const MovieLibraryMenu = ({
  title,
  isFavorite = false,
  isWatched = false,
  onToggleFavorite,
  onToggleWatched,
  variant = "card",
}) => {
  const [libraryMenuOpen, setLibraryMenuOpen] = useState(false);
  const libraryControlsRef = useRef(null);
  const libraryTriggerRef = useRef(null);
  const libraryMenuId = useId();
  const hasLibraryActions = onToggleFavorite || onToggleWatched;

  useEffect(() => {
    if (!libraryMenuOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (!libraryControlsRef.current?.contains(event.target)) {
        setLibraryMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key !== "Escape") return;

      setLibraryMenuOpen(false);
      libraryTriggerRef.current?.focus();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [libraryMenuOpen]);

  if (!hasLibraryActions) return null;

  return (
    <div
      className={`movieCard-library-controls${
        variant === "hero" ? " movieCard-library-controls--hero" : ""
      }`}
      ref={libraryControlsRef}
    >
      <button
        ref={libraryTriggerRef}
        className="movieCard-library-trigger"
        type="button"
        onClick={() => setLibraryMenuOpen((isOpen) => !isOpen)}
        aria-label={`Manage ${title} in My Library`}
        aria-haspopup="menu"
        aria-expanded={libraryMenuOpen}
        aria-controls={libraryMenuId}
      >
        <LibraryIcon />
      </button>

      {libraryMenuOpen && (
        <div
          id={libraryMenuId}
          className="movieCard-library-menu"
          role="menu"
          aria-label={`${title} library lists`}
        >
          {onToggleFavorite && (
            <button
              className={`movieCard-library-menu__item movieCard-library-menu__item--want ${
                isFavorite ? "is-selected" : ""
              }`}
              type="button"
              role="menuitemcheckbox"
              aria-checked={isFavorite}
              onClick={onToggleFavorite}
            >
              <span
                className="movieCard-library-menu__check"
                aria-hidden="true"
              ></span>
              <span>Want to watch</span>
            </button>
          )}

          {onToggleWatched && (
            <button
              className={`movieCard-library-menu__item movieCard-library-menu__item--watched ${
                isWatched ? "is-selected" : ""
              }`}
              type="button"
              role="menuitemcheckbox"
              aria-checked={isWatched}
              onClick={onToggleWatched}
            >
              <span
                className="movieCard-library-menu__check"
                aria-hidden="true"
              ></span>
              <span>Watched</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const MovieCard = ({
  title,
  poster_path,
  overview,
  vote_average,
  release_date,
  id,
  isFavorite = false,
  isWatched = false,
  onToggleFavorite,
  onToggleWatched,
}) => {
  const year = release_date ? release_date.slice(0, 4) : "N/A";

  const handleFavoriteClick = () => {
    if (onToggleFavorite) {
      onToggleFavorite({
        id,
        title,
        poster_path,
        overview,
        vote_average,
        release_date,
      });
    }
  };

  const handleWatchedClick = () => {
    if (onToggleWatched) {
      onToggleWatched({
        id,
        title,
        poster_path,
        overview,
        vote_average,
        release_date,
      });
    }
  };

  return (
    <article className="movieCard">
      <MovieLibraryMenu
        title={title}
        isFavorite={isFavorite}
        isWatched={isWatched}
        onToggleFavorite={onToggleFavorite ? handleFavoriteClick : undefined}
        onToggleWatched={onToggleWatched ? handleWatchedClick : undefined}
      />

      <Link
        className="movieCard-link"
        to={`/movie/${id}`}
        aria-label={`Open ${title} movie details`}
      >
        <div className="movieCard-poster">
          <img
            src={poster_path ? POSTER_API + poster_path : Default}
            alt={`${title} poster`}
            loading="lazy"
            decoding="async"
          />

          <div className="movieCard-over" aria-hidden="true">
            <span className="movieCard-over__label">Quick look</span>
            <p>{overview || "No synopsis available."}</p>
            <span className="movieCard-over__action">
              View details
              <i className="fa-solid fa-arrow-right"></i>
            </span>
          </div>
        </div>

        <div className="movieCard-info">
          <div>
            <h3>{title}</h3>
            <span className="movieCard-year">{year}</span>
          </div>

          {vote_average > 0 && (
            <span
              className={`movieCard-rating ${setVoteClass(vote_average)}`}
              aria-label={`Rating ${vote_average.toFixed(1)} out of 10`}
            >
              {vote_average.toFixed(1)}
            </span>
          )}
        </div>
      </Link>
    </article>
  );
};

export default MovieCard;
