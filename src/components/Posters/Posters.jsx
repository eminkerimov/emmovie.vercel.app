import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { POSTER_API } from "../../helpers/baseURL.js";
import useReveal from "../../hooks/useReveal";

const PrevArrow = ({ onClick }) => (
  <button
    className="movie__images__arrow movie__images__arrow--prev"
    onClick={onClick}
    disabled={!onClick}
    type="button"
    aria-label="Previous posters"
  >
    <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
  </button>
);

const NextArrow = ({ onClick }) => (
  <button
    className="movie__images__arrow movie__images__arrow--next"
    onClick={onClick}
    disabled={!onClick}
    type="button"
    aria-label="Next posters"
  >
    <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
  </button>
);

const settings = {
  infinite: false,
  autoplay: false,
  speed: 350,
  slidesToShow: 5,
  slidesToScroll: 1,
  prevArrow: <PrevArrow />,
  nextArrow: <NextArrow />,
  responsive: [
    { breakpoint: 1280, settings: { slidesToShow: 4 } },
    { breakpoint: 1024, settings: { slidesToShow: 3 } },
    { breakpoint: 768, settings: { slidesToShow: 2 } },
    { breakpoint: 480, settings: { slidesToShow: 1 } },
  ],
};

const Posters = ({ data, error = false, loading = false }) => {
  const { elementRef, isVisible } = useReveal();

  if (!loading && !error && !data?.posters?.length) return null;

  return (
    <section
      ref={elementRef}
      className={`movie__images movie-section-reveal ${
        isVisible ? "is-visible" : ""
      }`}
      aria-labelledby="movie-posters-title"
    >
      <div className="page-container">
        <header className="movie-section-heading movie__images__header">
          <div className="movie-section-heading__copy">
            <span className="movie-section-heading__eyebrow">
              Visual archive
            </span>
            <h2 id="movie-posters-title">Posters</h2>
          </div>

          <span
            className="movie-section-heading__line"
            aria-hidden="true"
          ></span>
        </header>

        {loading ? (
          <p className="movie-optional-status movie-section-content" role="status">
            Loading posters…
          </p>
        ) : error ? (
          <p className="movie-optional-status movie-section-content" role="status">
            Posters are temporarily unavailable.
          </p>
        ) : (
          <div className="movie__images__box movie-section-content">
            <Slider {...settings}>
              {data.posters.map((poster) => (
                <div
                  className="movie__images__box__container"
                  key={poster.file_path}
                >
                  <img
                    src={POSTER_API + poster.file_path}
                    alt="Movie poster"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </Slider>
          </div>
        )}
      </div>
    </section>
  );
};

export default Posters;
