import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Loading from "../../components/Loading/Loading";
import MovieCard from "../../components/MovieCard/MovieCard";
import { IMG_API } from "../../helpers/baseURL";
import useFetchMovies from "../../hooks/useFetchMovies";
import useRecentlyViewed from "../../hooks/useRecentlyViewed";
import useWatchlist from "../../hooks/useWatchlist";
import "./Home.scss";

const TABS = [
  {
    id: "popular",
    title: "Popular",
    eyebrow: "Trending now",
    description: "The movies shaping the conversation right now.",
    endpoint: "/movie/popular",
  },
  {
    id: "top-rated",
    title: "Top Rated",
    eyebrow: "Audience favorites",
    description: "Standout stories with the strongest viewer scores.",
    endpoint: "/movie/top_rated",
  },
  {
    id: "upcoming",
    title: "Upcoming",
    eyebrow: "Coming soon",
    description: "A first look at the releases heading to screens next.",
    endpoint: "/movie/upcoming",
  },
];

const getCardMovies = (movies, limit = 8) =>
  (Array.isArray(movies) ? movies : [])
    .filter((movie) => movie?.id && movie?.poster_path)
    .slice(0, limit);

const Home = () => {
  const [activeTab, setActiveTab] = useState("popular");
  const [trendingWindow, setTrendingWindow] = useState("day");
  const [moviesByTab, setMoviesByTab] = useState({});
  const [trendingByWindow, setTrendingByWindow] = useState({});
  const [recommendationsByMovie, setRecommendationsByMovie] =
    useState({});
  const catalogRequestIdRef = useRef(0);
  const trendingRequestIdRef = useRef(0);
  const recommendationsRequestIdRef = useRef(0);

  const trendingRequest = useFetchMovies();
  const catalogRequest = useFetchMovies();
  const recommendationsRequest = useFetchMovies();
  const fetchTrending = trendingRequest.fetchData;
  const fetchCatalog = catalogRequest.fetchData;
  const fetchRecommendations =
    recommendationsRequest.fetchData;
  const { recentlyViewed } = useRecentlyViewed();
  const {
    watchlist,
    toggleWatchlist,
    toggleWatched,
    isInWatchlist,
    isWatched,
  } = useWatchlist();

  const activeTabData =
    TABS.find((tab) => tab.id === activeTab) || TABS[0];
  const recommendationSeed = watchlist[0];

  useEffect(() => {
    if (trendingByWindow[trendingWindow]) return undefined;

    const requestId = trendingRequestIdRef.current + 1;
    trendingRequestIdRef.current = requestId;
    let isActive = true;

    fetchTrending(
        "GET",
        `/trending/movie/${trendingWindow}`,
        { language: "en-US" }
      )
      .then((response) => {
        if (
          !isActive ||
          requestId !== trendingRequestIdRef.current ||
          !response?.data?.results
        ) {
          return;
        }

        setTrendingByWindow((current) => ({
          ...current,
          [trendingWindow]: response.data.results,
        }));
      });

    return () => {
      isActive = false;
    };
  }, [
    trendingByWindow,
    fetchTrending,
    trendingWindow,
  ]);

  useEffect(() => {
    if (moviesByTab[activeTab]) return undefined;

    const requestId = catalogRequestIdRef.current + 1;
    catalogRequestIdRef.current = requestId;
    let isActive = true;

    fetchCatalog("GET", activeTabData.endpoint, {
        language: "en-US",
        page: 1,
      })
      .then((response) => {
        if (
          !isActive ||
          requestId !== catalogRequestIdRef.current ||
          !response?.data?.results
        ) {
          return;
        }

        setMoviesByTab((current) => ({
          ...current,
          [activeTab]: response.data.results,
        }));
      });

    return () => {
      isActive = false;
    };
  }, [
    activeTab,
    activeTabData.endpoint,
    fetchCatalog,
    moviesByTab,
  ]);

  useEffect(() => {
    if (
      !recommendationSeed ||
      recommendationsByMovie[recommendationSeed.id]
    ) {
      return undefined;
    }

    const requestId = recommendationsRequestIdRef.current + 1;
    recommendationsRequestIdRef.current = requestId;
    let isActive = true;

    fetchRecommendations(
        "GET",
        `/movie/${recommendationSeed.id}/recommendations`,
        { language: "en-US", page: 1 }
      )
      .then((response) => {
        if (
          !isActive ||
          requestId !== recommendationsRequestIdRef.current ||
          !response?.data?.results
        ) {
          return;
        }

        setRecommendationsByMovie((current) => ({
          ...current,
          [recommendationSeed.id]: response.data.results,
        }));
      });

    return () => {
      isActive = false;
    };
  }, [
    recommendationSeed,
    recommendationsByMovie,
    fetchRecommendations,
  ]);

  const activeMovies = getCardMovies(moviesByTab[activeTab]);
  const trendingMovies =
    trendingByWindow[trendingWindow] || [];
  const heroMovie =
    trendingMovies.find((movie) => movie.backdrop_path) ||
    moviesByTab.popular?.find((movie) => movie.backdrop_path);
  const recentMovies = getCardMovies(recentlyViewed, 4);
  const recommendationMovies = useMemo(() => {
    if (!recommendationSeed) return [];

    const savedMovieIds = new Set(
      watchlist.map((movie) => movie.id)
    );

    return getCardMovies(
      recommendationsByMovie[recommendationSeed.id],
      8
    ).filter((movie) => !savedMovieIds.has(movie.id));
  }, [
    recommendationSeed,
    recommendationsByMovie,
    watchlist,
  ]);

  if (
    !heroMovie &&
    trendingRequest.loading &&
    catalogRequest.loading
  ) {
    return (
      <main className="home home__initial-loading">
        <Loading />
      </main>
    );
  }

  return (
    <main className="home">
      {heroMovie ? (
        <section
          className="home-hero"
          style={{
            backgroundImage: `
              linear-gradient(
                90deg,
                rgba(5, 14, 20, 0.98) 0%,
                rgba(5, 14, 20, 0.84) 38%,
                rgba(5, 14, 20, 0.32) 72%,
                rgba(5, 14, 20, 0.12) 100%
              ),
              linear-gradient(
                0deg,
                rgba(5, 14, 20, 0.94) 0%,
                transparent 42%
              ),
              url(${IMG_API}${heroMovie.backdrop_path})
            `,
          }}
          aria-labelledby="home-featured-title"
        >
          <div className="home-hero__content" key={heroMovie.id}>
            <div
              className="home-hero__trend"
              role="group"
              aria-label="Trending period"
            >
              <span>Trending</span>
              {[
                ["day", "Today"],
                ["week", "This week"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={
                    trendingWindow === value ? "is-active" : ""
                  }
                  aria-pressed={trendingWindow === value}
                  onClick={() => setTrendingWindow(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <h1 id="home-featured-title">{heroMovie.title}</h1>

            <div className="home-hero__meta">
              {heroMovie.vote_average > 0 && (
                <span className="home-hero__rating">
                  <i
                    className="fa-solid fa-star"
                    aria-hidden="true"
                  ></i>
                  {heroMovie.vote_average.toFixed(1)}
                </span>
              )}

              <span>
                {heroMovie.release_date?.slice(0, 4) ||
                  "Date unknown"}
              </span>
              <span>
                {trendingWindow === "day"
                  ? "Trending today"
                  : "Trending this week"}
              </span>
            </div>

            <p>
              {heroMovie.overview ||
                "Open the movie page for cast, reviews and release details."}
            </p>

            <div className="home-hero__actions">
              <Link
                className="home-hero__primary"
                to={`/movie/${heroMovie.id}`}
              >
                View details
                <i
                  className="fa-solid fa-arrow-right"
                  aria-hidden="true"
                ></i>
              </Link>

              <Link
                className="home-hero__secondary"
                to="/discover"
              >
                Discover movies
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="home-hero home-hero--unavailable">
          <div className="home-hero__content">
            <span className="home-hero__eyebrow">
              Emmovie
            </span>
            <h1>Find your next movie</h1>
            <p>Trending titles are temporarily unavailable.</p>
            <Link
              className="home-hero__primary"
              to="/discover"
            >
              Open Discover
            </Link>
          </div>
        </section>
      )}

      <section
        className={`home-catalog home-catalog--${activeTab}`}
        aria-labelledby="home-catalog-title"
      >
        <div className="home-catalog__header">
          <div
            className="home-catalog__heading"
            key={`heading-${activeTab}`}
          >
            <div>
              <span className="home-catalog__eyebrow">
                {activeTabData.eyebrow}
              </span>
              <h2 id="home-catalog-title">
                {activeTabData.title}
              </h2>
              <p className="home-catalog__description">
                {activeTabData.description}
              </p>
            </div>
          </div>

          <Link
            className="home-catalog__discover"
            to="/discover"
          >
            View all
            <i
              className="fa-solid fa-arrow-right"
              aria-hidden="true"
            ></i>
          </Link>
        </div>

        <div
          className="home-tabs"
          role="tablist"
          aria-label="Movie categories"
        >
          {TABS.map((tab) => (
            <button
              id={`home-tab-${tab.id}`}
              className={
                activeTab === tab.id ? "is-active" : ""
              }
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls="home-catalog-panel"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.title}
            </button>
          ))}
        </div>

        <div
          id="home-catalog-panel"
          className="home-catalog__content"
          key={`content-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`home-tab-${activeTab}`}
        >
          {!moviesByTab[activeTab] && catalogRequest.loading && (
            <div className="home-section-state">
              <Loading />
            </div>
          )}

          {!moviesByTab[activeTab] && catalogRequest.error && (
            <div className="home-section-state" role="alert">
              This movie list is temporarily unavailable.
            </div>
          )}

          {moviesByTab[activeTab] && activeMovies.length === 0 && (
            <div className="home-section-state">
              No movies are available in this category.
            </div>
          )}

          {activeMovies.length > 0 && (
            <div className="home-catalog__grid">
              {activeMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  {...movie}
                  isFavorite={isInWatchlist(movie.id)}
                  isWatched={isWatched?.(movie.id) || false}
                  onToggleFavorite={toggleWatchlist}
                  onToggleWatched={toggleWatched}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {recentMovies.length > 0 && (
        <section
          className="home-library"
          aria-labelledby="recently-viewed-title"
        >
          <div className="home-library__header">
            <div>
              <span>Continue exploring</span>
              <h2 id="recently-viewed-title">
                Recently viewed
              </h2>
              <p>Your latest movie pages, ready to reopen.</p>
            </div>
          </div>

          <div className="home-library__grid home-library__grid--compact">
            {recentMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                {...movie}
                isFavorite={isInWatchlist(movie.id)}
                isWatched={isWatched?.(movie.id) || false}
                onToggleFavorite={toggleWatchlist}
                onToggleWatched={toggleWatched}
              />
            ))}
          </div>
        </section>
      )}

      {recommendationSeed && (
        <section
          className="home-library home-library--recommendations"
          aria-labelledby="saved-recommendations-title"
        >
          <div className="home-library__header">
            <div>
              <span>From your library</span>
              <h2 id="saved-recommendations-title">
                Because you saved {recommendationSeed.title}
              </h2>
              <p>Recommendations based on your latest saved movie.</p>
            </div>
            <Link to="/watchlist">Open My Library</Link>
          </div>

          {!recommendationsByMovie[recommendationSeed.id] &&
            recommendationsRequest.loading && (
              <div className="home-section-state">
                <Loading />
              </div>
            )}

          {!recommendationsByMovie[recommendationSeed.id] &&
            recommendationsRequest.error && (
              <div className="home-section-state" role="status">
                Recommendations are temporarily unavailable.
              </div>
            )}

          {recommendationsByMovie[recommendationSeed.id] &&
            recommendationMovies.length === 0 && (
              <div className="home-section-state">
                No new recommendations are available yet.
              </div>
            )}

          {recommendationMovies.length > 0 && (
            <div className="home-library__grid">
              {recommendationMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  {...movie}
                  isFavorite={isInWatchlist(movie.id)}
                  isWatched={isWatched?.(movie.id) || false}
                  onToggleFavorite={toggleWatchlist}
                  onToggleWatched={toggleWatched}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
};

export default Home;
