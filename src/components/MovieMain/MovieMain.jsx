import React, { useEffect, useState } from "react";
import Default from "../../images/Default.jpg";
import { IMG_API } from "../../helpers/baseURL.js";
import { Link, useNavigate } from "react-router-dom";

const MovieMain = ({ data, details, videos, watchlist, toggleWatchlist }) => {
  const navigate = useNavigate();

  const [trailerOpen, setTrailerOpen] = useState(false);

  const year = data?.release_date ? data.release_date.slice(0, 4) : "";
  const rating = data?.vote_average ? data.vote_average.toFixed(1) : "—";
  const popularity = data?.popularity ? data.popularity.toFixed(0) : "—";
  const trailerKey = videos?.[0]?.key;
  const isFavorite = watchlist?.some((movie) => movie.id === data?.id);

  useEffect(() => {
    if (!trailerOpen) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setTrailerOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [trailerOpen]);

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
        <div className="container">
          <button className="movie__main__back" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left"></i>
            <span>Back</span>
          </button>

          <div className="movie__main__content">
            <img
              className="movie__main__poster"
              src={data?.poster_path ? IMG_API + data.poster_path : Default}
              alt={data?.title}
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

              {data?.overview && <p>{data.overview}</p>}

              <div className="movie__main__actions">
                {trailerKey && (
                  <button
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
                >
                  <i
                    className={`${
                      isFavorite ? "fa-solid" : "fa-regular"
                    } fa-heart`}
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
                    <img src={IMG_API + actor.profile_path} alt={actor.name} />
                  ) : (
                    <div className="movie__main__cast-placeholder">
                      <i className="fa-solid fa-user"></i>
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
          onClick={() => setTrailerOpen(false)}
        >
          <div
            className="movie-trailer-modal__content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="movie-trailer-modal__close"
              type="button"
              onClick={() => setTrailerOpen(false)}
            >
              <i className="fa-solid fa-xmark"></i>
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