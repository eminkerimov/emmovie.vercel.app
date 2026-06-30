import React from "react";
import Slider from "react-slick";
import { IMG_API } from "../../helpers/baseURL.js";

const PrevArrow = ({ onClick }) => (
  <button className="movie__images__arrow movie__images__arrow--prev" onClick={onClick} type="button">
    <i className="fa-solid fa-chevron-left"></i>
  </button>
);

const NextArrow = ({ onClick }) => (
  <button className="movie__images__arrow movie__images__arrow--next" onClick={onClick} type="button">
    <i className="fa-solid fa-chevron-right"></i>
  </button>
);

const settings = {
  infinite: true,
  autoplay: true,
  cssEase: "linear",
  autoplaySpeed: 2000,
  speed: 1000,
  slidesToShow: 5,
  slidesToScroll: 1,
  prevArrow: <PrevArrow />,
  nextArrow: <NextArrow />,
};

const Posters = (images) => {
  return (
    <>
      {images?.data?.posters?.length && (
        <div className="movie__images">
          <div className="container">
            <div className="movie__images__header">
              <h2>Posters</h2>
            </div>

            <div className="movie__images__box">
              <Slider {...settings}>
                {images.data.posters.map((poster, index) => (
                  <div className="movie__images__box__container" key={index}>
                    <img src={IMG_API + poster.file_path} alt="poster" />
                  </div>
                ))}
              </Slider>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Posters;