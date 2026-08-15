import React, { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import useFetch from "../../helpers/useFetch.js";
import useWatchlist from "../../hooks/useWatchlist.jsx";
import { API_KEY } from "../../helpers/baseURL.js";
import "./Movie.scss";
import Loading from "../../components/Loading/Loading";
import Reviews from "../../components/Reviews/Reviews";
import Posters from "../../components/Posters/Posters";
import Related from "../../components/Related/Related";
import Overview from "../../components/Overview/Overview";
import MovieMain from "../../components/MovieMain/MovieMain";

const formatMoney = (value) => {
  if (!value) return "—";

  return `${value.toLocaleString("en-US")} $`;
};

const formatList = (items, key = "name", limit = 3) => {
  if (!items?.length) return "—";

  return items
    .slice(0, limit)
    .map((item) => item[key])
    .join(" • ");
};

const Movie = () => {
  const { id } = useParams();

  const details = useFetch(`${id}/credits?${API_KEY}&language=en-US`);
  const movieRequest = useFetch(`${id}?${API_KEY}`);
  const videosRequest = useFetch(
    `${id}/videos?${API_KEY}&language=en-US`
  );
  const relatedFilms = useFetch(`${id}/similar?${API_KEY}&language=en-US`);
  const images = useFetch(`${id}/images?${API_KEY}&language=en`);
  const reviewsRequest = useFetch(
    `${id}/reviews?${API_KEY}&language=en`
  );

  const { watchlist, setWatchlist, toggleWatchlist: toggleStoredMovie } =
    useWatchlist();

  const requests = [
    details,
    movieRequest,
    videosRequest,
    relatedFilms,
    images,
    reviewsRequest,
  ];
  const loading = requests.some((request) => request.loading);
  const requestError = requests.find((request) => request.error)?.error;
  const data = movieRequest.data;
  const videosData = videosRequest.data;

  const detailsData = useMemo(() => {
    if (!data) return [];

    return [
      { title: "Release date", value: data.release_date || "—" },
      { title: "Genres", value: formatList(data.genres, "name") },
      { title: "Budget", value: formatMoney(data.budget) },
      { title: "Revenue", value: formatMoney(data.revenue) },
      { title: "Tagline", value: data.tagline || "—" },
      { title: "Runtime", value: data.runtime ? `${data.runtime} min` : "—" },
      {
        title: "Production Companies",
        value: formatList(data.production_companies, "name", 3),
      },
      {
        title: "Countries",
        value: formatList(data.production_countries, "name", 3),
      },
    ];
  }, [data]);

  const videos = useMemo(() => {
    if (!videosData) return [];

    const trailers = videosData.results?.filter((video) => video.type === "Trailer");
    const teasers = videosData.results?.filter((video) => video.type === "Teaser");

    if (trailers?.length > 0) {
      return trailers;
    }

    if (teasers?.length > 0) return teasers;

    return videosData.results || [];
  }, [videosData]);

  useEffect(() => {
    if (data?.title) {
      document.title = `${data.title} | M-movie`;
    }
  }, [data]);

  const toggleWatchlist = () => {
    if (!data) return;

    const movie = {
      id: data.id,
      title: data.title,
      poster_path: data.poster_path,
      overview: data.overview,
      vote_average: data.vote_average,
      release_date: data.release_date,
    };

    toggleStoredMovie(movie);
  };

  if (loading) {
    return (
      <main className="page-state">
        <Loading />
      </main>
    );
  }

  if (requestError) {
    return (
      <main className="page-state" role="alert">
        <div className="page-container">
          <h1>Movie could not be loaded</h1>
          <p>Check your connection and try again.</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="page-state" role="status">
        <div className="page-container">
          <h1>Movie not found</h1>
          <p>The requested movie is unavailable.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="movie">
      <MovieMain
        data={data}
        details={details}
        videos={videos}
        watchlist={watchlist}
        toggleWatchlist={toggleWatchlist}
      />
      <Overview data={data} detailsData={detailsData} />
      <Posters {...images} />
      <Reviews {...reviewsRequest.data} />
      <Related
        {...relatedFilms}
        watchlist={watchlist}
        setWatchlist={setWatchlist}
      />
    </main>
  );
};

export default Movie;
