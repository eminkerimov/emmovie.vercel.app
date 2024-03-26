import React from "react";
import Slider from "react-slick";
import { IMG_API } from "../../helpers/baseURL.js";

const settings = {
    infinite: true,
    autoplay: true,
    cssEase: "linear",
    autoplaySpeed: 2000,
    speed: 1000,
    slidesToShow: 5,
    slidesToScroll: 1,
  };

const Posters = (images) => {
  return (
    <>
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
    </>
  );
};

export default Posters;
