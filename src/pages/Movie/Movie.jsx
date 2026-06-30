import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useFetch from "../../custom/useFetch";
import { API_KEY } from "../../helpers/baseURL.js";
import "./Movie.scss";
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

  const details = useFetch(`/${id}/credits?${API_KEY}&language=en-US`);
  const { data, loading } = useFetch(`${id}?${API_KEY}`);
  const { data: videosData } = useFetch(`${id}/videos?${API_KEY}&language=en-US`);
  const relatedFilms = useFetch(`${id}/similar?${API_KEY}&language=en-US`);
  const images = useFetch(`${id}/images?${API_KEY}&language=en`);
  const { data: reviews } = useFetch(`${id}/reviews?${API_KEY}&language=en`);

  const [detailsData, setDetailsData] = useState([]);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    if (!data) return;

    setDetailsData([
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
    ]);
  }, [data]);

  useEffect(() => {
    if (!videosData) return;

    const trailers = videosData.results?.filter((video) => video.type === "Trailer");
    const teasers = videosData.results?.filter((video) => video.type === "Teaser");

    if (trailers?.length > 0) {
      setVideos(trailers);
    } else if (teasers?.length > 0) {
      setVideos(teasers);
    } else {
      setVideos(videosData.results || []);
    }
  }, [videosData]);

  if (loading) return <h1>LOADING...</h1>;

  return (
    <div className="movie">
      <MovieMain data={data} details={details} videos={videos} />
      <Overview data={data} detailsData={detailsData} />
      <Posters {...images} />
      <Reviews {...reviews} />
      <Related {...relatedFilms} />
    </div>
  );
};

export default Movie;