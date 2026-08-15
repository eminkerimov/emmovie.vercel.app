import React from "react";
import useReveal from "../../hooks/useReveal";
import "./Reviews.scss";

const formatReviewDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value.slice(0, 10);

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getInitials = (author) =>
  author
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

const Reviews = ({ results = [] }) => {
  const { elementRef, isVisible } = useReveal();
  const reviewCount = results.length;

  return (
    <section
      ref={elementRef}
      className={`reviews-section movie-section-reveal ${
        isVisible ? "is-visible" : ""
      }`}
      aria-labelledby="movie-reviews-title"
    >
      <div className="page-container">
        <header className="movie-section-heading reviews-section__header">
          <span className="movie-section-heading__index" aria-hidden="true">
            03
          </span>

          <div className="reviews-section__heading-copy">
            <span className="movie-section-heading__eyebrow">
              Audience notes
            </span>
            <h2 id="movie-reviews-title">User reviews</h2>
          </div>

          <div
            className="reviews-section__count"
            aria-label={`${reviewCount} ${
              reviewCount === 1 ? "review" : "reviews"
            }`}
          >
            <strong>{String(reviewCount).padStart(2, "0")}</strong>
            <span>{reviewCount === 1 ? "review" : "reviews"}</span>
          </div>
        </header>

        {reviewCount ? (
          <ol className="reviews movie-section-content" aria-label="TMDB user reviews">
            {results.map((result, index) => {
              const author = result.author?.trim() || "Anonymous viewer";
              const rating = result.author_details?.rating;
              const key =
                result.id ||
                result.url ||
                `${author}-${result.created_at || index}`;

              return (
                <li
                  className={`reviews__item ${
                    index === 0 ? "reviews__item--featured" : ""
                  }`}
                  key={key}
                  style={{
                    "--review-delay": `${Math.min(index, 5) * 38}ms`,
                  }}
                >
                  <article className="reviews__card">
                    <header className="reviews__card-header">
                      <div className="reviews__author">
                        <span className="reviews__avatar" aria-hidden="true">
                          {getInitials(author)}
                        </span>

                        <div>
                          <h3>{author}</h3>
                          {result.created_at ? (
                            <time dateTime={result.created_at}>
                              {formatReviewDate(result.created_at)}
                            </time>
                          ) : (
                            <span className="reviews__date">
                              Date unavailable
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className="reviews__rating"
                        aria-label={
                          rating == null
                            ? "Rating unavailable"
                            : `Rating ${rating} out of 10`
                        }
                      >
                        <i className="fa-solid fa-star" aria-hidden="true"></i>
                        {rating ?? "—"}
                        <small>/10</small>
                      </span>
                    </header>

                    <blockquote className="reviews__quote">
                      <p>{result.content}</p>
                    </blockquote>

                    {result.url && (
                      <a
                        className="reviews__link"
                        href={result.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Read full review by ${author} on TMDB`}
                      >
                        <span>Read full review</span>
                        <i
                          className="fa-solid fa-arrow-up-right-from-square"
                          aria-hidden="true"
                        ></i>
                      </a>
                    )}
                  </article>
                </li>
              );
            })}
          </ol>
        ) : (
          <div
            className="reviews__empty movie-section-content"
            role="status"
          >
            <span className="reviews__empty-mark" aria-hidden="true">
              “
            </span>
            <div>
              <h3>The audience is still quiet</h3>
              <p>No reviews yet...</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Reviews;
