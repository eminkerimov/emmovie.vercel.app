import React, { useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import useFetch from "../../helpers/useFetch.js";
import useWatchlist from "../../hooks/useWatchlist.jsx";
import useRecentlyViewed from "../../hooks/useRecentlyViewed.jsx";
import { API_KEY } from "../../helpers/baseURL.js";
import "./Movie.scss";
import Loading from "../../components/Loading/Loading";
import Reviews from "../../components/Reviews/Reviews";
import Related from "../../components/Related/Related";
import Overview from "../../components/Overview/Overview";
import MovieMain from "../../components/MovieMain/MovieMain";
import MovieCredits from "../../components/MovieCredits/MovieCredits";
import MovieBackdrops from "../../components/MovieBackdrops/MovieBackdrops";
import MovieMedia from "../../components/MovieMedia/MovieMedia";
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

const normalizeTvTitle = (title) => ({
  ...title,
  title: title?.name || title?.title || title?.original_name || "Untitled series",
  original_title: title?.original_name || title?.original_title,
  release_date: title?.first_air_date || title?.release_date || "",
  runtime:
    title?.episode_run_time?.find((runtime) => runtime > 0) ||
    title?.last_episode_to_air?.runtime ||
    title?.runtime,
  media_type: "tv",
});

const normalizeTvRequest = (request) => {
  if (!request?.data?.results) return request;

  return {
    ...request,
    data: {
      ...request.data,
      results: request.data.results.map((title) => ({
        ...normalizeTvTitle(title),
        detailsPath: `/movie/${title.id}?media=tv`,
        libraryDisabled: true,
      })),
    },
  };
};

const Movie = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const mediaType = searchParams.get("media") === "tv" ? "tv" : "movie";
  const isTv = mediaType === "tv";

  const details = useFetch(
    `${id}/credits?${API_KEY}&language=en-US`,
    mediaType
  );
  const movieRequest = useFetch(
    `${id}?${API_KEY}&language=en-US`,
    mediaType
  );
  const videosRequest = useFetch(
    `${id}/videos?${API_KEY}&language=en-US`,
    mediaType
  );
  const recommendationsRequest = useFetch(
    `${id}/recommendations?${API_KEY}&language=en-US`,
    mediaType
  );
  const similarRequest = useFetch(
    `${id}/similar?${API_KEY}&language=en-US`,
    mediaType
  );
  const imagesRequest = useFetch(
    `${id}/images?${API_KEY}&include_image_language=en,null`,
    mediaType
  );
  const reviewsRequest = useFetch(
    `${id}/reviews?${API_KEY}&language=en`,
    mediaType
  );
  const providersRequest = useFetch(
    `${id}/watch/providers?${API_KEY}`,
    mediaType
  );
  const releaseDatesRequest = useFetch(
    `${id}/${isTv ? "content_ratings" : "release_dates"}?${API_KEY}`,
    mediaType
  );

  const {
    watchlist,
    toggleWatchlist: toggleStoredMovie,
    toggleWatched: toggleStoredWatched,
    isWatched,
  } = useWatchlist();
  const { addRecentlyViewed } = useRecentlyViewed();

  const data = useMemo(
    () =>
      isTv && movieRequest.data
        ? normalizeTvTitle(movieRequest.data)
        : movieRequest.data,
    [isTv, movieRequest.data]
  );
  const movieIsWatched = !isTv && data ? isWatched(data.id) : false;
  const collectionRequest = useMovieCollection(
    isTv ? null : data?.belongs_to_collection?.id
  );
  const relatedSelection = getRelatedSelection(
    isTv ? normalizeTvRequest(recommendationsRequest) : recommendationsRequest,
    isTv ? normalizeTvRequest(similarRequest) : similarRequest
  );
  const availabilityReleaseRequest = isTv
    ? {
        ...releaseDatesRequest,
        data: releaseDatesRequest.data
          ? {
              results: (releaseDatesRequest.data.results || []).map(
                (rating) => ({
                  iso_3166_1: rating.iso_3166_1,
                  release_dates: [
                    {
                      type: 6,
                      release_date: data?.release_date || "",
                      certification: rating.rating || "",
                    },
                  ],
                })
              ),
            }
          : null,
      }
    : releaseDatesRequest;

  const detailsData = useMemo(() => {
    if (!data) return [];

    return [
      {
        title: isTv ? "First air date" : "Release date",
        value: data.release_date || "—",
      },
      { title: "Genres", value: formatList(data.genres, "name") },
      ...(isTv
        ? [
            {
              title: "Seasons",
              value: data.number_of_seasons || "—",
            },
            {
              title: "Episodes",
              value: data.number_of_episodes || "—",
            },
          ]
        : [
            { title: "Budget", value: formatMoney(data.budget) },
            { title: "Revenue", value: formatMoney(data.revenue) },
          ]),
      { title: "Tagline", value: data.tagline || "—" },
      {
        title: isTv ? "Episode runtime" : "Runtime",
        value: data.runtime ? `${data.runtime} min` : "—",
      },
      {
        title: "Production Companies",
        value: formatList(data.production_companies, "name", 3),
        links: data.production_companies?.slice(0, 3).map((company) => ({
          id: company.id,
          label: company.name,
          to: `/company/${company.id}`,
        })),
      },
      {
        title: "Countries",
        value: formatList(data.production_countries, "name", 3),
      },
    ];
  }, [data, isTv]);

  const videos = useMemo(() => {
    const featuredVideo = selectFeaturedVideo(
      videosRequest.data?.results
    );

    return featuredVideo ? [featuredVideo] : [];
  }, [videosRequest.data]);

  useEffect(() => {
    if (data?.title) {
      document.title = `${data.title} | M-movie`;
      if (!isTv) addRecentlyViewed(data);
    }
  }, [addRecentlyViewed, data, isTv]);

  const toggleWatchlist = () => {
    if (!data || isTv) return;

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
    if (!data || isTv) return;

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
          <h1>{isTv ? "Series" : "Movie"} could not be loaded</h1>
          <p>Check your connection and try again.</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="page-state" role="status">
        <div className="page-container">
          <h1>{isTv ? "Series" : "Movie"} not found</h1>
          <p>The requested {isTv ? "series" : "movie"} is unavailable.</p>
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
        watchlist={isTv ? [] : watchlist}
        isWatched={movieIsWatched}
        toggleWatchlist={isTv ? undefined : toggleWatchlist}
        toggleWatched={isTv ? undefined : toggleWatched}
        mediaType={mediaType}
      />
      <Overview data={data} detailsData={detailsData} />
      <MovieBackdrops imagesRequest={imagesRequest} title={data.title} />
      <MovieCredits request={details} />
      <MovieAvailability
        providersRequest={providersRequest}
        releaseDatesRequest={availabilityReleaseRequest}
      />
      <MovieMedia
        imagesRequest={imagesRequest}
        title={data.title}
        videosRequest={videosRequest}
      />
      <Reviews
        error={reviewsRequest.error}
        loading={reviewsRequest.loading}
        results={reviewsRequest.data?.results}
      />
      {!isTv && (
        <MovieCollection
          collection={data.belongs_to_collection}
          currentMovieId={id}
          request={collectionRequest}
          toggleWatchlist={toggleStoredMovie}
          toggleWatched={toggleStoredWatched}
          watchlist={watchlist}
          isWatched={isWatched}
        />
      )}
      <Related
        {...relatedSelection}
        watchlist={watchlist}
        toggleWatchlist={toggleStoredMovie}
        toggleWatched={toggleStoredWatched}
        isWatched={isWatched}
        mediaType={mediaType}
      />
    </main>
  );
};

export default Movie;
