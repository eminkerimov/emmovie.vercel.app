import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Loading from "../../components/Loading/Loading";
import MovieCard from "../../components/MovieCard/MovieCard";
import useFetchMovies from "../../hooks/useFetchMovies";
import "./Search.scss";

const WATCHLIST_KEY = "emmovie_watchlist";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [searchTerm, setSearchTerm] = useState(query);
  const [movies, setMovies] = useState([]);

  const [watchlist, setWatchlist] = useState(() => {
    try {
      const savedWatchlist = localStorage.getItem(WATCHLIST_KEY);
      return savedWatchlist ? JSON.parse(savedWatchlist) : [];
    } catch {
      return [];
    }
  });

  const { data, loading, error, fetchData } = useFetchMovies();

  useEffect(() => {
    setSearchTerm(query);

    if (!query.trim()) {
      setMovies([]);
      return;
    }

    fetchData("GET", "/search/movie", {
      query: query.trim(),
      language: "en-US",
      page: 1,
    });
  }, [query]);

  useEffect(() => {
    if (data) {
      setMovies(data.data.results || []);
    }
  }, [data]);

  useEffect(() => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedSearchTerm = searchTerm.trim();

    if (!trimmedSearchTerm) return;

    setSearchParams({
      q: trimmedSearchTerm,
    });
  };

  const toggleWatchlist = (movie) => {
    setWatchlist((currentWatchlist) => {
      const alreadySaved = currentWatchlist.some(
        (item) => item.id === movie.id
      );

      if (alreadySaved) {
        return currentWatchlist.filter((item) => item.id !== movie.id);
      }

      return [movie, ...currentWatchlist];
    });
  };

  const isInWatchlist = (movieId) => {
    return watchlist.some((movie) => movie.id === movieId);
  };

  return (
    <main className="search-page">
      <header className="search-page__header">
        <Link className="search-page__logo" to="/">
          <i className="fa-solid fa-film"></i>
          <span>M-movie</span>
        </Link>

        <form className="search-page__form" onSubmit={handleSubmit}>
          <input
            type="search"
            placeholder="Search movies..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            autoFocus
          />

          <button type="submit">Search</button>
        </form>
      </header>

      <section className="search-page__content">
        <div className="search-page__heading">
          <span>Search</span>
          <h1>
            {query ? `Results for “${query}”` : "Find a movie"}
          </h1>

          {!loading && query && (
            <p>{movies.length} movies found</p>
          )}
        </div>

        {loading && <Loading />}

        {!loading && error && (
          <div className="search-page__empty">
            Search failed. Try again.
          </div>
        )}

        {!loading && !error && query && movies.length > 0 && (
          <div className="movie-container">
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
    </main>
  );
};

export default Search;