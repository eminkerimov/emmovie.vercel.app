import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Loading from "../../components/Loading/Loading";
import MovieCard from "../../components/MovieCard/MovieCard";
import useFetchMovies from "../../hooks/useFetchMovies";
import useWatchlist from "../../hooks/useWatchlist";
import "./Search.scss";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(query);
  const { data, loading, error, fetchData } = useFetchMovies();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const movies = data?.data?.results || [];

  useEffect(() => {
    setSearchTerm(query);

    if (!query.trim()) return;

    fetchData("GET", "/search/movie", {
      query: query.trim(),
      language: "en-US",
      page: 1,
    });
  }, [fetchData, query]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedSearchTerm = searchTerm.trim();

    if (!trimmedSearchTerm) return;

    setSearchParams({ q: trimmedSearchTerm });
  };

  return (
    <main className="search-page">
      <div className="search-page__content page-container">
        <form className="search-page__form" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="movie-search">
            Search movies
          </label>
          <input
            id="movie-search"
            type="search"
            placeholder="Search movies..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <section aria-labelledby="search-results-title">
          <div className="search-page__heading">
            <span>Search</span>
            <h1 id="search-results-title">
              {query ? `Results for “${query}”` : "Find a movie"}
            </h1>

            {!loading && query && <p>{movies.length} movies found</p>}
          </div>

          {loading && <Loading />}

          {!loading && error && (
            <div className="search-page__empty" role="alert">
              Search failed. Try again.
            </div>
          )}

          {!loading && !error && query && movies.length > 0 && (
            <div className="search-page__grid">
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  {...movie}
                  isFavorite={isInWatchlist(movie.id)}
                  onToggleFavorite={toggleWatchlist}
                />
              ))}
            </div>
          )}

          {!loading && !error && query && movies.length === 0 && (
            <div className="search-page__empty">
              No movies found for this title.
            </div>
          )}

          {!loading && !query && (
            <div className="search-page__empty">
              Enter a movie title to start searching.
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Search;
