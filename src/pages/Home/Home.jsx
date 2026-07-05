import React, { useEffect, useMemo, useState } from "react";
import Loading from "../../components/Loading/Loading";
import MovieCard from "../../components/MovieCard/MovieCard";
import useFetchMovies from "../../hooks/useFetchMovies";
import "./Home.scss";

const WATCHLIST_KEY = "emmovie_watchlist";

const MOVIE_SECTIONS = [
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
  {
    id: "now-playing",
    title: "Now Playing",
    endpoint: "/movie/now_playing?language=en-US&page=1",
  },
];

const GENRE_OPTIONS = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 18, name: "Drama" },
  { id: 27, name: "Horror" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
];

const Home = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [moviesBySection, setMoviesBySection] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [watchlist, setWatchlist] = useState(() => {
    const savedWatchlist = localStorage.getItem(WATCHLIST_KEY);
    return savedWatchlist ? JSON.parse(savedWatchlist) : [];
  });
  const [showAllWatchlist, setShowAllWatchlist] = useState(false);
  const [discoverMode, setDiscoverMode] = useState(false);
  const [discoverResults, setDiscoverResults] = useState([]);
  const [discoverFilters, setDiscoverFilters] = useState({
    genre: "",
    year: "",
    rating: "",
    sort: "popularity.desc",
  });

  const {
    data: searchData,
    fetchData: fetchSearchData,
    loading: searchDataLoading,
  } = useFetchMovies();

  const {
    data: discoverData,
    fetchData: fetchDiscoverData,
    loading: discoverLoading,
  } = useFetchMovies();

  const popularMoviesRequest = useFetchMovies();
  const topRatedMoviesRequest = useFetchMovies();
  const upcomingMoviesRequest = useFetchMovies();
  const nowPlayingMoviesRequest = useFetchMovies();

  const sectionRequests = useMemo(
    () => ({
      popular: popularMoviesRequest,
      "top-rated": topRatedMoviesRequest,
      upcoming: upcomingMoviesRequest,
      "now-playing": nowPlayingMoviesRequest,
    }),
    [
      popularMoviesRequest,
      topRatedMoviesRequest,
      upcomingMoviesRequest,
      nowPlayingMoviesRequest,
    ]
  );

  useEffect(() => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    MOVIE_SECTIONS.forEach(({ id, endpoint }) => {
      sectionRequests[id].fetchData("GET", endpoint, null);
    });
  }, []);

  useEffect(() => {
    MOVIE_SECTIONS.forEach(({ id }) => {
      const sectionData = sectionRequests[id].data;

      if (sectionData) {
        setMoviesBySection((prev) => ({
          ...prev,
          [id]: sectionData.data.results,
        }));
      }
    });
  }, [
    sectionRequests.popular.data,
    sectionRequests["top-rated"].data,
    sectionRequests.upcoming.data,
    sectionRequests["now-playing"].data,
  ]);

  useEffect(() => {
    if (searchData) setSearchResults(searchData.data.results);
  }, [searchData]);

  useEffect(() => {
    if (discoverData) {
      setDiscoverResults(discoverData.data.results || []);
    }
  }, [discoverData]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const toHome = () => {
    setSearchMode(false);
    setSearchResults([]);
    setSearchTerm("");
    setMenuOpen(false);
  };

  const toggleWatchlist = (movie) => {
    setWatchlist((prev) => {
      const alreadySaved = prev.some((item) => item.id === movie.id);

      if (alreadySaved) {
        return prev.filter((item) => item.id !== movie.id);
      }

      return [movie, ...prev];
    });
  };

  const clearWatchlist = () => {
    setWatchlist([]);
    setShowAllWatchlist(false);
  };

  const isInWatchlist = (movieId) => {
    return watchlist.some((movie) => movie.id === movieId);
  };

  const renderMovieCard = (movie) => (
    <MovieCard
      key={movie.id}
      {...movie}
      isFavorite={isInWatchlist(movie.id)}
      onToggleFavorite={toggleWatchlist}
    />
  );

  const handleSearch = (e) => {
    e.preventDefault();

    if (searchTerm.trim()) {
      setSearchMode(true);
      setMenuOpen(false);
      fetchSearchData("GET", "/search/movie", { query: searchTerm.trim() });
      setSearchTerm("");
    }
  };

  const handleDiscoverChange = (e) => {
    const { name, value } = e.target;

    setDiscoverFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDiscover = (e) => {
    e.preventDefault();

    const params = {
      language: "en-US",
      page: 1,
      sort_by: discoverFilters.sort,
    };

    if (discoverFilters.genre) {
      params.with_genres = discoverFilters.genre;
    }

    if (discoverFilters.year) {
      params.primary_release_year = discoverFilters.year;
    }

    if (discoverFilters.rating) {
      params["vote_average.gte"] = discoverFilters.rating;
      params["vote_count.gte"] = 100;
    }

    setDiscoverMode(true);
    fetchDiscoverData("GET", "/discover/movie", params);
  };

  const clearDiscover = () => {
    setDiscoverMode(false);
    setDiscoverResults([]);
    setDiscoverFilters({
      genre: "",
      year: "",
      rating: "",
      sort: "popularity.desc",
    });
  };

  const isLoading =
    searchDataLoading ||
    Object.values(sectionRequests).some((request) => request.loading);

  if (isLoading) return <Loading />;

  const heroMovie = moviesBySection.popular?.[0];
  const visibleWatchlist = showAllWatchlist ? watchlist : watchlist.slice(0, 4);

  return (
    <div className="home">
      <header
        className={`home-header ${
          isScrolled && !menuOpen ? "is-scrolled" : ""
        }`}
      >
        <div className="home-header__logo" onClick={toHome}>
          <i className="fa-solid fa-film"></i>
          <span>M-movie</span>
        </div>

        <button
          className={`home-header__burger ${menuOpen ? "is-open" : ""}`}
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div
          className={`home-header__mobile-panel ${menuOpen ? "is-open" : ""}`}
        >
          <form className="home-header__search" onSubmit={handleSearch}>
            <input
              type="search"
              placeholder="Search movies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>

          <nav className="home-header__nav">
            <button type="button" onClick={toHome}>
              Home
            </button>

            <a href="#watchlist" onClick={() => setMenuOpen(false)}>
              Watchlist
            </a>

            {MOVIE_SECTIONS.map(({ id, title }) => (
              <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>
                {title}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {!searchMode && heroMovie && (
        <section
          className="home-hero"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(8, 18, 25, 0.96) 0%, rgba(8, 18, 25, 0.75) 45%, rgba(8, 18, 25, 0.2) 100%), url(https://image.tmdb.org/t/p/original${heroMovie.backdrop_path})`,
          }}
        >
          <div className="home-hero__content">
            <span className="home-hero__label">Popular Now</span>
            <h1>{heroMovie.title}</h1>

            <div className="home-hero__meta">
              <span>⭐ {heroMovie.vote_average?.toFixed(1)}</span>
              <span>{heroMovie.release_date?.slice(0, 4)}</span>
            </div>

            <p>{heroMovie.overview}</p>

            <div className="home-hero__actions">
              <a href={`/movie/${heroMovie.id}`}>View Details</a>
            </div>
          </div>
        </section>
      )}

      {searchMode && (
        <>
          <h2 className="home__search">Search Results</h2>
          <div className="movie-container">
            {searchResults.map(renderMovieCard)}
          </div>
        </>
      )}

      {!searchMode && (
        <section className="home-discover">
          <div className="home-discover__header">
            <div>
              <span className="home-discover__label">Find Your Movie</span>
              <h2>Discover Movies</h2>
              <p>Filter movies by genre, year, rating and popularity.</p>
            </div>

            {discoverMode && (
              <button type="button" onClick={clearDiscover}>
                Clear
              </button>
            )}
          </div>

          <form className="home-discover__form" onSubmit={handleDiscover}>
            <select
              name="genre"
              value={discoverFilters.genre}
              onChange={handleDiscoverChange}
            >
              <option value="">Any genre</option>
              {GENRE_OPTIONS.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>

            <input
              name="year"
              type="number"
              placeholder="Year"
              min="1900"
              max="2030"
              value={discoverFilters.year}
              onChange={handleDiscoverChange}
            />

            <select
              name="rating"
              value={discoverFilters.rating}
              onChange={handleDiscoverChange}
            >
              <option value="">Any rating</option>
              <option value="6">6+</option>
              <option value="7">7+</option>
              <option value="8">8+</option>
            </select>

            <select
              name="sort"
              value={discoverFilters.sort}
              onChange={handleDiscoverChange}
            >
              <option value="popularity.desc">Most Popular</option>
              <option value="vote_average.desc">Top Rated</option>
              <option value="primary_release_date.desc">Newest</option>
              <option value="revenue.desc">Highest Revenue</option>
            </select>

            <button type="submit">
              {discoverLoading ? "Loading..." : "Discover"}
            </button>
          </form>

          {discoverMode && (
            <div className="home-discover__results">
              <h3 className="home-discover__title">Discovery Results</h3>

              {discoverResults.length > 0 ? (
                <div className="movie-container">
                  {discoverResults.slice(0, 8).map(renderMovieCard)}
                </div>
              ) : (
                <div className="home-discover__empty">
                  No movies found for these filters.
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <section className="home-watchlist" id="watchlist">
        <div className="home-watchlist__header">
          <div>
            <span className="home-watchlist__label">Saved Movies</span>
            <h2>My Watchlist</h2>
            <p>{watchlist.length} movies saved locally</p>
          </div>

          {watchlist.length > 0 && (
            <div className="home-watchlist__actions">
              {watchlist.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllWatchlist((prev) => !prev)}
                >
                  {showAllWatchlist ? "Show Less" : "View All"}
                </button>
              )}

              <button type="button" onClick={clearWatchlist}>
                Clear All
              </button>
            </div>
          )}
        </div>

        {watchlist.length > 0 ? (
          <div className="movie-container">
            {visibleWatchlist.map(renderMovieCard)}
          </div>
        ) : (
          <div className="home-watchlist__empty">
            <i className="fa-regular fa-heart"></i>
            <h3>No saved movies yet</h3>
            <p>Add movies using the heart button on any movie card.</p>
          </div>
        )}
      </section>

      {MOVIE_SECTIONS.map(({ id, title }) => (
        <div className="home__section" id={id} key={id}>
          <h2 className="home__section-title">{title}</h2>
          <div className="movie-container">
            {moviesBySection[id]?.slice(0, 4).map(renderMovieCard)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Home;