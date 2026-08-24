import React, { useLayoutEffect, useState } from "react";
import useReveal from "../../hooks/useReveal";
import "./Reviews.scss";

const REVIEWS_PER_PAGE = 3;
const EMPTY_REVIEWS = [];

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

const Reviews = ({ results = EMPTY_REVIEWS }) => {
  const { elementRef, isVisible } = useReveal();
  const safeResults = Array.isArray(results) ? results : EMPTY_REVIEWS;
  const [currentPage, setCurrentPage] = useState(0);
  const [expandedReviewKeys, setExpandedReviewKeys] = useState([]);
  const reviewCount = safeResults.length;
  const totalPages = Math.ceil(reviewCount / REVIEWS_PER_PAGE);
  const safePage = totalPages
    ? Math.min(currentPage, totalPages - 1)
    : 0;
  const pageStart = safePage * REVIEWS_PER_PAGE;
  const pageEnd = Math.min(pageStart + REVIEWS_PER_PAGE, reviewCount);
  const visibleReviews = safeResults.slice(pageStart, pageEnd);

  useLayoutEffect(() => {
    setCurrentPage(0);
    setExpandedReviewKeys([]);
  }, [results]);

  const showPreviousPage = () => {
    setCurrentPage((page) => Math.max(0, page - 1));
  };

  const showNextPage = () => {
    setCurrentPage((page) => Math.min(totalPages - 1, page + 1));
  };

  const toggleExpandedReview = (key) => {
    setExpandedReviewKeys((keys) =>
      keys.includes(key)
        ? keys.filter((expandedKey) => expandedKey !== key)
        : [...keys, key]
    );
  };

  return (
    <section
      ref={elementRef}
      className={`reviews-section ${isVisible ? "is-visible" : ""}`}
      aria-labelledby="movie-reviews-title"
    >
      <div className="page-container">
        <div className="reviews-section__layout">
          <header className="reviews-section__header">
            <div>
              <span className="reviews-section__eyebrow">
                Audience journal
              </span>
              <h2 id="movie-reviews-title">User reviews</h2>
            </div>

            <p>Notes from the TMDB community.</p>
          </header>

          {reviewCount ? (
            <div className="reviews-section__body">
              <ol
                id="movie-reviews-list"
                key={`reviews-page-${safePage}`}
                className="reviews reviews--page"
                start={pageStart + 1}
                aria-label={`TMDB user reviews, page ${
                  safePage + 1
                } of ${totalPages}`}
              >
                {visibleReviews.map((result, index) => {
                  const absoluteIndex = pageStart + index;
                  const author =
                    result.author?.trim() || "Anonymous viewer";
                  const rating = result.author_details?.rating;
                  const key =
                    result.id ||
                    result.url ||
                    `${author}-${result.created_at || absoluteIndex}`;
                  const content =
                    typeof result.content === "string" &&
                    result.content.trim()
                      ? result.content
                      : "Review text unavailable.";
                  const canExpand = !result.url && content.length > 300;
                  const isExpanded = expandedReviewKeys.includes(key);
                  const contentId = `movie-review-content-${absoluteIndex}`;

                  return (
                    <li
                      className="reviews__item"
                      key={key}
                      style={{
                        "--review-delay": `${Math.min(index, 5) * 38}ms`,
                      }}
                    >
                      <article className="reviews__entry">
                        <header className="reviews__card-header">
                          <div className="reviews__author">
                            <span
                              className="reviews__avatar"
                              aria-hidden="true"
                            >
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

                          <div className="reviews__meta">
                            <span
                              className="reviews__rating"
                              aria-label={
                                rating == null
                                  ? "Rating unavailable"
                                  : `Rating ${rating} out of 10`
                              }
                            >
                              <i
                                className="fa-solid fa-star"
                                aria-hidden="true"
                              ></i>
                              {rating ?? "N/A"}
                              <small>/10</small>
                            </span>
                          </div>
                        </header>

                        <blockquote
                          className={`reviews__quote ${
                            isExpanded ? "reviews__quote--expanded" : ""
                          }`}
                        >
                          <p id={contentId}>{content}</p>
                        </blockquote>

                        <footer className="reviews__footer">
                          <span>Published on TMDB</span>

                          {result.url ? (
                            <a
                              className="reviews__link"
                              href={result.url}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Read full review by ${author} on TMDB`}
                            >
                              <span>Read full review</span>
                              <i
                                className="fa-solid fa-arrow-right"
                                aria-hidden="true"
                              ></i>
                            </a>
                          ) : canExpand ? (
                            <button
                              className="reviews__expand"
                              type="button"
                              onClick={() => toggleExpandedReview(key)}
                              aria-expanded={isExpanded}
                              aria-controls={contentId}
                              aria-label={`${
                                isExpanded ? "Collapse" : "Expand"
                              } review by ${author}`}
                            >
                              <span>
                                {isExpanded ? "Show less" : "Read full review"}
                              </span>
                              <i
                                className="fa-solid fa-chevron-down"
                                aria-hidden="true"
                              ></i>
                            </button>
                          ) : null}
                        </footer>
                      </article>
                    </li>
                  );
                })}
              </ol>

              {totalPages > 1 && (
                <nav
                  className="reviews-pagination"
                  aria-label="Reviews pagination"
                >
                  <p
                    className="sr-only"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    Showing loaded reviews {pageStart + 1} to {pageEnd} of{" "}
                    {reviewCount}
                  </p>

                  <div className="reviews-pagination__actions">
                    <button
                      type="button"
                      onClick={showPreviousPage}
                      disabled={safePage === 0}
                      aria-controls="movie-reviews-list"
                      aria-label="Show previous reviews"
                    >
                      <i
                        className="fa-solid fa-arrow-left"
                        aria-hidden="true"
                      ></i>
                      Previous
                    </button>

                    <button
                      type="button"
                      onClick={showNextPage}
                      disabled={safePage === totalPages - 1}
                      aria-controls="movie-reviews-list"
                      aria-label="Show next reviews"
                    >
                      Next
                      <i
                        className="fa-solid fa-arrow-right"
                        aria-hidden="true"
                      ></i>
                    </button>
                  </div>
                </nav>
              )}
            </div>
          ) : (
            <div
              className="reviews__empty"
              role="status"
            >
              <span className="reviews__empty-line" aria-hidden="true"></span>
              <div>
                <h3>The audience is still quiet</h3>
                <p>No reviews yet...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
