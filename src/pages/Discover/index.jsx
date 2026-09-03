import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
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
  genres: [],
  year: "",
  dateFrom: "",
  dateTo: "",
  runtimeMin: "",
  runtimeMax: "",
  originalLanguage: "",
  region: "US",
  provider: "",
  monetization: "",
  rating: "",
  sort: "popularity.desc",
};

const LANGUAGE_OPTIONS = [
  { id: "en", name: "English" },
  { id: "fr", name: "French" },
  { id: "de", name: "German" },
  { id: "es", name: "Spanish" },
  { id: "it", name: "Italian" },
  { id: "ja", name: "Japanese" },
  { id: "ko", name: "Korean" },
  { id: "ru", name: "Russian" },
  { id: "tr", name: "Turkish" },
];

const REGION_OPTIONS = [
  { id: "US", name: "United States" },
  { id: "GB", name: "United Kingdom" },
  { id: "DE", name: "Germany" },
  { id: "FR", name: "France" },
  { id: "ES", name: "Spain" },
  { id: "IT", name: "Italy" },
  { id: "CA", name: "Canada" },
  { id: "AU", name: "Australia" },
];

const PROVIDER_OPTIONS = [
  { id: "8", name: "Netflix" },
  { id: "9", name: "Amazon Prime Video" },
  { id: "337", name: "Disney Plus" },
  { id: "350", name: "Apple TV Plus" },
  { id: "1899", name: "Max" },
];

const getFiltersFromParams = (params) => ({
  ...INITIAL_FILTERS,
  genres: (params.get("genres") || "").split(",").filter(Boolean),
  year: params.get("year") || "",
  dateFrom: params.get("from") || "",
  dateTo: params.get("to") || "",
  runtimeMin: params.get("runtimeMin") || "",
  runtimeMax: params.get("runtimeMax") || "",
  originalLanguage: params.get("language") || "",
  region: params.get("region") || "US",
  provider: params.get("provider") || "",
  monetization: params.get("monetization") || "",
  rating: params.get("rating") || "",
  sort: params.get("sort") || "popularity.desc",
});

const getPage = (value) => {
  const parsedPage = Number.parseInt(value, 10);
  return Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
};

