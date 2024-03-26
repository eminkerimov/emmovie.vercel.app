import React, { useEffect, useState } from "react";
import MovieCard from "../../components/MovieCard/MovieCard";
import {API_KEY, BASE_URL} from "../../helpers/baseURL";
import "./Home.scss";

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const getMovies = (API) => {
    fetch(API)
      .then((res) => res.json())
      .then((data) => {
        setMovies(data.results);
      });
  }

  useEffect(() => {
    getMovies(BASE_URL + "/discover/movie?sort_by=popularity.desc&" + API_KEY)
  }, []);

  const handleOnSubmit = (e) => {
    e.preventDefault();
    if (searchTerm) {
      getMovies(BASE_URL + "/search/movie?&" + API_KEY + "&query=" + searchTerm);
      setSearchTerm('');
    }
  }

  const handleOnChange = (e) => {
    setSearchTerm(e.target.value);
  };


  return (
    <div>
      <header>
        <form onSubmit={handleOnSubmit}>
          <div className="logo">
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
      <div className="movie-container">
        {movies.length && movies.map(movie => (
          <MovieCard key={movie.id} {...movie} />
        ))}
      </div>
    </div>
  );
}

export default Home;
