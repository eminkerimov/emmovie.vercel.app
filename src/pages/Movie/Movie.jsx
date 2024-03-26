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

const Movie = () => {
  const { id } = useParams();
  const details = useFetch(`/${id}/credits?${API_KEY}&language=en-US`);
  const { data, loading } = useFetch(`${id}?${API_KEY}`);
  const { data: videosData } = useFetch(
    `${id}/videos?${API_KEY}&language=en-US`
  );
  const relatedFilms = useFetch(`${id}/similar?${API_KEY}&language=en-US`);
  const images = useFetch(`${id}/images?${API_KEY}&language=en`);
  const {data:reviews} = useFetch(`${id}/reviews?${API_KEY}&language=en`);

  const [detailsData, setDetailsData] = useState([]);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    if (data) {
      const detailsData = [
        { title: "Release date", value: data?.release_date },
        {
          title: "Genres",
          value: data?.genres?.map((e, index) =>
            index === data.genres.length - 1 ? e.name : e.name + ", "
          ),
        },
        { title: "Budget", value: data?.budget + " $" },
        { title: "Revenue", value: data?.revenue + " $" },
        { title: "Tagline", value: data?.tagline },
        { title: "Runtime", value: data?.runtime + " min" },
        {
          title: "Production Companies",
          value: data?.production_companies
            ?.slice(0, 3)
            .map((e, index) =>
              index === data?.production_companies?.slice(0, 3).length - 1
                ? e.name
                : e.name + ", "
            ),
        },
        {
          title: "Countries",
          value: data?.production_countries
            ?.slice(0, 3)
            .map((e, index) =>
              index === data?.production_countries?.slice(0, 3).length - 1
                ? e.name
                : e.name + ", "
            ),
        },
      ];
      setDetailsData(detailsData);
    }
  }, [data]);

  useEffect(() => {
    //Check if data has trailer or teaser type video
    if (videosData) {
      const trailers = videosData?.results?.filter(
        (video) => video.type === "Trailer"
      );
      const teasers = videosData?.results?.filter(
        (video) => video.type === "Teaser"
      );
      if (trailers?.length > 0) {
        setVideos(trailers);
      } else if (teasers?.length > 0) {
        setVideos(teasers);
      } else setVideos(videosData.results);
    }
  }, [videosData]);

  if (loading) {
    return <h1>LOADING...</h1>;
  }

  return (
    <div className="movie">
      <MovieMain data={data} details={details} videos={videos}/>
      <Overview data={data} detailsData={detailsData}/>
      <Posters {...images}/>
      <Reviews {...reviews}/>
      <Related {...relatedFilms}/>
    </div>
  );
};

export default Movie;
