import React, { useMemo, useState } from "react";
import { THUMBNAIL_API } from "../../helpers/baseURL";
import useReveal from "../../hooks/useReveal";
import {
  getRegionalRelease,
  getReleaseTypeLabel,
} from "./movieData";

export const MOVIE_REGION_STORAGE_KEY = "emmovie_movie_region";

const DEFAULT_REGIONS = ["US", "GB", "CA", "AU"];

const readPreferredRegion = () => {
  try {
    const storedRegion = window.localStorage.getItem(
      MOVIE_REGION_STORAGE_KEY
    );

    if (/^[A-Z]{2}$/.test(storedRegion || "")) return storedRegion;
  } catch {
    // The selector remains usable if browser storage is unavailable.
  }

  const localeRegion = window.navigator.language
    ?.match(/[-_]([a-z]{2})$/i)?.[1]
    ?.toUpperCase();

  return localeRegion || "US";
};

const getRegionName = (region) => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(region);
  } catch {
    return region;
  }
};

const formatReleaseDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value.slice(0, 10);

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};

const uniqueProviders = (providers = []) =>
  providers.filter(
    (provider, index, allProviders) =>
      allProviders.findIndex(
        (candidate) => candidate.provider_id === provider.provider_id
      ) === index
  );

const ProviderGroup = ({ label, providers }) => {
  if (!providers.length) return null;

  return (
    <div className="movie-availability__provider-group">
      <h4>{label}</h4>
      <ul aria-label={`${label} providers`}>
        {providers.map((provider) => (
          <li key={provider.provider_id}>
            {provider.logo_path ? (
              <img
                src={THUMBNAIL_API + provider.logo_path}
                alt=""
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span aria-hidden="true">
                {provider.provider_name?.charAt(0)}
              </span>
            )}
            <strong>{provider.provider_name}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
};

const MovieAvailability = ({ providersRequest, releaseDatesRequest }) => {
  const { elementRef, isVisible } = useReveal();
  const [region, setRegion] = useState(readPreferredRegion);
  const providerResults = useMemo(
    () => providersRequest.data?.results || {},
    [providersRequest.data]
  );
  const releaseResults = useMemo(
    () => releaseDatesRequest.data?.results || [],
    [releaseDatesRequest.data]
  );
  const availableRegions = useMemo(() => {
    const releaseRegions = releaseResults.map(
      (release) => release.iso_3166_1
    );

    return [...new Set([
      region,
      ...DEFAULT_REGIONS,
      ...Object.keys(providerResults),
      ...releaseRegions,
    ])]
      .filter(Boolean)
      .sort((first, second) =>
        getRegionName(first).localeCompare(getRegionName(second))
      );
  }, [providerResults, region, releaseResults]);
  const regionalProviders = providerResults[region];
  const providerGroups = [
    {
      label: "Stream",
      providers: uniqueProviders(regionalProviders?.flatrate),
    },
    {
      label: "Free",
      providers: uniqueProviders([
        ...(regionalProviders?.free || []),
        ...(regionalProviders?.ads || []),
      ]),
    },
    {
      label: "Rent",
      providers: uniqueProviders(regionalProviders?.rent),
    },
    {
      label: "Buy",
      providers: uniqueProviders(regionalProviders?.buy),
    },
  ];
  const hasProviders = providerGroups.some(
    (providerGroup) => providerGroup.providers.length
  );
  const regionalRelease = getRegionalRelease(
    releaseDatesRequest.data,
    region
  );

  const handleRegionChange = (event) => {
    const nextRegion = event.target.value;

    setRegion(nextRegion);

    try {
      window.localStorage.setItem(MOVIE_REGION_STORAGE_KEY, nextRegion);
    } catch {
      // Keep the in-memory preference usable if storage is unavailable.
    }
  };

  return (
    <section
      ref={elementRef}
      className={`movie-availability ${
        !providersRequest.loading && !hasProviders
          ? "movie-availability--compact"
          : ""
      } movie-section-reveal ${
        isVisible ? "is-visible" : ""
      }`}
      aria-labelledby="movie-availability-title"
    >
      <div className="page-container">
        <header className="movie-section-heading movie-availability__heading">
          <div className="movie-section-heading__copy">
            <span className="movie-section-heading__eyebrow">
              Decision center
            </span>
            <h2 id="movie-availability-title">Watch &amp; release</h2>
          </div>

          <label className="movie-availability__region">
            <span>Region</span>
            <select
              value={region}
              onChange={handleRegionChange}
              aria-label="Availability region"
            >
              {availableRegions.map((regionCode) => (
                <option key={regionCode} value={regionCode}>
                  {getRegionName(regionCode)}
                </option>
              ))}
            </select>
          </label>
        </header>

        <div
          className={`movie-availability__layout movie-section-content ${
            !providersRequest.loading && !hasProviders
              ? "is-provider-empty"
              : ""
          }`}
        >
          {providersRequest.loading || hasProviders ? (
          <article className="movie-availability__watch">
            <header>
              <div>
                <span>Availability</span>
                <h3>Where to watch</h3>
              </div>
              <i className="fa-solid fa-play" aria-hidden="true"></i>
            </header>

            {providersRequest.loading ? (
              <p className="movie-availability__status" role="status">
                Loading streaming options…
              </p>
            ) : providersRequest.error ? (
              <p className="movie-availability__status" role="status">
                Streaming options are temporarily unavailable.
              </p>
            ) : hasProviders ? (
              <div className="movie-availability__providers">
                {providerGroups.map((providerGroup) => (
                  <ProviderGroup
                    key={providerGroup.label}
                    {...providerGroup}
                  />
                ))}
              </div>
            ) : (
              <p className="movie-availability__status" role="status">
                No streaming, rental, or purchase options are listed for this
                region.
              </p>
            )}

            {!providersRequest.loading && !providersRequest.error && (
              <footer className="movie-availability__watch-footer">
                <p>
                  Availability data supplied by JustWatch via TMDB.
                </p>
                {regionalProviders?.link && (
                  <a
                    href={regionalProviders.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    See all options on TMDB
                    <i
                      className="fa-solid fa-arrow-up-right-from-square"
                      aria-hidden="true"
                    ></i>
                  </a>
                )}
              </footer>
            )}
          </article>
          ) : (
            <div
              className="movie-availability__empty"
              role="status"
            >
              <i className="fa-solid fa-tv" aria-hidden="true"></i>
              <div>
                <span>Streaming availability</span>
                <p>
                  {providersRequest.error
                    ? "Streaming options are temporarily unavailable."
                    : `No streaming, rental, or purchase options are listed for ${getRegionName(
                        region
                      )}. Try another region.`}
                </p>
              </div>
            </div>
          )}

          <aside
            className="movie-availability__release"
            aria-label="Regional release information"
          >
            <header>
              <div>
                <span>Local release</span>
                <h3>{getRegionName(region)}</h3>
              </div>
              <strong>{regionalRelease.certification}</strong>
            </header>

            {releaseDatesRequest.loading ? (
              <p className="movie-availability__status" role="status">
                Loading release information…
              </p>
            ) : releaseDatesRequest.error ? (
              <p className="movie-availability__status" role="status">
                Regional release information is temporarily unavailable.
              </p>
            ) : regionalRelease.releases.length ? (
              <ul className="movie-availability__release-list">
                {regionalRelease.releases.map((release) => (
                  <li
                    key={`${release.type}-${release.release_date}-${release.certification}`}
                  >
                    <span>{getReleaseTypeLabel(release.type)}</span>
                    <time dateTime={release.release_date}>
                      {formatReleaseDate(release.release_date)}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="movie-availability__status" role="status">
                No regional release details are listed.
              </p>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
};

export default MovieAvailability;
