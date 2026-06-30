import React from "react";
import MovieCard from "../../components/MovieCard/MovieCard";

const Related = (relatedFilms) => {
  return (
<section className="related">
  <div className="container">

    <div className="related__header">
      <span>DISCOVER</span>
      <h2>Related Movies</h2>
    </div>

    <div className="movie-container">
      {relatedFilms?.data?.results?.length &&
        relatedFilms.data.results
          .slice(0, 5)
          .map((movie) => (
            <MovieCard key={movie.id} {...movie} />
          ))}
    </div>

  </div>
</section>
  );
};

export default Related;
