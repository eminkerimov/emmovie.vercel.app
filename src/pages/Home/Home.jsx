import React, { useEffect, useMemo, useState } from "react";
import Loading from "../../components/Loading/Loading";
import MovieCard from "../../components/MovieCard/MovieCard";
import useFetchMovies from "../../hooks/useFetchMovies";
import "./Home.scss";

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

const Home = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [moviesBySection, setMoviesBySection] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState(false);

  const { data: searchData, fetchData: fetchSearchData, loading: searchDataLoading } = useFetchMovies();

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
    [popularMoviesRequest, topRatedMoviesRequest, upcomingMoviesRequest, nowPlayingMoviesRequest]
  );

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

  const handleSearch = (e) => {
    e.preventDefault();

    if (searchTerm.trim()) {
      setSearchMode(true);
      setMenuOpen(false);
      fetchSearchData("GET", "/search/movie", { query: searchTerm.trim() });
      setSearchTerm("");
    }
  };

  const isLoading =
    searchDataLoading ||
    Object.values(sectionRequests).some((request) => request.loading);

  if (isLoading) return <Loading />;

  const heroMovie = moviesBySection.popular?.[0];

  return (
    <div className="home">
      <header className={`home-header ${isScrolled && !menuOpen ? "is-scrolled" : ""}`}>
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

        <div className={`home-header__mobile-panel ${menuOpen ? "is-open" : ""}`}>
          <form className="home-header__search" onSubmit={handleSearch}>
            <input
              type="search"
              placeholder="Search movies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>

          <nav className="home-header__nav">
            <button type="button" onClick={toHome}>Home</button>
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
            {searchResults.map((movie) => (
              <MovieCard key={movie.id} {...movie} />
            ))}
          </div>
        </>
      )}

      {MOVIE_SECTIONS.map(({ id, title }) => (
        <div className="home__section" id={id} key={id}>
          <h2 className="home__section-title">{title}</h2>
          <div className="movie-container">
            {moviesBySection[id]?.slice(0, 4).map((movie) => (
              <MovieCard key={movie.id} {...movie} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Home;