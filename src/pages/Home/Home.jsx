import React, { useEffect, useMemo, useState } from "react";
import useFetchMovies from "../../hooks/useFetchMovies";
import HomeHeader from "./components/HomeHeader";
import HomeHero from "./components/HomeHero";
import DiscoverSection from "./components/DiscoverSection";
import WatchlistSection from "./components/WatchlistSection";
import MovieSection from "./components/MovieSection";
import "./Home.scss";
import MovieCard from "../../components/MovieCard/MovieCard";
import Loading from "../../components/Loading/Loading";

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

const INITIAL_DISCOVER_FILTERS = {
  genre: "",
  year: "",
  rating: "",
  sort: "popularity.desc",
};

const Home = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [moviesBySection, setMoviesBySection] = useState({});

  const [watchlist, setWatchlist] = useState(() => {
    try {
      const savedWatchlist = localStorage.getItem(WATCHLIST_KEY);
      return savedWatchlist ? JSON.parse(savedWatchlist) : [];
    } catch {
      return [];
    }
  });

  const [showAllWatchlist, setShowAllWatchlist] = useState(false);
  const [discoverMode, setDiscoverMode] = useState(false);
  const [discoverResults, setDiscoverResults] = useState([]);
  const [discoverFilters, setDiscoverFilters] = useState(
    INITIAL_DISCOVER_FILTERS
  );

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

      if (!sectionData) return;

      setMoviesBySection((previousSections) => ({
        ...previousSections,
        [id]: sectionData.data.results,
      }));
    });
  }, [
    sectionRequests.popular.data,
    sectionRequests["top-rated"].data,
    sectionRequests.upcoming.data,
    sectionRequests["now-playing"].data,
  ]);

  useEffect(() => {
    if (discoverData) {
      setDiscoverResults(discoverData.data.results || []);
    }
  }, [discoverData]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const toggleWatchlist = (movie) => {
    setWatchlist((currentWatchlist) => {
      const alreadySaved = currentWatchlist.some(
        (item) => item.id === movie.id
      );

      if (alreadySaved) {
        return currentWatchlist.filter((item) => item.id !== movie.id);
      }

      return [movie, ...currentWatchlist];
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

  const handleDiscoverChange = (event) => {
    const { name, value } = event.target;

    setDiscoverFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  };

  const handleDiscover = (event) => {
    event.preventDefault();

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
    setDiscoverFilters(INITIAL_DISCOVER_FILTERS);
  };

  const isLoading = Object.values(sectionRequests).some(
    (request) => request.loading
  );

  if (isLoading) {
    return <Loading />;
  }

  const heroMovie = moviesBySection.popular?.[0];

  const visibleWatchlist = showAllWatchlist
    ? watchlist
    : watchlist.slice(0, 4);

  return (
    <div className="home">
      <HomeHeader
        menuOpen={menuOpen}
        isScrolled={isScrolled}
        movieSections={MOVIE_SECTIONS}
        onMenuToggle={() => setMenuOpen((current) => !current)}
        onMenuClose={() => setMenuOpen(false)}
      />

      <HomeHero movie={heroMovie} />

      <DiscoverSection
        genreOptions={GENRE_OPTIONS}
        discoverMode={discoverMode}
        discoverResults={discoverResults}
        discoverFilters={discoverFilters}
        discoverLoading={discoverLoading}
        onFilterChange={handleDiscoverChange}
        onSubmit={handleDiscover}
        onClear={clearDiscover}
        renderMovieCard={renderMovieCard}
      />

      <WatchlistSection
        watchlist={watchlist}
        visibleWatchlist={visibleWatchlist}
        showAllWatchlist={showAllWatchlist}
        onToggleShowAll={() =>
          setShowAllWatchlist((currentValue) => !currentValue)
        }
        onClear={clearWatchlist}
        renderMovieCard={renderMovieCard}
      />

      {MOVIE_SECTIONS.map(({ id, title }) => (
        <MovieSection
          key={id}
          id={id}
          title={title}
          movies={moviesBySection[id]}
          renderMovieCard={renderMovieCard}
        />
      ))}
    </div>
  );
};

export default Home;