const Discover = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const appliedFilters = useMemo(
    () => getFiltersFromParams(new URLSearchParams(searchKey)),
    [searchKey]
  );
  const [filters, setFilters] = useState(appliedFilters);
  const page = getPage(searchParams.get("page"));

  const {
    toggleWatchlist,
    toggleWatched,
    isInWatchlist,
    isWatched,
  } = useWatchlist();

  const discoverRequest = useFetchMovies();
  const genresRequest = useFetchMovies();
  const providersRequest = useFetchMovies();
  const {
    data,
    loading,
    error,
    fetchData,
  } = discoverRequest;
  const fetchGenres = genresRequest.fetchData;
  const fetchProviders = providersRequest.fetchData;

  const movies = data?.data?.results || [];
  const totalResults = data?.data?.total_results || 0;
  const totalPages = Math.min(data?.data?.total_pages || 0, 500);
  const genreOptions =
    genresRequest.data?.data?.genres?.length
      ? genresRequest.data.data.genres
      : GENRE_OPTIONS;
  const providerOptions = useMemo(() => {
    const providers = providersRequest.data?.data?.results;

    if (!providers?.length) return PROVIDER_OPTIONS;

    return [...providers]
      .sort((first, second) => {
        const firstPriority =
          first.display_priorities?.[filters.region] ??
          first.display_priority ??
          999;
        const secondPriority =
          second.display_priorities?.[filters.region] ??
          second.display_priority ??
          999;

        return firstPriority - secondPriority;
      })
      .map((provider) => ({
        id: String(provider.provider_id),
        name: provider.provider_name,
      }));
  }, [filters.region, providersRequest.data]);

  useEffect(() => {
    fetchGenres("GET", "/genre/movie/list", {
      language: "en-US",
    });
  }, [fetchGenres]);

  useEffect(() => {
    fetchProviders("GET", "/watch/providers/movie", {
      language: "en-US",
      watch_region: filters.region,
    });
  }, [fetchProviders, filters.region]);

  useEffect(() => {
    setFilters(appliedFilters);
  }, [appliedFilters]);

  useEffect(() => {
    document.title = "Discover | M-movie";
  }, []);

  useEffect(() => {
    const params = {
      language: "en-US",
      page,
      include_adult: false,
      include_video: false,
      sort_by: appliedFilters.sort,
    };

    if (appliedFilters.genres.length) {
      params.with_genres = appliedFilters.genres.join(",");
    }
    if (appliedFilters.year) {
      params.primary_release_year = appliedFilters.year;
    }
    if (appliedFilters.dateFrom) {
      params["primary_release_date.gte"] = appliedFilters.dateFrom;
    }
    if (appliedFilters.dateTo) {
      params["primary_release_date.lte"] = appliedFilters.dateTo;
    }
    if (appliedFilters.runtimeMin) {
      params["with_runtime.gte"] = appliedFilters.runtimeMin;
    }
    if (appliedFilters.runtimeMax) {
      params["with_runtime.lte"] = appliedFilters.runtimeMax;
    }
    if (appliedFilters.originalLanguage) {
      params.with_original_language = appliedFilters.originalLanguage;
    }
    if (appliedFilters.region) {
      params.region = appliedFilters.region;
    }
    if (appliedFilters.provider || appliedFilters.monetization) {
      params.watch_region = appliedFilters.region || "US";
    }
    if (appliedFilters.provider) {
      params.with_watch_providers = appliedFilters.provider;
    }
    if (appliedFilters.monetization) {
      params.with_watch_monetization_types = appliedFilters.monetization;
    }
    if (appliedFilters.rating) {
      params["vote_average.gte"] = appliedFilters.rating;
      params["vote_count.gte"] = 200;
    }

    fetchData("GET", "/discover/movie", params);
  }, [appliedFilters, fetchData, page]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
      ...(name === "region" ? { provider: "" } : {}),
    }));
  };

  const handleGenreChange = (event) => {
    const { value, checked } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      genres: checked
        ? [...currentFilters.genres, value]
        : currentFilters.genres.filter((genre) => genre !== value),
    }));
  };

  const writeFiltersToUrl = (nextFilters, nextPage = 1) => {
    const nextParams = new URLSearchParams();

    if (nextFilters.genres.length) {
      nextParams.set("genres", nextFilters.genres.join(","));
    }
    if (nextFilters.year) nextParams.set("year", nextFilters.year);
    if (nextFilters.dateFrom) nextParams.set("from", nextFilters.dateFrom);
    if (nextFilters.dateTo) nextParams.set("to", nextFilters.dateTo);
    if (nextFilters.runtimeMin) {
      nextParams.set("runtimeMin", nextFilters.runtimeMin);
    }
    if (nextFilters.runtimeMax) {
      nextParams.set("runtimeMax", nextFilters.runtimeMax);
    }
    if (nextFilters.originalLanguage) {
      nextParams.set("language", nextFilters.originalLanguage);
    }
    if (nextFilters.region !== "US") {
      nextParams.set("region", nextFilters.region);
    }
    if (nextFilters.provider) {
      nextParams.set("provider", nextFilters.provider);
    }
    if (nextFilters.monetization) {
      nextParams.set("monetization", nextFilters.monetization);
    }
    if (nextFilters.rating) nextParams.set("rating", nextFilters.rating);
    if (nextFilters.sort !== "popularity.desc") {
      nextParams.set("sort", nextFilters.sort);
    }
    if (nextPage > 1) nextParams.set("page", String(nextPage));

    setSearchParams(nextParams);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    writeFiltersToUrl(filters);
    window.scrollTo?.({ top: 0, behavior: "auto" });
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
    setSearchParams({});
  };

  const handlePageChange = (nextPage) => {
    writeFiltersToUrl(appliedFilters, nextPage);
    window.scrollTo?.({ top: 0, behavior: "auto" });
  };

  const activeGenres = genreOptions.filter((genre) =>
    appliedFilters.genres.includes(String(genre.id))
  );

  return (
    <div className="discover-page">
      <main className="discover-layout">
        <aside className="discover-sidebar">
          <div className="discover-sidebar__heading">
            <span>Find your next movie</span>

            <h1>Discover</h1>

            <p>
              Combine genres, release dates, runtime,
              language and streaming availability.
            </p>
          </div>

          <form
            className="discover-filters"
            onSubmit={handleSubmit}
          >
            <fieldset className="discover-filters__genres">
              <legend>Genres</legend>

              <div>
                {genreOptions.map((genre) => (
                  <label key={genre.id}>
                    <input
                      type="checkbox"
                      value={genre.id}
                      checked={filters.genres.includes(String(genre.id))}
                      onChange={handleGenreChange}
                    />
                    <span>{genre.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>

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
              <label htmlFor="discover-from">
                Released after
              </label>
              <input
                id="discover-from"
                name="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={handleFilterChange}
              />
            </div>

            <div className="discover-filters__field">
              <label htmlFor="discover-to">
                Released before
              </label>
              <input
                id="discover-to"
                name="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={handleFilterChange}
              />
            </div>

            <div className="discover-filters__field">
              <label htmlFor="discover-runtime-min">
                Minimum runtime
              </label>
              <input
                id="discover-runtime-min"
                name="runtimeMin"
                type="number"
                min="0"
                max="400"
                placeholder="Minutes"
                value={filters.runtimeMin}
                onChange={handleFilterChange}
              />
            </div>

            <div className="discover-filters__field">
              <label htmlFor="discover-runtime-max">
                Maximum runtime
              </label>
              <input
                id="discover-runtime-max"
                name="runtimeMax"
                type="number"
                min="0"
                max="400"
                placeholder="Minutes"
                value={filters.runtimeMax}
                onChange={handleFilterChange}
              />
            </div>

            <div className="discover-filters__field">
              <label htmlFor="discover-language">
                Original language
              </label>
              <select
                id="discover-language"
                name="originalLanguage"
                value={filters.originalLanguage}
                onChange={handleFilterChange}
              >
                <option value="">Any language</option>
                {LANGUAGE_OPTIONS.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="discover-filters__field">
              <label htmlFor="discover-region">Region</label>
              <select
                id="discover-region"
                name="region"
                value={filters.region}
                onChange={handleFilterChange}
              >
                {REGION_OPTIONS.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="discover-filters__field">
              <label htmlFor="discover-provider">
                Streaming provider
              </label>
              <select
                id="discover-provider"
                name="provider"
                value={filters.provider}
                onChange={handleFilterChange}
              >
                <option value="">Any provider</option>
                {providerOptions.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="discover-filters__field">
              <label htmlFor="discover-monetization">
                Availability
              </label>
              <select
                id="discover-monetization"
                name="monetization"
                value={filters.monetization}
                onChange={handleFilterChange}
              >
                <option value="">Any access type</option>
                <option value="flatrate">Stream</option>
                <option value="free">Free</option>
                <option value="ads">Free with ads</option>
                <option value="rent">Rent</option>
                <option value="buy">Buy</option>
              </select>
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
              <span>
                {activeGenres.length
                  ? activeGenres.map((genre) => genre.name).join(", ")
                  : "All genres"}
              </span>
              <span>{appliedFilters.year || "Any year"}</span>
              {appliedFilters.provider && (
                <span>
                  {providerOptions.find(
                    (provider) => provider.id === appliedFilters.provider
                  )?.name}
                </span>
              )}
            </div>

            {!loading && !error && (
              <div className="discover-results__count">
                <strong>{totalResults.toLocaleString()}</strong>

                <span>
                  {totalResults === 1
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
                    isWatched={isWatched?.(movie.id) || false}
                    onToggleFavorite={
                      toggleWatchlist
                    }
                    onToggleWatched={toggleWatched}
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

          {!loading && !error && totalPages > 1 && (
            <nav
              className="discover-pagination"
              aria-label="Discover results pagination"
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
                <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
              </button>
            </nav>
          )}
        </section>
      </main>
    </div>
  );
};

export default Discover;
