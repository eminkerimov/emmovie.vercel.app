import React, { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import useFetch from "../../helpers/useFetch.js";
import useWatchlist from "../../hooks/useWatchlist.jsx";
import useRecentlyViewed from "../../hooks/useRecentlyViewed.jsx";
import { API_KEY } from "../../helpers/baseURL.js";
import "./Movie.scss";
import Loading from "../../components/Loading/Loading";
import Reviews from "../../components/Reviews/Reviews";
import Posters from "../../components/Posters/Posters";
import Related from "../../components/Related/Related";
import Overview from "../../components/Overview/Overview";
import MovieMain from "../../components/MovieMain/MovieMain";
import MovieAvailability from "./MovieAvailability";
import MovieCollection from "./MovieCollection";
import useMovieCollection from "./useMovieCollection";
import {
  getRelatedSelection,
  selectFeaturedVideo,
} from "./movieData";

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
  const movieRequest = useFetch(`${id}?${API_KEY}&language=en-US`);
  const videosRequest = useFetch(
    `${id}/videos?${API_KEY}&language=en-US`
  );
  const recommendationsRequest = useFetch(
    `${id}/recommendations?${API_KEY}&language=en-US`
  );
  const similarRequest = useFetch(
    `${id}/similar?${API_KEY}&language=en-US`
  );
  const images = useFetch(`${id}/images?${API_KEY}&language=en`);
  const reviewsRequest = useFetch(
    `${id}/reviews?${API_KEY}&language=en`
  );
  const providersRequest = useFetch(
    `${id}/watch/providers?${API_KEY}`
  );
  const releaseDatesRequest = useFetch(
    `${id}/release_dates?${API_KEY}`
  );

  const {
    watchlist,
    toggleWatchlist: toggleStoredMovie,
    toggleWatched: toggleStoredWatched,
    isWatched,
  } = useWatchlist();
  const { addRecentlyViewed } = useRecentlyViewed();

  const data = movieRequest.data;
  const movieIsWatched = data ? isWatched(data.id) : false;
  const collectionRequest = useMovieCollection(
    data?.belongs_to_collection?.id
  );
  const relatedSelection = getRelatedSelection(
    recommendationsRequest,
    similarRequest
  );

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
    const featuredVideo = selectFeaturedVideo(
      videosRequest.data?.results
    );

    return featuredVideo ? [featuredVideo] : [];
  }, [videosRequest.data]);

  useEffect(() => {
    if (data?.title) {
      document.title = `${data.title} | M-movie`;
      addRecentlyViewed(data);
    }
  }, [addRecentlyViewed, data]);

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

  const toggleWatched = () => {
    if (!data) return;

    toggleStoredWatched({
      id: data.id,
      title: data.title,
      poster_path: data.poster_path,
      overview: data.overview,
      vote_average: data.vote_average,
      release_date: data.release_date,
    });
  };

  if (movieRequest.loading) {
    return (
      <main className="page-state">
        <Loading />
      </main>
    );
  }

  if (movieRequest.error) {
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
        isWatched={movieIsWatched}
        toggleWatchlist={toggleWatchlist}
        toggleWatched={toggleWatched}
      />
      <Overview data={data} detailsData={detailsData} />
      <MovieAvailability
        providersRequest={providersRequest}
        releaseDatesRequest={releaseDatesRequest}
      />
      <Posters {...images} />
      <Reviews
        error={reviewsRequest.error}
        loading={reviewsRequest.loading}
        results={reviewsRequest.data?.results}
      />
      <MovieCollection
        collection={data.belongs_to_collection}
        currentMovieId={id}
        request={collectionRequest}
        toggleWatchlist={toggleStoredMovie}
        toggleWatched={toggleStoredWatched}
        watchlist={watchlist}
        isWatched={isWatched}
      />
      <Related
        {...relatedSelection}
        watchlist={watchlist}
        toggleWatchlist={toggleStoredMovie}
        toggleWatched={toggleStoredWatched}
        isWatched={isWatched}
      />
    </main>
  );
};

export default Movie;
