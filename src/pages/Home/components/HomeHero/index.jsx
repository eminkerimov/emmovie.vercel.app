import React from "react";
import { Link } from "react-router-dom";

const HomeHero = ({ movie }) => {
  if (!movie) return null;

  return (
    <section
      className="home-hero"
      style={{
        backgroundImage: `
          linear-gradient(
            90deg,
            rgba(8, 18, 25, 0.96) 0%,
            rgba(8, 18, 25, 0.75) 45%,
            rgba(8, 18, 25, 0.2) 100%
          ),
          url(https://image.tmdb.org/t/p/original${movie.backdrop_path})
        `,
      }}
    >
      <div className="home-hero__content">
        <span className="home-hero__label">Popular Now</span>

        <h1>{movie.title}</h1>

        <div className="home-hero__meta">
          <span>⭐ {movie.vote_average?.toFixed(1)}</span>
          <span>{movie.release_date?.slice(0, 4)}</span>
        </div>

        <p>{movie.overview}</p>

        <div className="home-hero__actions">
          <Link to={`/movie/${movie.id}`}>View Details</Link>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;