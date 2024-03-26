import React from "react";

const Overview = ({ data, detailsData }) => {
  return (
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
  );
};

export default Overview;
