import React from "react";
import Default from "../../images/Default.jpg"
import {Link} from "react-router-dom";
import { IMG_API } from "../../helpers/baseURL";
import "./MovieCard.scss"

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
    <Link className="movieCard" to={`/movie/${id}`}>
        <img src={poster_path ? IMG_API + poster_path : Default} alt={title} />
        <div className="movieCard-info">
            <h3>{title}</h3>
            <span className={`tag ${setVoteClass(vote_average)}`}>{vote_average?.toString()?.slice(0,3)}</span>
        </div>
        <div className="movieCard-over">
            <h2>Overview:</h2>
            <p>{overview}</p>
        </div>
    </Link>
);

export default MovieCard;