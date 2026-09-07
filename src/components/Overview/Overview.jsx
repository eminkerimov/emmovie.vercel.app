import React from "react";
import { Link } from "react-router-dom";
import { THUMBNAIL_API } from "../../helpers/baseURL";
import useReveal from "../../hooks/useReveal";
import ProgressiveImage from "../ProgressiveImage/ProgressiveImage";

const getCountryFlagUrl = (countryCode) => {
  const normalizedCode = countryCode?.trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(normalizedCode || "")) {
    return null;
  }

  return `https://flagcdn.io/flags/4x3/${normalizedCode.toLowerCase()}.svg`;
};

const Overview = ({ data, detailsData }) => {
  const { elementRef, isVisible } = useReveal();
  const supportingTitles = new Set([
    "Tagline",
    "Production Companies",
    "Countries",
  ]);
  const keyFacts = detailsData?.filter(
    (item) => !supportingTitles.has(item.title)
  );
  const supportingFacts = detailsData?.filter(
    (item) =>
      item.title === "Production Companies" || item.title === "Countries"
  );

  const renderCountryFlags = () => (
    <span
      className="movie__overview__flags"
      aria-label="Production countries"
    >
      {data.production_countries.slice(0, 5).map((country) => {
        const flagUrl = getCountryFlagUrl(country.iso_3166_1);

        return flagUrl ? (
          <ProgressiveImage
            key={country.iso_3166_1 || country.name}
            src={flagUrl}
            alt={country.name}
            title={country.name}
            loading="lazy"
            decoding="async"
          />
        ) : null;
      })}
    </span>
  );

  const renderFactValue = (item) => {
    if (item.title === "Countries" && data?.production_countries?.length) {
      return renderCountryFlags();
    }

    return item.links?.length ? (
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
    );
  };

  const renderSupportingValue = (item) => {
    if (item.title === "Countries" && data?.production_countries?.length) {
      return renderCountryFlags();
    }

    if (item.title === "Production Companies" && data?.production_companies?.length) {
      return (
        <ul className="movie__overview__logos" aria-label="Production companies">
          {data.production_companies.slice(0, 4).map((company) => (
            <li key={company.id || company.name}>
              <Link to={`/company/${company.id}`}>
                {company.logo_path ? (
                  <ProgressiveImage
                    src={`${THUMBNAIL_API}${company.logo_path}`}
                    alt={company.name}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span>{company.name}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      );
    }

    return renderFactValue(item);
  };

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
              <span className="movie__overview__label">The story</span>
              <h2 id="movie-overview-title">Overview</h2>
            </div>
            {data?.tagline && (
              <p className="movie__overview__tagline">{data.tagline}</p>
            )}
          </header>

          <article className="movie__overview__story">
            <span className="movie__overview__story-label">Synopsis</span>
            <p className="movie__overview__text">
              {data?.overview || "No overview is available for this title."}
            </p>
          </article>

          <dl className="movie__overview__details" aria-label="Title details">
            {keyFacts?.map((item, index) => (
              <div
                className="movie__overview__details__box"
                key={item.title}
                style={{ "--detail-delay": `${index * 24}ms` }}
              >
                <dt className="movie__overview__details__title">
                  {item.title}
                </dt>
                <dd className="movie__overview__details__value">
                  {renderFactValue(item)}
                </dd>
              </div>
            ))}
          </dl>

          <dl className="movie__overview__supporting" aria-label="Production details">
            {supportingFacts?.map((item) => (
              <div key={item.title}>
                <dt>{item.title}</dt>
                <dd>{renderSupportingValue(item)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
};

export default Overview;
