import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Movie from "./pages/Movie/Movie";
import Movies from "./pages/Movies/Movies";
import Person from "./pages/Person/Person";
import Search from "./pages/Search/Search";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/search" element={<Search />} />
        <Route path="/movie/:id" element={<Movie />} />
        <Route path="/person/:id" element={<Person />} />
      </Routes>
    </Router>
  );
}

export default App;