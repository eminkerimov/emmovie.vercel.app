import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Home from "./pages/Home/Home";
import Movie from "./pages/Movie/Movie";
import Movies from "./pages/Movies/Movies";
import Person from "./pages/Person/Person";
import Search from "./pages/Search/Search";
import Discover from "./pages/Discover";
import Watchlist from "./pages/Watchlist";

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/search" element={<Search />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movie/:id" element={<Movie />} />
        <Route path="/person/:id" element={<Person />} />
      </Routes>
    </Router>
  );
}

export default App;