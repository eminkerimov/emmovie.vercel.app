import React, { useEffect, useRef, useState } from "react";
import Default from "../../images/Default.jpg";
import {
  IMG_API,
  POSTER_API,
  PROFILE_API,
} from "../../helpers/baseURL.js";
import { Link, useNavigate } from "react-router-dom";
import { MovieLibraryMenu } from "../MovieCard/MovieCard";

const MovieMain = ({
  data,
  details,
  videos,
  watchlist,
  isWatched,
  toggleWatchlist,
  toggleWatched,
}) => {
  const navigate = useNavigate();

  const [trailerOpen, setTrailerOpen] = useState(false);
  const trailerButtonRef = useRef(null);
  const trailerDialogRef = useRef(null);

  const year = data?.release_date ? data.release_date.slice(0, 4) : "";
  const rating = data?.vote_average ? data.vote_average.toFixed(1) : "—";
  const popularity = data?.popularity ? data.popularity.toFixed(0) : "—";
  const trailerKey = videos?.[0]?.key;
  const isFavorite = watchlist?.some((movie) => movie.id === data?.id);
  const cast = details?.data?.cast?.slice(0, 8) || [];

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
          backgroundImage: `linear-gradient(90deg, rgba(3, 9, 14, 0.96) 0%, rgba(6, 22, 30, 0.7) 48%, rgba(7, 26, 35, 0.08) 100%), linear-gradient(180deg, rgba(120, 215, 244, 0.13) 0%, transparent 40%), linear-gradient(0deg, #050b10 0%, transparent 58%), url(${
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
            <div className="movie__main__poster-frame">
              <img
                className="movie__main__poster"
                src={data?.poster_path ? POSTER_API + data.poster_path : Default}
                alt={data?.title}
                decoding="async"
              />
            </div>

            <div className="movie__main__details">
              <span className="movie__main__label">Feature presentation</span>

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
                    <i className="fa-solid fa-play" aria-hidden="true"></i>
                    Watch Trailer
                  </button>
                )}

                <a
                  className="movie__main__tmdb"
                  href={`https://www.themoviedb.org/movie/${data?.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>View on TMDB</span>
                  <i
                    className="fa-solid fa-arrow-up-right-from-square"
                    aria-hidden="true"
                  ></i>
                </a>

                <MovieLibraryMenu
                  title={data?.title || "Movie"}
                  isFavorite={isFavorite}
                  isWatched={isWatched}
                  onToggleFavorite={toggleWatchlist}
                  onToggleWatched={toggleWatched}
                  variant="hero"
                />
              </div>
            </div>
          </div>

          {(details?.loading || details?.error || cast.length > 0) && (
            <div className="movie__main__cast">
              <div className="movie__main__cast-header">
                <h3>Top cast</h3>
                <span>Featured performers</span>
              </div>

              {details?.loading || details?.error ? (
                <p className="movie__main__cast-status" role="status">
                  {details.loading
                    ? "Loading cast…"
                    : "Cast details are temporarily unavailable."}
                </p>
              ) : (
                <div className="movie__main__cast-list">
                  {cast.map((actor) => (
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
                          <i
                            className="fa-solid fa-user"
                            aria-hidden="true"
                          ></i>
                        </div>
                      )}

                      <h4>{actor.name}</h4>
                      <span>{actor.character}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
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
