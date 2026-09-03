import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MovieCard from "../../components/MovieCard/MovieCard";
import useWatchlist from "../../hooks/useWatchlist";
import "./index.scss";

const TAB_VALUES = ["want", "watched"];

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
    watchedMovies,
    toggleWatchlist,
    toggleWatched,
    clearWatchlist,
    clearWatched,
    updateWatchlistMeta,
    getWatchlistMeta,
    isInWatchlist,
    isWatched,
  } = useWatchlist();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("want");
  const [sortBy, setSortBy] = useState("added");
  const activeMovies =
    activeTab === "watched" ? watchedMovies : watchlist;
  const activeTabLabel =
    activeTab === "watched" ? "Watched" : "Want to watch";

  const visibleMovies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filteredMovies = activeMovies.filter(
      (movie) =>
        !normalizedQuery ||
        movie.title?.toLowerCase().includes(normalizedQuery)
    );

    return sortMovies(
      filteredMovies,
      sortBy,
      getWatchlistMeta
    );
  }, [
    activeMovies,
    getWatchlistMeta,
    query,
    sortBy,
  ]);

  const handleClear = () => {
    if (activeTab === "watched") {
      clearWatched();
      return;
    }

    clearWatchlist();
  };

  const activateTab = (nextTab) => {
    setActiveTab(nextTab);
    setQuery("");
  };

  const handleTabKeyDown = (event) => {
    const currentIndex = TAB_VALUES.indexOf(activeTab);
    let nextTab = null;

    if (event.key === "ArrowRight") {
      nextTab = TAB_VALUES[(currentIndex + 1) % TAB_VALUES.length];
    } else if (event.key === "ArrowLeft") {
      nextTab = TAB_VALUES[
        (currentIndex - 1 + TAB_VALUES.length) % TAB_VALUES.length
      ];
    } else if (event.key === "Home") {
      nextTab = TAB_VALUES[0];
    } else if (event.key === "End") {
      nextTab = TAB_VALUES[TAB_VALUES.length - 1];
    }

    if (!nextTab) return;

    event.preventDefault();
    activateTab(nextTab);
    document.getElementById(`watchlist-tab-${nextTab}`)?.focus();
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

          <div className="watchlist-hero__summary">
            <div>
              <strong>{watchlist.length}</strong>
              <span>Want to watch</span>
            </div>

            <div>
              <strong>{watchedMovies.length}</strong>
              <span>Watched</span>
            </div>
          </div>
        </section>

        <section
          className="watchlist-content"
          aria-labelledby="watchlist-library-title"
        >
          <h2 id="watchlist-library-title" className="sr-only">
            My movie library
          </h2>

          <div className="watchlist-toolbar">
            <div
              className="watchlist-tabs"
              role="tablist"
              aria-label="Choose a movie collection"
            >
              {[
                ["want", "Want to watch", watchlist.length],
                ["watched", "Watched", watchedMovies.length],
              ].map(([value, label, count]) => (
                <button
                  id={`watchlist-tab-${value}`}
                  key={value}
                  type="button"
                  role="tab"
                  className={activeTab === value ? "is-active" : ""}
                  aria-selected={activeTab === value}
                  aria-controls="watchlist-tab-panel"
                  tabIndex={activeTab === value ? 0 : -1}
                  onClick={() => activateTab(value)}
                  onKeyDown={handleTabKeyDown}
                >
                  {label}
                  <span aria-hidden="true">{count}</span>
                </button>
              ))}
            </div>

            <label className="watchlist-toolbar__search">
              <span className="sr-only">
                Search {activeTabLabel} movies
              </span>
              <i
                className="fa-solid fa-magnifying-glass"
                aria-hidden="true"
              ></i>
              <input
                type="search"
                placeholder={`Search ${activeTabLabel.toLowerCase()}`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <label className="watchlist-toolbar__sort">
              <span>Sort</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
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
              disabled={!activeMovies.length}
              aria-label={`Clear ${activeTabLabel} collection`}
            >
              Clear
            </button>
          </div>

          <div
            id="watchlist-tab-panel"
            role="tabpanel"
            aria-labelledby={`watchlist-tab-${activeTab}`}
          >
            <p className="watchlist-results-count" aria-live="polite">
              {visibleMovies.length} of {activeMovies.length} movies in {" "}
              {activeTabLabel}
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
                        isWatched={isWatched(movie.id)}
                        onToggleFavorite={toggleWatchlist}
                        onToggleWatched={toggleWatched}
                      />

                      <div className="watchlist-item__details">
                        <label className="watchlist-item__rating">
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

                        {activeTab === "watched" && (
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
              query.trim() ? (
                <div className="watchlist-filter-empty">
                  <i
                    className="fa-solid fa-filter-circle-xmark"
                    aria-hidden="true"
                  ></i>
                  <h3>No matching movies</h3>
                  <p>Try another title in this collection.</p>
                  <button type="button" onClick={() => setQuery("")}>
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="watchlist-empty">
                  <div className="watchlist-empty__icon">
                    <i
                      className={
                        activeTab === "watched"
                          ? "fa-regular fa-eye"
                          : "fa-regular fa-heart"
                      }
                      aria-hidden="true"
                    ></i>
                  </div>

                  <span>{activeTabLabel}</span>
                  <h3>
                    {activeTab === "watched"
                      ? "No watched movies yet"
                      : "No movies saved to watch"}
                  </h3>
                  <p>
                    {activeTab === "watched"
                      ? "Use the eye button on any movie card to build your watched collection."
                      : "Explore the catalogue and use the heart button to plan what to watch next."}
                  </p>

                  <Link to="/discover">
                    Discover movies
                    <i
                      className="fa-solid fa-arrow-right"
                      aria-hidden="true"
                    ></i>
                  </Link>
                </div>
              )
            )}
          </div>
        </section>
      </main>

    </div>
  );
};

export default Watchlist;
