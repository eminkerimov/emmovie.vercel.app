import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Loading from "../../components/Loading/Loading";
import MovieCard from "../../components/MovieCard/MovieCard";
import { PROFILE_API } from "../../helpers/baseURL";
import Default from "../../images/Default.jpg";
import useFetchMovies from "../../hooks/useFetchMovies";
import useWatchlist from "../../hooks/useWatchlist";
import "./Search.scss";

const SEARCH_TYPES = [
  { id: "all", label: "All" },
  { id: "movie", label: "Movies" },
  { id: "person", label: "People" },
];

const getPage = (value) => {
  const parsedPage = Number.parseInt(value, 10);
  return Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
};

const PersonResult = ({ person }) => {
  const knownFor = (person.known_for || [])
    .map((credit) => credit.title || credit.name)
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");

  return (
    <article className="person-result">
      <Link
        className="person-result__link"
        to={`/person/${person.id}`}
        aria-label={`Open ${person.name} profile`}
      >
        <div className="person-result__portrait">
          <img
            src={
              person.profile_path
                ? PROFILE_API + person.profile_path
                : Default
            }
            alt={person.profile_path ? `${person.name} portrait` : ""}
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="person-result__content">
          <span>{person.known_for_department || "Person"}</span>
          <h3>{person.name}</h3>
          <p>{knownFor || "Profile and filmography"}</p>
        </div>

        <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
      </Link>
    </article>
  );
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() || "";
  const requestedType = searchParams.get("type") || "all";
  const activeType = SEARCH_TYPES.some(({ id }) => id === requestedType)
    ? requestedType
    : "all";
  const page = getPage(searchParams.get("page"));
  const [searchTerm, setSearchTerm] = useState(query);
  const { data, loading, error, fetchData } = useFetchMovies();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const response = data?.data;
  const results = useMemo(
    () => {
      const requestResults = response?.results || [];

      if (activeType === "movie" || activeType === "person") {
        return requestResults.map((result) => ({
          ...result,
          media_type: activeType,
        }));
      }

      return requestResults.filter(
        (result) =>
          result.media_type === "movie" ||
          result.media_type === "person"
      );
    },
    [activeType, response?.results]
  );
  const movies = results.filter((result) => result.media_type === "movie");
  const people = results.filter((result) => result.media_type === "person");
  const totalResults = response?.total_results || 0;
  const totalPages = Math.min(response?.total_pages || 0, 500);

  useEffect(() => {
    setSearchTerm(query);

    if (!query) return;

    const endpoint =
      activeType === "all"
        ? "/search/multi"
        : `/search/${activeType}`;

    fetchData("GET", endpoint, {
      query,
      include_adult: false,
      language: "en-US",
      page,
    });
  }, [activeType, fetchData, page, query]);

  useEffect(() => {
    document.title = query
      ? `${query} — Search | Emmovie`
      : "Search | Emmovie";
  }, [query]);

  const updateParams = (updates) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      const isDefault =
        !value ||
        (key === "type" && value === "all") ||
        (key === "page" && value === 1);

      if (isDefault) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(value));
      }
    });

    setSearchParams(nextParams);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedSearchTerm = searchTerm.trim();

    if (!trimmedSearchTerm) return;

    const nextParams = new URLSearchParams();
    nextParams.set("q", trimmedSearchTerm);
    if (activeType !== "all") nextParams.set("type", activeType);
    setSearchParams(nextParams);
  };

  const handleTypeChange = (type) => {
    updateParams({ type, page: 1 });
  };

  const handlePageChange = (nextPage) => {
    updateParams({ page: nextPage });
    window.scrollTo?.({ top: 0, behavior: "auto" });
  };

  const hasVisibleResults =
    (activeType !== "person" && movies.length > 0) ||
    (activeType !== "movie" && people.length > 0);

  return (
    <main className="search-page">
      <div className="search-page__content page-container">
        <form
          className="search-page__form"
          onSubmit={handleSubmit}
          role="search"
        >
          <label className="sr-only" htmlFor="movie-search">
            Search movies and people
          </label>
          <input
            id="movie-search"
            type="search"
            placeholder="Search movies and people..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <section aria-labelledby="search-results-title">
          <div className="search-page__heading">
            <span>Search TMDB</span>
            <h1 id="search-results-title">
              {query ? `Results for "${query}"` : "Find a movie or person"}
            </h1>

            {!loading && query && (
              <p>
                {totalResults.toLocaleString()}{" "}
                {totalResults === 1 ? "match" : "matches"}
              </p>
            )}
          </div>

          {query && (
            <div
              className="search-page__types"
              role="group"
              aria-label="Result type"
            >
              {SEARCH_TYPES.map((type) => (
                <button
                  className={activeType === type.id ? "is-active" : ""}
                  key={type.id}
                  type="button"
                  aria-pressed={activeType === type.id}
                  onClick={() => handleTypeChange(type.id)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          )}

          {loading && <Loading />}

          {!loading && error && (
            <div className="search-page__empty" role="alert">
              Search failed. Try again.
            </div>
          )}

          {!loading && !error && query && hasVisibleResults && (
            <div className="search-page__results">
              {activeType !== "person" && movies.length > 0 && (
                <section
                  className="search-group"
                  aria-labelledby="movie-results-title"
                >
                  <div className="search-group__heading">
                    <h2 id="movie-results-title">Movies</h2>
                    <span>{movies.length} on this page</span>
                  </div>

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
                </section>
              )}

              {activeType !== "movie" && people.length > 0 && (
                <section
                  className="search-group"
                  aria-labelledby="person-results-title"
                >
                  <div className="search-group__heading">
                    <h2 id="person-results-title">People</h2>
                    <span>{people.length} on this page</span>
                  </div>

                  <div className="search-page__people">
                    {people.map((person) => (
                      <PersonResult key={person.id} person={person} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {!loading && !error && query && !hasVisibleResults && (
            <div className="search-page__empty">
              No supported results found on this page.
            </div>
          )}

          {!loading && !query && (
            <div className="search-page__empty">
              Enter a movie title or person name to start searching.
            </div>
          )}

          {!loading && !error && query && totalPages > 1 && (
            <nav
              className="search-pagination"
              aria-label="Search results pagination"
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
                Previous
              </button>

              <span aria-live="polite">
                Page {page} of {totalPages}
              </span>

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
      </div>
    </main>
  );
};

export default Search;
