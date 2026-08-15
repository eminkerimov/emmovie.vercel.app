import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import Loading from "../../components/Loading/Loading";
import MovieCard from "../../components/MovieCard/MovieCard";
import useFetchMovies from "../../hooks/useFetchMovies";
import useWatchlist from "../../hooks/useWatchlist";
import "./index.scss";

const GENRE_OPTIONS = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

const INITIAL_FILTERS = {
  genre: "",
  year: "",
  rating: "",
  sort: "popularity.desc",
};

const Discover = () => {
  const [movies, setMovies] = useState([]);
  const [filters, setFilters] =
    useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState(null);
  const [resultsMode, setResultsMode] =
    useState("popular");

  const {
    toggleWatchlist,
    isInWatchlist,
  } = useWatchlist();

  const {
    data,
    loading,
    error,
    fetchData,
  } = useFetchMovies();

  const fetchPopularMovies = useCallback(() => {
    fetchData("GET", "/movie/popular", {
      language: "en-US",
      page: 1,
    });
  }, [fetchData]);

  const fetchFilteredMovies = useCallback((
    currentFilters
  ) => {
    const params = {
      language: "en-US",
      page: 1,
      sort_by: currentFilters.sort,
    };

    if (currentFilters.genre) {
      params.with_genres = currentFilters.genre;
    }

    if (currentFilters.year) {
      params.primary_release_year =
        currentFilters.year;
    }

    if (currentFilters.rating) {
      params["vote_average.gte"] =
        currentFilters.rating;
      params["vote_count.gte"] = 200;
    }

    fetchData("GET", "/discover/movie", params);
  }, [fetchData]);

  useEffect(() => {
    fetchPopularMovies();
  }, [fetchPopularMovies]);

  useEffect(() => {
    if (!data) return;

    const results = data?.data?.results || [];

    setMovies(
      resultsMode === "filtered"
        ? results
        : results.slice(0, 12)
    );
  }, [data, resultsMode]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const submittedFilters = {
      ...filters,
    };

    setAppliedFilters(submittedFilters);
    setResultsMode("filtered");
    fetchFilteredMovies(submittedFilters);

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(null);
    setResultsMode("popular");
    fetchPopularMovies();
  };

  const activeGenre = GENRE_OPTIONS.find(
    (genre) =>
      String(genre.id) ===
      String(appliedFilters?.genre)
  );

  return (
    <div className="discover-page">
      <main className="discover-layout">
        <aside className="discover-sidebar">
          <div className="discover-sidebar__heading">
            <span>Find your next movie</span>

            <h1>Discover</h1>

            <p>
              Build a collection using genre, year,
              rating and sorting.
            </p>
          </div>

          <form
            className="discover-filters"
            onSubmit={handleSubmit}
          >
            <div className="discover-filters__field">
              <label htmlFor="discover-genre">
                Genre
              </label>

              <select
                id="discover-genre"
                name="genre"
                value={filters.genre}
                onChange={handleFilterChange}
              >
                <option value="">
                  All genres
                </option>

                {GENRE_OPTIONS.map((genre) => (
                  <option
                    key={genre.id}
                    value={genre.id}
                  >
                    {genre.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="discover-filters__field">
              <label htmlFor="discover-year">
                Release year
              </label>

              <input
                id="discover-year"
                name="year"
                type="number"
                min="1900"
                max={
                  new Date().getFullYear() + 2
                }
                placeholder="Any year"
                value={filters.year}
                onChange={handleFilterChange}
              />
            </div>

            <div className="discover-filters__field">
              <label htmlFor="discover-rating">
                Minimum rating
              </label>

              <select
                id="discover-rating"
                name="rating"
                value={filters.rating}
                onChange={handleFilterChange}
              >
                <option value="">
                  Any rating
                </option>

                <option value="5">
                  5 and higher
                </option>

                <option value="6">
                  6 and higher
                </option>

                <option value="7">
                  7 and higher
                </option>

                <option value="8">
                  8 and higher
                </option>
              </select>
            </div>

            <div className="discover-filters__field">
              <label htmlFor="discover-sort">
                Sort by
              </label>

              <select
                id="discover-sort"
                name="sort"
                value={filters.sort}
                onChange={handleFilterChange}
              >
                <option value="popularity.desc">
                  Most popular
                </option>

                <option value="vote_average.desc">
                  Top rated
                </option>

                <option value="primary_release_date.desc">
                  Newest releases
                </option>

                <option value="revenue.desc">
                  Highest revenue
                </option>
              </select>
            </div>

            <button
              className="discover-filters__submit"
              type="submit"
            >
              <span>Show movies</span>
              <i className="fa-solid fa-arrow-right"></i>
            </button>

            <button
              className="discover-filters__reset"
              type="button"
              onClick={handleReset}
            >
              Reset filters
            </button>
          </form>
        </aside>

        <section className="discover-results">
          <div className="discover-results__header">
            <div className="discover-results__tags">
              {appliedFilters ? (
                <>
                  <span>
                    {activeGenre?.name ||
                      "All genres"}
                  </span>

                  <span>
                    {appliedFilters.year ||
                      "Any year"}
                  </span>

                  <span>
                    {appliedFilters.rating
                      ? `${appliedFilters.rating}+ rating`
                      : "Any rating"}
                  </span>
                </>
              ) : (
                <span>Popular picks</span>
              )}
            </div>

            {!loading && !error && (
              <div className="discover-results__count">
                <strong>{movies.length}</strong>

                <span>
                  {movies.length === 1
                    ? "movie"
                    : "movies"}
                </span>
              </div>
            )}
          </div>

          {loading && (
            <div className="discover-results__loading">
              <Loading />
            </div>
          )}

          {!loading && error && (
            <div className="discover-results__empty">
              <i className="fa-solid fa-circle-exclamation"></i>

              <h3>
                Movies could not be loaded
              </h3>

              <p>
                Check the connection and try again.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            movies.length > 0 && (
              <div className="discover-grid">
                {movies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    {...movie}
                    isFavorite={isInWatchlist(
                      movie.id
                    )}
                    onToggleFavorite={
                      toggleWatchlist
                    }
                  />
                ))}
              </div>
            )}

          {!loading &&
            !error &&
            movies.length === 0 && (
              <div className="discover-results__empty">
                <i className="fa-solid fa-film"></i>

                <h3>No movies found</h3>

                <p>
                  Change one or more filters and
                  try again.
                </p>
              </div>
            )}
        </section>
      </main>
    </div>
  );
};

export default Discover;
