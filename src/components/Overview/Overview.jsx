import React from "react";
import useReveal from "../../hooks/useReveal";

const Overview = ({ data, detailsData }) => {
  const { elementRef, isVisible } = useReveal();

  return (
    <section
      ref={elementRef}
      className={`movie__overview ${isVisible ? "is-visible" : ""}`}
      aria-labelledby="movie-overview-title"
    >
      <div className="page-container">
        <div className="movie__overview__editorial">
          <header className="movie__overview__masthead">
            <div>
              <span className="movie__overview__eyebrow">Film dossier</span>
              <h2 id="movie-overview-title">Overview</h2>
            </div>

            <p>Story and production notes</p>
          </header>

          <div className="movie__overview__content">
            <article className="movie__overview__story">
              <span className="movie__overview__story-label">Synopsis</span>
              <p className="movie__overview__text">
                {data?.overview || "No overview is available for this movie."}
              </p>
            </article>

            <aside className="movie__overview__facts" aria-label="Film details">
              <header className="movie__overview__facts-header">
                <span>Film profile</span>
                <p>At a glance</p>
              </header>

              <dl className="movie__overview__details">
                {detailsData?.map((item, index) => (
                  <div
                    className="movie__overview__details__box"
                    key={item.title}
                    style={{ "--detail-delay": `${index * 24}ms` }}
                  >
                    <dt className="movie__overview__details__title">
                      {item.title}
                    </dt>

                    <dd className="movie__overview__details__value">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Overview;
