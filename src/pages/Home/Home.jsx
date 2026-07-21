import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loading from "../../components/Loading/Loading";
import MovieCard from "../../components/MovieCard/MovieCard";
import useFetchMovies from "../../hooks/useFetchMovies";
import useWatchlist from "../../hooks/useWatchlist";
import "./Home.scss";

const TABS = [
  {
    id: "popular",
    title: "Popular",
    endpoint: "/movie/popular?language=en-US&page=1",
  },
  {
    id: "top-rated",
    title: "Top Rated",
    endpoint: "/movie/top_rated?language=en-US&page=1",
  },
  {
    id: "upcoming",
    title: "Upcoming",
    endpoint: "/movie/upcoming?language=en-US&page=1",
  },
];

const Home = () => {
  const [activeTab, setActiveTab] = useState("popular");
  const [moviesByTab, setMoviesByTab] = useState({});

  const popularRequest = useFetchMovies();
  const topRatedRequest = useFetchMovies();
  const upcomingRequest = useFetchMovies();

  const { toggleWatchlist, isInWatchlist } =
    useWatchlist();

  useEffect(() => {
    popularRequest.fetchData(
      "GET",
      "/movie/popular?language=en-US&page=1",
      null
    );

    topRatedRequest.fetchData(
      "GET",
      "/movie/top_rated?language=en-US&page=1",
      null
    );

    upcomingRequest.fetchData(
      "GET",
      "/movie/upcoming?language=en-US&page=1",
      null
    );
  }, []);

  useEffect(() => {
    if (!popularRequest.data) return;

    setMoviesByTab((current) => ({
      ...current,
      popular: popularRequest.data.data.results,
    }));
  }, [popularRequest.data]);

  useEffect(() => {
    if (!topRatedRequest.data) return;

    setMoviesByTab((current) => ({
      ...current,
      "top-rated": topRatedRequest.data.data.results,
    }));
  }, [topRatedRequest.data]);

  useEffect(() => {
    if (!upcomingRequest.data) return;

    setMoviesByTab((current) => ({
      ...current,
      upcoming: upcomingRequest.data.data.results,
    }));
  }, [upcomingRequest.data]);

  const isLoading =
    popularRequest.loading ||
    topRatedRequest.loading ||
    upcomingRequest.loading;

  if (isLoading && !moviesByTab.popular) {
    return <Loading />;
  }

  const heroMovie = moviesByTab.popular?.[0];
  const activeMovies = moviesByTab[activeTab] || [];
  const activeTabData = TABS.find(
    (tab) => tab.id === activeTab
  );

  return (
    <main className="home">
      {heroMovie && (
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
              url(
                https://image.tmdb.org/t/p/original${heroMovie.backdrop_path}
              )
            `,
          }}
        >
          <div className="home-hero__content">
            <span className="home-hero__eyebrow">
              Featured movie
            </span>

            <h1>{heroMovie.title}</h1>

            <div className="home-hero__meta">
              <span className="home-hero__rating">
                <i className="fa-solid fa-star"></i>
                {heroMovie.vote_average?.toFixed(1)}
              </span>

              <span>
                {heroMovie.release_date?.slice(0, 4) ||
                  "N/A"}
              </span>

              <span>Popular now</span>
            </div>

            <p>{heroMovie.overview}</p>

            <div className="home-hero__actions">
              <Link
                className="home-hero__primary"
                to={`/movie/${heroMovie.id}`}
              >
                View details
                <i className="fa-solid fa-arrow-right"></i>
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
      )}

      <section className="home-catalog">
        <div className="home-catalog__header">
          <div>
            <span className="home-catalog__eyebrow">
              Explore movies
            </span>

            <h2>{activeTabData?.title}</h2>
          </div>

          <Link
            className="home-catalog__discover"
            to="/discover"
          >
            View all
            <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>

        <div
          className="home-tabs"
          role="tablist"
          aria-label="Movie categories"
        >
          {TABS.map((tab) => (
            <button
              className={
                activeTab === tab.id ? "is-active" : ""
              }
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.title}
            </button>
          ))}
        </div>

        <div className="home-catalog__grid">
          {activeMovies
            .slice(0, 8)
            .map((movie) => (
              <MovieCard
                key={movie.id}
                {...movie}
                isFavorite={isInWatchlist(movie.id)}
                onToggleFavorite={toggleWatchlist}
              />
            ))}
        </div>
      </section>
    </main>
  );
};

export default Home;