import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useFetch from "../../custom/useFetch";
import { API_KEY, IMG_API } from "../../helpers/baseURL.js";
import Default from "../../components/Default.jpg";
import "./Movie.scss";
import MovieCard from "../../components/MovieCard/MovieCard";
import Slider from "react-slick";

const settings = {
  infinite: true,
  autoplay: true,
  cssEase: "linear",
  autoplaySpeed: 2000,
  speed: 1000,
  slidesToShow: 5,
  slidesToScroll: 1,
};

const Movie = () => {
  const navigate = useNavigate();
  const id = useParams().id;
  const details = useFetch(`/${id}/credits?${API_KEY}&language=en-US`);
  const { data, loading } = useFetch(`${id}?${API_KEY}`);
  const [detailsData, setDetailsData] = useState([]);
  const videos = useFetch(`${id}/videos?${API_KEY}&language=en-US`);
  const relatedFilms = useFetch(`${id}/similar?${API_KEY}&language=en-US`);
  const images = useFetch(`${id}/images?${API_KEY}&language=en`);
  const reviews = useFetch(`${id}/reviews?${API_KEY}&language=en`);

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
            .map((e, index) => (index == 2 ? e.name : e.name + ", ")),
        },
        {
          title: "Countries",
          value: data?.production_countries
            ?.slice(0, 3)
            .map((e, index) => (index === 2 ? e.name : e.name + ", ")),
        },
      ];
      setDetailsData(detailsData);
    }
  }, [data]);

  if (loading) {
    return <h1>LOADING...</h1>;
  }

  return (
    <div className="movie">
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
                {/* <h3>({data?.vote_count})</h3> */}
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
                src={`https://www.youtube.com/embed/${videos?.data?.results?.[0]?.key}`}
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
                    <>
                      <p>{e.name}</p>
                      {/* <img src={e.profile_path ? IMG_API + e.profile_path : Default} alt={e.cast_id} /> */}
                    </>
                  )
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="movie__overview">
        <div className="container">
          <h2>Overview</h2>
          <p>{data?.overview}</p>
          <div className="movie__overview__details">
            {detailsData?.length &&
              detailsData.map((data, index) => (
                <div className="movie__overview__details__box" key={index}>
                  <div className="movie__overview__details__box-title">
                    {data.title}:
                  </div>
                  <div className="movie__overview__details__box-name">
                    {data.value}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
      {images?.data?.posters?.length && (
        <div className="movie__images">
          <div className="container">
            <h1>Posters:</h1>
            <div className="movie__images__box">
              <Slider {...settings}>
                {images?.data?.posters?.map((poster, index) => (
                  <div className="movie__images__box__container" key={index}>
                    <img src={IMG_API + poster.file_path} alt="poster" />
                  </div>
                ))}
              </Slider>
            </div>
          </div>
        </div>
      )}
      <div className="container">
        <h1>Related movies:</h1>
      </div>
      <div className="movie-container">
        {relatedFilms?.data?.results?.length &&
          relatedFilms?.data?.results
            ?.slice(0, 5)
            .map((movie) => <MovieCard key={movie.id} {...movie} />)}
      </div>
    </div>
  );
};

export default Movie;
