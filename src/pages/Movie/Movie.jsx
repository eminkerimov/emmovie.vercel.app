import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import useFetch from "../../custom/useFetch";
import { API_KEY, IMG_API } from "../../helpers/baseURL.js";
import Default from "../../components/Default.jpg";
import "./Movie.scss";
import MovieCard from "../../components/MovieCard/MovieCard";

const Movie = () => {
  const navigate = useNavigate();
  const id = useParams().id;
  const details = useFetch(`/${id}/credits?${API_KEY}&language=en-US`);
  const { data, loading } = useFetch(`${id}?${API_KEY}`);
  const videos = useFetch(`${id}/videos?${API_KEY}&language=en-US`);
  const relatedFilms = useFetch(
    `${id}/recommendations?${API_KEY}&language=en-US`
  );

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
                  <i class="fa-solid fa-star"></i>
                  {data?.vote_average.toFixed(1)}
                </h2>
                {/* <h3>({data?.vote_count})</h3> */}
              </div>
              <div className="popularity">
                <span>Popularity:</span>
                <h2>
                  <i class="fa-solid fa-arrow-up-short-wide"></i>
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
      <div className="overview">
        <div className="container">
          <h2>Overview</h2>
          <p>{data?.overview}</p>
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
        <h1>Related movies:</h1>
        </div>
      </div>
      <div className="movie-container">
        {relatedFilms?.data?.results?.length > 0 &&
          relatedFilms?.data?.results?.slice(0, 5).map((movie) => (
            <MovieCard key={movie.id} {...movie} />
          ))}
      </div>
    </div>
  );
};

export default Movie;
