import React from "react";
import "./Reviews.scss";

const Reviews = (reviews) => {

  return (
    <div className="container">
    <h1>User reviews: {reviews?.results?.length}</h1>
    <div className="reviews">
      {reviews?.results?.length ? (
        reviews.results.map((result, index) => (
        <div className="reviews__box" key={index} onClick={() => window.location.replace(result.url)}>
            <div className="reviews__box__header">
            <div className="reviews__box__header-section">
                <i className="fa-solid fa-user-pen"></i>
                {result.author}
                </div>
            <div className="reviews__box__header-section">
                <i className="fa-regular fa-calendar-days"></i>
                {result.created_at.slice(0, 10) + " " + result.created_at.slice(11, 16)}
                </div>
                </div>
            <div className="reviews__box__content">{result.content}</div>
            </div>
        ))) : (
        <div className="reviews__empty">No reviews yet...</div>
      )}
    </div>
    </div>
  );
};

export default Reviews;
