import React from "react";
import { Link } from "react-router-dom";
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
            <h2 id="movie-overview-title">Overview</h2>
          </header>

          <div className="movie__overview__content">
            <article className="movie__overview__story">
              <span className="movie__overview__story-label">Synopsis</span>
              <p className="movie__overview__text">
                {data?.overview || "No overview is available for this movie."}
              </p>
            </article>

            <aside className="movie__overview__facts" aria-label="Film details">
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
                      {item.links?.length ? (
                        <span className="movie__overview__company-links">
                          {item.links.map((link, linkIndex) => (
                            <React.Fragment key={link.id}>
                              <Link to={link.to}>{link.label}</Link>
                              {linkIndex < item.links.length - 1 ? ", " : ""}
                            </React.Fragment>
                          ))}
                        </span>
                      ) : (
                        item.value
                      )}
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
