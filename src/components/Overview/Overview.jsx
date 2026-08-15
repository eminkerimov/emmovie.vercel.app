import React from "react";
import useReveal from "../../hooks/useReveal";

const Overview = ({ data, detailsData }) => {
  const { elementRef, isVisible } = useReveal();
  const detailCount = detailsData?.length || 0;

  return (
    <section
      ref={elementRef}
      className={`movie__overview movie-section-reveal ${
        isVisible ? "is-visible" : ""
      }`}
      aria-labelledby="movie-overview-title"
    >
      <div className="page-container">
        <header className="movie-section-heading movie__overview__header">
          <span className="movie-section-heading__index" aria-hidden="true">
            01
          </span>

          <div>
            <span className="movie-section-heading__eyebrow">
              Story &amp; production
            </span>
            <h2 id="movie-overview-title">Overview</h2>
          </div>
        </header>

        <div className="movie__overview__layout movie-section-content">
          <article className="movie__overview__story">
            <div className="movie__overview__story-label">
              <span>Synopsis</span>
              <span aria-hidden="true">01 / 02</span>
            </div>

            <p className="movie__overview__text">
              {data?.overview || "No overview is available for this movie."}
            </p>
          </article>

          <div className="movie__overview__dossier">
            <div className="movie__overview__dossier-header">
              <span>Film dossier</span>
              <span aria-label={`${detailCount} production facts`}>
                {String(detailCount).padStart(2, "0")}
              </span>
            </div>

            <dl className="movie__overview__details">
              {detailsData?.map((item, index) => (
                <div
                  className="movie__overview__details__box"
                  key={item.title}
                  style={{
                    "--detail-delay": `${Math.min(index, 5) * 35}ms`,
                  }}
                >
                  <dt className="movie__overview__details__title">
                    <span aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item.title}
                  </dt>

                  <dd className="movie__overview__details__value">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Overview;
