import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading/Loading";
import MovieCard from "../../components/MovieCard/MovieCard";
import useFetchMovies from "../../hooks/useFetchMovies";
import "./Home.scss";

const Home = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [popularMovies, setPopularMovies] = useState([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState(false);

  const { data: searchData, fetchData: fetchSearchData, loading: searchDataLoading } = useFetchMovies();
  const { data: popularMoviesData, fetchData: fetchPopularMoviesData, loading: popularMovieLoading } = useFetchMovies();
  const { data: nowPlayingMoviesData, fetchData: fetchNowPlayingMoviesData, loading: nowPlayingMovieLoading } = useFetchMovies();
  const { data: topRatedMoviesData, fetchData: fetchTopRatedMoviesData, loading: topRatedMovieLoading } = useFetchMovies();
  const { data: upcomingMoviesData, fetchData: fetchUpcomingMoviesData, loading: upcomingMovieLoading } = useFetchMovies();

  useEffect(() => {
    fetchPopularMoviesData("GET", "/movie/popular?language=en-US&page=1", null);
    fetchNowPlayingMoviesData("GET", "/movie/now_playing?language=en-US&page=1", null);
    fetchTopRatedMoviesData("GET", "/movie/top_rated?language=en-US&page=1", null);
    fetchUpcomingMoviesData("GET", "/movie/upcoming?language=en-US&page=1", null);
  }, []);

  useEffect(() => {
    if (popularMoviesData) setPopularMovies(popularMoviesData.data.results);
  }, [popularMoviesData]);

  useEffect(() => {
    if (nowPlayingMoviesData) setNowPlayingMovies(nowPlayingMoviesData.data.results);
  }, [nowPlayingMoviesData]);

  useEffect(() => {
    if (topRatedMoviesData) setTopRatedMovies(topRatedMoviesData.data.results);
  }, [topRatedMoviesData]);

  useEffect(() => {
    if (upcomingMoviesData) setUpcomingMovies(upcomingMoviesData.data.results);
  }, [upcomingMoviesData]);

  const toHome = () => {
    setSearchMode(false);
    setSearchResults([]);
    setSearchTerm("");
    setMenuOpen(false);
  };

  useEffect(() => {
    if (searchData) setSearchResults(searchData.data.results);
  }, [searchData]);

  const handleSearch = (e) => {
    e.preventDefault();

    if (searchTerm.trim()) {
      setSearchMode(true);
      setMenuOpen(false);

      fetchSearchData("GET", "/search/movie", {
        query: searchTerm.trim(),
      });

      setSearchTerm("");
    }
  };

  const handleOnChange = (e) => {
    setSearchTerm(e.target.value);
  };

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  if (
    searchDataLoading ||
    popularMovieLoading ||
    nowPlayingMovieLoading ||
    topRatedMovieLoading ||
    upcomingMovieLoading
  ) {
    return <Loading />;
  }

  const heroMovie = popularMovies[0];

  return (
    <div className="home">
      <header className="home-header">
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
              onChange={handleOnChange}
            />
          </form>

          <nav className="home-header__nav">
            <button type="button" onClick={toHome}>Home</button>
            <a href="#popular" onClick={() => setMenuOpen(false)}>Popular</a>
            <a href="#top-rated" onClick={() => setMenuOpen(false)}>Top Rated</a>
            <a href="#upcoming" onClick={() => setMenuOpen(false)}>Upcoming</a>
            <a href="#now-playing" onClick={() => setMenuOpen(false)}>Now Playing</a>
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
            {searchResults.length &&
              searchResults.map((movie) => (
                <MovieCard key={movie.id} {...movie} />
              ))}
          </div>
        </>
      )}

      <>
        <div className="home__section" id="popular">
          <h2 className="home__section-title">Popular</h2>
          <div className="movie-container">
            {popularMovies?.length &&
              popularMovies
                .slice(0, 4)
                .map((movie) => <MovieCard key={movie.id} {...movie} />)}
          </div>
        </div>

        <div className="home__section" id="top-rated">
          <h2 className="home__section-title">Top Rated</h2>
          <div className="movie-container">
            {topRatedMovies?.length &&
              topRatedMovies
                .slice(0, 4)
                .map((movie) => <MovieCard key={movie.id} {...movie} />)}
          </div>
        </div>

        <div className="home__section" id="upcoming">
          <h2 className="home__section-title">Upcoming</h2>
          <div className="movie-container">
            {upcomingMovies?.length &&
              upcomingMovies
                .slice(0, 4)
                .map((movie) => <MovieCard key={movie.id} {...movie} />)}
          </div>
        </div>

        <div className="home__section" id="now-playing">
          <h2 className="home__section-title">Now Playing</h2>
          <div className="movie-container">
            {nowPlayingMovies?.length &&
              nowPlayingMovies
                .slice(0, 4)
                .map((movie) => <MovieCard key={movie.id} {...movie} />)}
          </div>
        </div>
      </>
    </div>
  );
};

export default Home;