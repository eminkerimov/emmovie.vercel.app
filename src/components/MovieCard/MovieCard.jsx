import React from "react";
import Default from "../../images/Default.jpg";
import { Link } from "react-router-dom";
import { IMG_API } from "../../helpers/baseURL";
import "./MovieCard.scss";

const setVoteClass = (vote) => {
  if (vote >= 8) return "green";
  if (vote >= 6) return "orange";
  return "red";
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

  const handleFavoriteClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

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
    <Link className="movieCard" to={`/movie/${id}`}>
      {onToggleFavorite && (
        <button
          className={`movieCard-favorite ${isFavorite ? "is-active" : ""}`}
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? "Remove from watchlist" : "Add to watchlist"}
        >
          <i className={`${isFavorite ? "fa-solid" : "fa-regular"} fa-heart`}></i>
        </button>
      )}

      <div className="movieCard-poster">
        <img src={poster_path ? IMG_API + poster_path : Default} alt={title} />

        <div className="movieCard-over">
          <h2>Overview</h2>
          <p>{overview}</p>
        </div>
      </div>

      <div className="movieCard-info">
        <div>
          <h3>{title}</h3>
          <span className="movieCard-year">{year}</span>
        </div>

        {vote_average > 0 && (
          <span className={`tag ${setVoteClass(vote_average)}`}>
            {vote_average.toFixed(1)}
          </span>
        )}
      </div>
    </Link>
  );
};

export default MovieCard;