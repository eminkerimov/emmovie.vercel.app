import React from "react";
import "./Reviews.scss";

const Reviews = (reviews) => {
  const reviewCount = reviews?.results?.length || 0;

  return (
    <section className="reviews-section">
      <div className="container">
        <div className="reviews-section__header">
          <h2>User reviews</h2>
          <span>{reviewCount}</span>
        </div>

        <div className="reviews">
          {reviewCount ? (
            reviews.results.map((result, index) => (
              <a
                className="reviews__box"
                key={index}
                href={result.url}
                target="_blank"
                rel="noreferrer"
              >
                <div className="reviews__box__header">
                  <span>{result.author}</span>
                  <span>{result.created_at.slice(0, 10)}</span>
                  <span>★ {result.author_details.rating || "—"}</span>
                </div>

                <p className="reviews__box__content">{result.content}</p>

                <span className="reviews__box__link">Read full review</span>
              </a>
            ))
          ) : (
            <div className="reviews__empty">No reviews yet...</div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Reviews;