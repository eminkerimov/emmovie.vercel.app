import React from "react";
import Default from "./Default.jpg"
import {Link} from "react-router-dom";

const IMG_API = "https://image.tmdb.org/t/p/w1280";

const setVoteClass = (vote) => {
    if (vote >= 8) {
        return "green";
    } else if (vote >= 6) {
        return "orange";
    } else {
        return "red";
    }
}

const MovieCard = ({ title, poster_path, overview, vote_average, id }) => (
    <Link className="movie" to={`/movie/${id}`}>
        <img src={poster_path ? IMG_API + poster_path : Default} alt={title} />
        <div className="movie-info">
            <h3>{title}</h3>
            <span className={`tag ${setVoteClass(vote_average)}`}>{vote_average}</span>
        </div>
        <div className="movie-over">
            <h2>Overview:</h2>
            <p>{overview}</p>
        </div>
    </Link>
);

export default MovieCard;