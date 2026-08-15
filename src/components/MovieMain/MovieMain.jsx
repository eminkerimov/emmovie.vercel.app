import React, { useEffect, useRef, useState } from "react";
import Default from "../../images/Default.jpg";
import {
  IMG_API,
  POSTER_API,
  PROFILE_API,
} from "../../helpers/baseURL.js";
import { Link, useNavigate } from "react-router-dom";

const MovieMain = ({ data, details, videos, watchlist, toggleWatchlist }) => {
  const navigate = useNavigate();

  const [trailerOpen, setTrailerOpen] = useState(false);
  const trailerButtonRef = useRef(null);
  const trailerDialogRef = useRef(null);

  const year = data?.release_date ? data.release_date.slice(0, 4) : "";
  const rating = data?.vote_average ? data.vote_average.toFixed(1) : "—";
  const popularity = data?.popularity ? data.popularity.toFixed(0) : "—";
  const trailerKey = videos?.[0]?.key;
  const isFavorite = watchlist?.some((movie) => movie.id === data?.id);

  useEffect(() => {
    if (!trailerOpen) return;

    const handleModalKeyDown = (e) => {
      if (e.key === "Escape") {
        setTrailerOpen(false);
        window.requestAnimationFrame(() => trailerButtonRef.current?.focus());
        return;
      }

      if (e.key !== "Tab") return;

      const focusableElements = trailerDialogRef.current?.querySelectorAll(
        'button:not([disabled]), iframe, [href], [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleModalKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleModalKeyDown);
    };
  }, [trailerOpen]);

  const closeTrailer = () => {
    setTrailerOpen(false);
    window.requestAnimationFrame(() => trailerButtonRef.current?.focus());
  };

  return (
    <>
      <section
        className="movie__main"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(8, 18, 25, 0.96) 0%, rgba(8, 18, 25, 0.78) 45%, rgba(8, 18, 25, 0.42) 100%), url(${
            data?.backdrop_path ? IMG_API + data.backdrop_path : Default
          })`,
        }}
      >
        <div className="page-container">
          <button
            className="movie__main__back"
            type="button"
            onClick={() => navigate(-1)}
          >
            <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
            <span>Back</span>
          </button>

          <div className="movie__main__content">
            <img
              className="movie__main__poster"
              src={data?.poster_path ? POSTER_API + data.poster_path : Default}
              alt={data?.title}
              decoding="async"
            />

            <div className="movie__main__details">
              <span className="movie__main__label">Movie Details</span>

              <h1>{data?.title}</h1>

              <div className="movie__main__meta">
                {year && <span>{year}</span>}
                <span>⭐ {rating}</span>
                <span>
                  <i className="fa-solid fa-arrow-up-short-wide"></i>{" "}
                  {popularity}
                </span>
              </div>

              {data?.tagline && (
                <p className="movie__main__tagline">“{data.tagline}”</p>
              )}

              <div className="movie__main__actions">
                {trailerKey && (
                  <button
                    ref={trailerButtonRef}
                    className="movie__main__trailer"
                    type="button"
                    onClick={() => setTrailerOpen(true)}
                  >
                    Watch Trailer
                  </button>
                )}

                <a
                  className="movie__main__tmdb"
                  href={`https://www.themoviedb.org/movie/${data?.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  TMDB
                </a>

                <button
                  className={`movie__main__favorite ${
                    isFavorite ? "is-active" : ""
                  }`}
                  type="button"
                  onClick={toggleWatchlist}
                  aria-pressed={isFavorite}
                >
                  <i
                    className={`${
                      isFavorite ? "fa-solid" : "fa-regular"
                    } fa-heart`}
                    aria-hidden="true"
                  ></i>
                  {isFavorite ? "In Watchlist" : "Add to Watchlist"}
                </button>
              </div>
            </div>
          </div>

          <div className="movie__main__cast">
            <h3>Top Cast</h3>

            <div className="movie__main__cast-list">
              {details?.data?.cast?.slice(0, 8).map((actor) => (
                <Link
                  key={actor.id}
                  className="movie__main__cast-card"
                  to={`/person/${actor.id}`}
                >
                  {actor.profile_path ? (
                    <img
                      src={PROFILE_API + actor.profile_path}
                      alt={`${actor.name} portrait`}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="movie__main__cast-placeholder">
                      <i className="fa-solid fa-user" aria-hidden="true"></i>
                    </div>
                  )}

                  <h4>{actor.name}</h4>
                  <span>{actor.character}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {trailerOpen && (
        <div
          className="movie-trailer-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`${data?.title || "Movie"} trailer`}
          onClick={closeTrailer}
        >
          <div
            ref={trailerDialogRef}
            className="movie-trailer-modal__content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="movie-trailer-modal__close"
              type="button"
              onClick={closeTrailer}
              aria-label="Close trailer"
              autoFocus
            >
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>

            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title={`${data?.title} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </>
  );
};

export default MovieMain;
