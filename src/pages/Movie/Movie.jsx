import React from "react";
import { useParams } from "react-router-dom";
import useFetch from "../../custom/useFetch";
import { IMG_API } from "../../helpers/baseURL.js";
import Default from "../../components/Default.jpg";
import "./Movie.scss";

const Movie = () => {
  const id = useParams().id;
  const { data, loading, error } = useFetch(
    `${id}?api_key=e86f2bbf1c8ee2160e90df236faed478`
  );

  return (
    <div
      className="movie"
      style={{
        backgroundImage: `url(${
          data?.backdrop_path ? IMG_API + data?.backdrop_path : Default
        })`,
      }}
    >
      <img
        className="movie__image"
        src={data?.poster_path ? IMG_API + data?.poster_path : Default}
        alt={data?.title}
      />
      <div className="movie__info">
        <h1>{data?.title + ` (${data?.release_date.substr(0,4)})`}</h1>
        <p>
          <b>Release date: </b>
          {data?.release_date}
        </p>
        <p>
          <b>Genres: </b>
          {data?.genres?.map((e) => e.name + " ")}
        </p>
        <p>
          <b>Budget: </b>
          {data?.budget} $
        </p>
        <p>
          <b>Revenue: </b>
          {data?.revenue} $
        </p>
        <p>
          <b>Tagline : </b>
          {data?.tagline}
        </p>
        <h2>Overview</h2>
        <p>{data?.overview}</p>
      </div>
    </div>
  );
};

export default Movie;
