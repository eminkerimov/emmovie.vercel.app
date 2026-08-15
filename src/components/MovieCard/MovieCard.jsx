import React from "react";
import Default from "../../images/Default.jpg";
import { Link } from "react-router-dom";
import { POSTER_API } from "../../helpers/baseURL";
import "./MovieCard.scss";

const setVoteClass = (vote) => {
  if (vote >= 8) return "rating-high";
  if (vote >= 6) return "rating-medium";
  return "rating-low";
};

const MovieCard = ({
  title,
  poster_path,
  overview,
  vote_average,
  release_date,
  id,
  isFavorite = false,
  onToggleFavorite,
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

  return (
    <article className="movieCard">
      {onToggleFavorite && (
        <button
          className={`movieCard-favorite ${isFavorite ? "is-active" : ""}`}
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? "Remove from watchlist" : "Add to watchlist"}
          aria-pressed={isFavorite}
        >
          <i
            className={`${isFavorite ? "fa-solid" : "fa-regular"} fa-heart`}
            aria-hidden="true"
          ></i>
        </button>
      )}

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
              className={`tag ${setVoteClass(vote_average)}`}
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
