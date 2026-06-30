import React from "react";

const Overview = ({ data, detailsData }) => {
  return (
    <section className="movie__overview">
      <div className="container">
        <div className="movie__overview__header">
          <h2>Overview</h2>
        </div>

        <p className="movie__overview__text">{data?.overview}</p>

        <div className="movie__overview__details">
          {detailsData?.map((item, index) => (
            <div
              className="movie__overview__details__box"
              key={index}
            >
              <span className="movie__overview__details__title">
                {item.title}
              </span>

              <span className="movie__overview__details__value">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Overview;