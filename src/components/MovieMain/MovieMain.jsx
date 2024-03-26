import React from 'react'
import Default from "../../images/Default.jpg";
import { IMG_API } from "../../helpers/baseURL.js";
import { useNavigate } from "react-router-dom";

const MovieMain = ({data, details, videos}) => {
    const navigate = useNavigate();

  return (
    <div
    className="movie__main"
    style={{
      backgroundImage: `url(${
        data?.backdrop_path ? IMG_API + data?.backdrop_path : Default
      })`,
    }}
  >
    <div className="container">
      <div className="movie__main__header" onClick={() => navigate("/")}>
        <i className="fa-solid fa-house fa-lg"></i>
      </div>
      <div className="movie__main__title">
        <div className="movie__main__title__left">
          <h1>{data?.title}</h1>
          <span>{data?.release_date.substr(0, 4)}</span>
        </div>
        <div className="movie__main__title__right">
          <div className="rating">
            <span>Rating:</span>
            <h2>
              <i className="fa-solid fa-star"></i>
              {data?.vote_average.toFixed(1)}
            </h2>
          </div>
          <div className="popularity">
            <span>Popularity:</span>
            <h2>
              <i className="fa-solid fa-arrow-up-short-wide"></i>
              {data?.popularity.toFixed(0)}
            </h2>
          </div>
        </div>
      </div>
      <div className="movie__main__info">
        <img
          className="movie__main__info__image"
          src={data?.poster_path ? IMG_API + data?.poster_path : Default}
          alt={data?.title}
        />
        <div className="movie__main__info__video">
          <iframe
            width="100%"
            height="450"
            src={`https://www.youtube.com/embed/${videos?.[0]?.key}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Embedded youtube"
          />
        </div>
        <div className="movie__main__info__cast">
          <h3>Top cast :</h3>
          {details?.data?.cast?.map(
            (e, index) =>
              index < 10 && (
                  <p key={index}>{e.name}</p>
              )
          )}
        </div>
      </div>
    </div>
  </div>
  )
}

export default MovieMain