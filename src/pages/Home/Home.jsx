import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading/Loading";
import MovieCard from "../../components/MovieCard/MovieCard";
import useFetchMovies from "../../hooks/useFetchMovies";
import "./Home.scss";

const Home = () => {
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
    if (popularMoviesData) {
      setPopularMovies(popularMoviesData.data.results);
    }
  }, [popularMoviesData]);

  useEffect(() => {
    if (nowPlayingMoviesData) {
      setNowPlayingMovies(nowPlayingMoviesData.data.results);
    }
  }, [nowPlayingMoviesData]);

  useEffect(() => {
    if (topRatedMoviesData) {
      setTopRatedMovies(topRatedMoviesData.data.results);
    }
  }, [topRatedMoviesData]);

  useEffect(() => {
    if (upcomingMoviesData) {
      setUpcomingMovies(upcomingMoviesData.data.results);
    }
  }, [upcomingMoviesData]);

  // ================= Search part ==========================

  const toHome = () => {
    setSearchMode(false);
    setSearchResults([]);
    setSearchTerm("");
  }

  useEffect(() => {
    if (searchData) {
      setSearchResults(searchData.data.results);
    }
  }, [searchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm) {
      setSearchMode(true);
      const method = "GET";
      const url = "/search/movie";
      const params = {
        query: searchTerm,
      };
      fetchSearchData(method, url, params);
      setSearchTerm("");
    }
  };

  const handleOnChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // ===================================================
  if (searchDataLoading || popularMovieLoading || nowPlayingMovieLoading || topRatedMovieLoading || upcomingMovieLoading){
    return <Loading/>
  }

  return (
    <div className="home">
      <header>
        <form onSubmit={handleSearch}>
          <div className="logo" onClick={toHome}>
            <i className="fa-solid fa-film"></i>
            M-movie
          </div>
          <input
            className="search"
            type="search"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleOnChange}
          />
        </form>
      </header>
      {searchMode && (
        <>
          <h2 className="home__search">Search Results:</h2>
          <div className="movie-container">
            {searchResults.length &&
              searchResults.map((movie) => (
                <MovieCard key={movie.id} {...movie} />
              ))}
          </div>
        </>
      )}
      <>
        <div className="home__section">
          <h2 className="home__section-title" style={{ background: "#096009" }}>
            Popular
          </h2>
          <div className="movie-container">
            {popularMovies?.length &&
              popularMovies
                .slice(0, 4)
                .map((movie) => <MovieCard key={movie.id} {...movie} />)}
          </div>
        </div>
        <div className="home__section">
          <h2 className="home__section-title" style={{ background: "red" }}>
            Top Rated
          </h2>
          <div className="movie-container">
            {topRatedMovies?.length &&
              topRatedMovies
                .slice(0, 4)
                .map((movie) => <MovieCard key={movie.id} {...movie} />)}
          </div>
        </div>
        <div className="home__section">
          <h2 className="home__section-title" style={{ background: "#ff8b00" }}>
            Upcoming
          </h2>
          <div className="movie-container">
            {upcomingMovies?.length &&
              upcomingMovies
                .slice(0, 4)
                .map((movie) => <MovieCard key={movie.id} {...movie} />)}
          </div>
        </div>
        <div className="home__section">
          <h2
            className="home__section-title"
            style={{ background: "rgb(17 110 124)" }}
          >
            Now Playing
          </h2>
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
