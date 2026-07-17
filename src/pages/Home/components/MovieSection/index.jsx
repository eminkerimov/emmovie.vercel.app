import React from "react";

const MovieSection = ({
  id,
  title,
  movies = [],
  renderMovieCard,
}) => {
  return (
    <section className="home__section" id={id}>
      <h2 className="home__section-title">{title}</h2>

      <div className="movie-container">
        {movies.slice(0, 4).map(renderMovieCard)}
      </div>
    </section>
  );
};

export default MovieSection;