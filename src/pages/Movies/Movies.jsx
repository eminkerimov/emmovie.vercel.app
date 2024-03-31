import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import MovieCard from "../../components/MovieCard/MovieCard";
import useFetchMovies from "../../hooks/useFetchMovies";

const mainRoutes = [
  {path : "/", title: "Popular"},
  {path : "/top-rated", title: "Top Rated"},
  {path : "/upcoming", title: "Upcoming"},
  {path : "/now-playing", title: "Now Playing"}
]

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { data, loading, fetchData } = useFetchMovies();
  let {pathname} = useLocation();
  
  useEffect(() => {
    const method = "GET";
    const url = "/movie/popular?language=en-US&page=1";
    const params = null;
    fetchData(method, url, params);
  }, []);

  useEffect(() => {
    if(data){
      setMovies(data.data.results)
    }
  }, [data])  

  const handleOnSubmit = (e) => {
    e.preventDefault();
    if (searchTerm) {
      const method = "GET";
      const url = "/search/movie";
      const params = {
        query: searchTerm
      };
      fetchData(method, url, params);
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
          <div className="title">
            {mainRoutes.map((route, index) => (
              <Link to={route.path} key={index} className={pathname == route.path && "active"}>{route.title}</Link>
            ))}
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
        {movies?.length && movies.map(movie => (
          <MovieCard key={movie.id} {...movie} />
        ))}
      </div>
    </div>
  );
}

export default Movies;
