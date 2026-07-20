import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import Loading from "../../components/Loading/Loading";
import MovieCard from "../../components/MovieCard/MovieCard";
import useFetchMovies from "../../hooks/useFetchMovies";
import useWatchlist from "../../hooks/useWatchlist";
import HomeHeader from "./components/HomeHeader";
import HomeHero from "./components/HomeHero";
import MovieSection from "./components/MovieSection";
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
    endpoint:
      "/movie/top_rated?language=en-US&page=1",
  },
  {
    id: "upcoming",
    title: "Upcoming",
    endpoint:
      "/movie/upcoming?language=en-US&page=1",
  },
  {
    id: "now-playing",
    title: "Now Playing",
    endpoint:
      "/movie/now_playing?language=en-US&page=1",
  },
];

const Home = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [moviesBySection, setMoviesBySection] =
    useState({});

  const {
    toggleWatchlist,
    isInWatchlist,
  } = useWatchlist();

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
    MOVIE_SECTIONS.forEach(({ id, endpoint }) => {
      sectionRequests[id].fetchData(
        "GET",
        endpoint,
        null
      );
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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen
      ? "hidden"
      : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const renderMovieCard = (movie) => (
    <MovieCard
      key={movie.id}
      {...movie}
      isFavorite={isInWatchlist(movie.id)}
      onToggleFavorite={toggleWatchlist}
    />
  );

  const isLoading = Object.values(
    sectionRequests
  ).some((request) => request.loading);

  if (isLoading) {
    return <Loading />;
  }

  const heroMovie = moviesBySection.popular?.[0];

  return (
    <div className="home">
      <HomeHeader
        menuOpen={menuOpen}
        isScrolled={isScrolled}
        onMenuToggle={() =>
          setMenuOpen((current) => !current)
        }
        onMenuClose={() => setMenuOpen(false)}
      />

      <HomeHero movie={heroMovie} />

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