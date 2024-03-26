import React from "react";
import MovieCard from "../../components/MovieCard/MovieCard";

const Related = (relatedFilms) => {
  return (
    <>
      <div className="container">
        <h1>Related movies:</h1>
      </div>
      <div className="movie-container">
        {relatedFilms?.data?.results?.length &&
          relatedFilms?.data?.results
            ?.slice(0, 5)
            .map((movie) => <MovieCard key={movie.id} {...movie} />)}
      </div>
    </>
  );
};

export default Related;
