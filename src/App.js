import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Movie from "./pages/Movie/Movie";
import Movies from "./pages/Movies/Movies";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/movies" element={<Movies />}/>
        <Route path="/movie/:id" element={<Movie/>} />
      </Routes>
    </Router>
  );
}

export default App;
