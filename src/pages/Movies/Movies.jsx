import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading/Loading";
import MovieCard from "../../components/MovieCard/MovieCard";
import useFetchMovies from "../../hooks/useFetchMovies";
import useWatchlist from "../../hooks/useWatchlist";
import "./Movies.scss";

const CATEGORIES = [
  { id: "popular", title: "Popular", endpoint: "/movie/popular" },
  { id: "top-rated", title: "Top Rated", endpoint: "/movie/top_rated" },
  { id: "upcoming", title: "Upcoming", endpoint: "/movie/upcoming" },
  { id: "now-playing", title: "Now Playing", endpoint: "/movie/now_playing" },
];

const Movies = () => {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const { data, loading, error, fetchData } = useFetchMovies();
  const {
    toggleWatchlist,
    toggleWatched,
    isInWatchlist,
    isWatched,
  } = useWatchlist();
  const movies = data?.data?.results || [];

  useEffect(() => {
    fetchData("GET", activeCategory.endpoint, {
      language: "en-US",
      page: 1,
    });
  }, [activeCategory, fetchData]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const query = searchTerm.trim();
    if (!query) return;

    fetchData("GET", "/search/movie", {
      query,
      language: "en-US",
      page: 1,
    });
  };

  return (
    <main className="movies-page">
      <div className="page-container">
        <section className="movies-page__header" aria-labelledby="movies-title">
          <div>
            <span>Catalogue</span>
            <h1 id="movies-title">Movies</h1>
          </div>

          <form className="movies-page__form" role="search" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="catalogue-search">
              Search the movie catalogue
            </label>
            <input
              id="catalogue-search"
              className="movies-page__search"
              type="search"
              placeholder="Search movies..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <button type="submit" aria-label="Search movies">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            </button>
          </form>
        </section>

        <div className="movies-page__tabs" aria-label="Movie categories">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={activeCategory.id === category.id ? "is-active" : ""}
              type="button"
              aria-pressed={activeCategory.id === category.id}
              onClick={() => setActiveCategory(category)}
            >
              {category.title}
            </button>
          ))}
        </div>

        {loading && <Loading />}

        {!loading && error && (
          <div className="movies-page__state" role="alert">
            Movies could not be loaded. Try again.
          </div>
        )}

        {!loading && !error && movies.length > 0 && (
          <section className="movies-page__grid" aria-live="polite">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                {...movie}
                isFavorite={isInWatchlist(movie.id)}
                isWatched={isWatched(movie.id)}
                onToggleFavorite={toggleWatchlist}
                onToggleWatched={toggleWatched}
              />
            ))}
          </section>
        )}

        {!loading && !error && movies.length === 0 && (
          <div className="movies-page__state">No movies found.</div>
        )}
      </div>
    </main>
  );
};

export default Movies;
