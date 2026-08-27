import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MovieCard from "../../components/MovieCard/MovieCard";
import useWatchlist from "../../hooks/useWatchlist";
import "./index.scss";

const sortMovies = (movies, sortBy, getWatchlistMeta) => {
  const sortedMovies = [...movies];

  if (sortBy === "title") {
    return sortedMovies.sort((first, second) =>
      (first.title || "").localeCompare(second.title || "")
    );
  }

  if (sortBy === "year") {
    return sortedMovies.sort((first, second) =>
      (second.release_date || "").localeCompare(
        first.release_date || ""
      )
    );
  }

  if (sortBy === "rating") {
    return sortedMovies.sort(
      (first, second) =>
        (second.vote_average || 0) -
        (first.vote_average || 0)
    );
  }

  return sortedMovies.sort((first, second) =>
    (getWatchlistMeta(second.id).addedAt || "").localeCompare(
      getWatchlistMeta(first.id).addedAt || ""
    )
  );
};

const Watchlist = () => {
  const {
    watchlist,
    toggleWatchlist,
    clearWatchlist,
    updateWatchlistMeta,
    getWatchlistMeta,
    isInWatchlist,
  } = useWatchlist();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("added");

  const visibleMovies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filteredMovies = watchlist.filter((movie) => {
      const matchesQuery =
        !normalizedQuery ||
        movie.title?.toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "all" ||
        getWatchlistMeta(movie.id).status === statusFilter;

      return matchesQuery && matchesStatus;
    });

    return sortMovies(
      filteredMovies,
      sortBy,
      getWatchlistMeta
    );
  }, [
    getWatchlistMeta,
    query,
    sortBy,
    statusFilter,
    watchlist,
  ]);

  const watchedCount = watchlist.filter(
    (movie) => getWatchlistMeta(movie.id).status === "watched"
  ).length;

  const handleRemove = (movie) => {
    toggleWatchlist(movie);
  };

  const handleClear = () => {
    clearWatchlist();
  };

  const handleRandomPick = () => {
    if (!visibleMovies.length) return;

    const randomIndex = Math.floor(
      Math.random() * visibleMovies.length
    );
    navigate("/movie/" + visibleMovies[randomIndex].id);
  };

  return (
    <div className="watchlist-page">
      <main className="watchlist-layout">
        <section className="watchlist-hero">
          <div className="watchlist-hero__content">
            <span>My library</span>

            <h1>Watchlist</h1>

            <p>
              Plan what to watch, mark completed movies and keep
              your own rating and notes.
            </p>
          </div>

          {watchlist.length > 0 && (
            <div className="watchlist-hero__summary">
              <div>
                <strong>{watchlist.length}</strong>
                <span>saved</span>
              </div>

              <div>
                <strong>{watchedCount}</strong>
                <span>watched</span>
              </div>
            </div>
          )}
        </section>

        {watchlist.length > 0 ? (
          <section
            className="watchlist-content"
            aria-labelledby="watchlist-library-title"
          >
            <h2 id="watchlist-library-title" className="sr-only">
              Saved movies
            </h2>

            <div className="watchlist-toolbar">
              <label className="watchlist-toolbar__search">
                <span className="sr-only">
                  Search saved movies
                </span>
                <i
                  className="fa-solid fa-magnifying-glass"
                  aria-hidden="true"
                ></i>
                <input
                  type="search"
                  placeholder="Search your library"
                  value={query}
                  onChange={(event) =>
                    setQuery(event.target.value)
                  }
                />
              </label>

              <div
                className="watchlist-status-filter"
                role="group"
                aria-label="Filter library by status"
              >
                {[
                  ["all", "All"],
                  ["want", "Want to watch"],
                  ["watched", "Watched"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      statusFilter === value ? "is-active" : ""
                    }
                    aria-pressed={statusFilter === value}
                    onClick={() => setStatusFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <label className="watchlist-toolbar__sort">
                <span>Sort</span>
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value)
                  }
                >
                  <option value="added">Recently added</option>
                  <option value="title">Title</option>
                  <option value="year">Release year</option>
                  <option value="rating">TMDB rating</option>
                </select>
              </label>

              <button
                className="watchlist-toolbar__random"
                type="button"
                onClick={handleRandomPick}
                disabled={!visibleMovies.length}
              >
                <i
                  className="fa-solid fa-shuffle"
                  aria-hidden="true"
                ></i>
                Pick for me
              </button>

              <button
                className="watchlist-toolbar__clear"
                type="button"
                onClick={handleClear}
              >
                Clear
              </button>
            </div>

            <p className="watchlist-results-count" aria-live="polite">
              {visibleMovies.length} of {watchlist.length} movies
            </p>

            {visibleMovies.length > 0 ? (
              <div className="watchlist-grid">
                {visibleMovies.map((movie) => {
                  const metadata = getWatchlistMeta(movie.id);

                  return (
                    <div className="watchlist-item" key={movie.id}>
                      <MovieCard
                        {...movie}
                        isFavorite={isInWatchlist(movie.id)}
                        onToggleFavorite={handleRemove}
                      />

                      <div className="watchlist-item__details">
                        <div className="watchlist-item__status">
                          <span>Status</span>
                          <div
                            className="watchlist-item__status-options"
                            role="group"
                            aria-label={`Watch status for ${movie.title}`}
                          >
                            <button
                              type="button"
                              className={
                                metadata.status === "want"
                                  ? "is-active"
                                  : ""
                              }
                              aria-pressed={metadata.status === "want"}
                              aria-label={`Mark ${movie.title} as want to watch`}
                              onClick={() =>
                                updateWatchlistMeta(movie.id, {
                                  status: "want",
                                })
                              }
                            >
                              Want to watch
                            </button>
                            <button
                              type="button"
                              className={
                                metadata.status === "watched"
                                  ? "is-active"
                                  : ""
                              }
                              aria-pressed={metadata.status === "watched"}
                              aria-label={`Mark ${movie.title} as watched`}
                              onClick={() =>
                                updateWatchlistMeta(movie.id, {
                                  status: "watched",
                                })
                              }
                            >
                              <i
                                className="fa-solid fa-check"
                                aria-hidden="true"
                              ></i>
                              Watched
                            </button>
                          </div>
                        </div>

                        <label>
                          <span>My rating</span>
                          <select
                            aria-label={`My rating for ${movie.title}`}
                            value={metadata.personalRating ?? ""}
                            onChange={(event) =>
                              updateWatchlistMeta(movie.id, {
                                personalRating: event.target.value
                                  ? Number(event.target.value)
                                  : null,
                              })
                            }
                          >
                            <option value="">Not rated</option>
                            {Array.from(
                              { length: 10 },
                              (_, index) => index + 1
                            ).map((rating) => (
                              <option key={rating} value={rating}>
                                {rating} / 10
                              </option>
                            ))}
                          </select>
                        </label>

                        {metadata.status === "watched" && (
                          <label className="watchlist-item__date">
                            <span>Date watched</span>
                            <input
                              type="date"
                              aria-label={`Date watched for ${movie.title}`}
                              value={metadata.watchedAt || ""}
                              onChange={(event) =>
                                updateWatchlistMeta(movie.id, {
                                  watchedAt: event.target.value,
                                })
                              }
                            />
                          </label>
                        )}

                        <label className="watchlist-item__note">
                          <span>Private note</span>
                          <textarea
                            rows="2"
                            maxLength="180"
                            aria-label={`Private note for ${movie.title}`}
                            placeholder="What do you want to remember?"
                            value={metadata.note || ""}
                            onChange={(event) =>
                              updateWatchlistMeta(movie.id, {
                                note: event.target.value,
                              })
                            }
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="watchlist-filter-empty">
                <i
                  className="fa-solid fa-filter-circle-xmark"
                  aria-hidden="true"
                ></i>
                <h3>No matching movies</h3>
                <p>Change the search or status filter.</p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setStatusFilter("all");
                  }}
                >
                  Reset filters
                </button>
              </div>
            )}
          </section>
        ) : (
          <section className="watchlist-empty">
            <div className="watchlist-empty__icon">
              <i
                className="fa-regular fa-heart"
                aria-hidden="true"
              ></i>
            </div>

            <span>Your collection is empty</span>
            <h2>No saved movies yet</h2>
            <p>
              Explore the catalogue and use the heart button to
              build your personal movie library.
            </p>

            <Link to="/discover">
              Discover movies
              <i
                className="fa-solid fa-arrow-right"
                aria-hidden="true"
              ></i>
            </Link>
          </section>
        )}
      </main>

    </div>
  );
};

export default Watchlist;
