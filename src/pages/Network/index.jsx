import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../../components/Loading/Loading";
import MovieCard from "../../components/MovieCard/MovieCard";
import { IMG_API, POSTER_API } from "../../helpers/baseURL";
import useFetchMovies from "../../hooks/useFetchMovies";
import useWatchlist from "../../hooks/useWatchlist";
import "../Company/index.scss";
import "./index.scss";

const getSafeUrl = (value) => {
  if (!value) return null;

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

const getCountryDetails = (countryCode) => {
  const code = countryCode?.trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(code || "")) return null;

  let name = code;

  try {
    name = new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
  } catch {
    // Keep the ISO code when DisplayNames is unavailable.
  }

  return {
    name,
    flagUrl: `https://flagcdn.io/flags/4x3/${code.toLowerCase()}.svg`,
  };
};

const Network = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const catalogRef = useRef(null);
  const pageChangeRef = useRef(false);
  const [pagination, setPagination] = useState({ networkId: id, page: 1 });
  const [isPageChanging, setIsPageChanging] = useState(false);
  const page = pagination.networkId === id ? pagination.page : 1;
  const {
    data: networkResponse,
    loading: networkLoading,
    error: networkError,
    fetchData: fetchNetwork,
  } = useFetchMovies();
  const {
    data: seriesResponse,
    loading: seriesLoading,
    error: seriesError,
    fetchData: fetchSeries,
  } = useFetchMovies();
  const {
    toggleWatchlist,
    toggleWatched,
    isInWatchlist,
    isWatched,
  } = useWatchlist();
  const network = networkResponse?.data;
  const seriesData = seriesResponse?.data;
  const series = seriesData?.results || [];
  const totalResults = Number(seriesData?.total_results) || 0;
  const totalPages = Math.min(Number(seriesData?.total_pages) || 0, 500);
  const homepageUrl = getSafeUrl(network?.homepage);
  const country = getCountryDetails(network?.origin_country);
  const catalogLoading = seriesLoading || isPageChanging;

  useEffect(() => {
    fetchNetwork("GET", `/network/${id}`, {});
  }, [fetchNetwork, id]);

  useEffect(() => {
    let isActive = true;
    const shouldFinishPageChange = pageChangeRef.current;
    pageChangeRef.current = false;

    fetchSeries("GET", "/discover/tv", {
      include_adult: false,
      language: "en-US",
      page,
      sort_by: "popularity.desc",
      with_networks: id,
    }).finally(() => {
      if (isActive && shouldFinishPageChange) setIsPageChanging(false);
    });

    return () => {
      isActive = false;
    };
  }, [fetchSeries, id, page]);

  useEffect(() => {
    document.title = network?.name
      ? `${network.name} | M-movie`
      : "TV Network | M-movie";
  }, [network?.name]);

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;

    pageChangeRef.current = true;
    setIsPageChanging(true);
    setPagination({ networkId: id, page: nextPage });
    window.requestAnimationFrame(() => {
      catalogRef.current?.scrollIntoView?.({ block: "start" });
    });
  };

  if ((networkLoading || !networkResponse) && !networkError) {
    return (
      <main className="company-page company-page--state network-page">
        <Loading />
      </main>
    );
  }

  if (networkError) {
    return (
      <main
        className="company-page company-page--state network-page"
        role="alert"
      >
        <div className="page-container company-page__state">
          <span>Network unavailable</span>
          <h1>This TV network could not be loaded</h1>
          <p>Check your connection and return to the previous page.</p>
          <button type="button" onClick={() => navigate(-1)}>
            Go back
          </button>
        </div>
      </main>
    );
  }

  if (!network?.id) {
    return (
      <main
        className="company-page company-page--state network-page"
        role="status"
      >
        <div className="page-container company-page__state">
          <span>Network unavailable</span>
          <h1>TV network not found</h1>
          <p>The requested network does not exist or has been removed.</p>
          <button type="button" onClick={() => navigate(-1)}>
            Go back
          </button>
        </div>
      </main>
    );
  }

  const heroBackdrop = series.find((show) => show.backdrop_path)?.backdrop_path;
  const heroStyle = heroBackdrop
    ? {
        backgroundImage: `linear-gradient(90deg, rgba(5, 12, 17, 0.98) 0%, rgba(5, 12, 17, 0.88) 52%, rgba(5, 12, 17, 0.5) 100%), url(${IMG_API}${heroBackdrop})`,
      }
    : undefined;

  return (
    <main className="company-page network-page">
      <section
        className="company-page__hero"
        style={heroStyle}
        aria-labelledby="network-title"
      >
        <div className="page-container">
          <button
            className="company-page__back"
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
            Back
          </button>

          <div className="company-page__hero-layout">
            <div className="company-page__identity">
              <div className="company-page__logo">
                {network.logo_path ? (
                  <img
                    src={POSTER_API + network.logo_path}
                    alt={`${network.name} logo`}
                    decoding="async"
                  />
                ) : (
                  <span aria-hidden="true">{network.name.slice(0, 2)}</span>
                )}
              </div>

              <div className="company-page__hero-copy">
                <span className="company-page__eyebrow">TV network</span>
                <h1 id="network-title">{network.name}</h1>
              </div>
            </div>

            <dl className="company-page__facts">
              <div>
                <dt>Series found</dt>
                <dd>{totalResults.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Origin</dt>
                <dd className="network-page__country">
                  {country ? (
                    <>
                      <img src={country.flagUrl} alt="" />
                      <span>{country.name}</span>
                    </>
                  ) : (
                    "Not listed"
                  )}
                </dd>
              </div>
              <div>
                <dt>Headquarters</dt>
                <dd>{network.headquarters || "Not listed"}</dd>
              </div>
            </dl>

            <div className="company-page__links">
              {homepageUrl && (
                <a href={homepageUrl} target="_blank" rel="noreferrer">
                  Official website
                  <i
                    className="fa-solid fa-arrow-up-right-from-square"
                    aria-hidden="true"
                  ></i>
                </a>
              )}
              <a
                href={`https://www.themoviedb.org/network/${network.id}`}
                target="_blank"
                rel="noreferrer"
              >
                View on TMDB
                <i
                  className="fa-solid fa-arrow-up-right-from-square"
                  aria-hidden="true"
                ></i>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={catalogRef}
        className="company-page__catalog"
        aria-labelledby="network-series-title"
      >
        <div className="page-container">
          <header className="company-page__catalog-header">
            <div>
              <span>Network catalogue</span>
              <h2 id="network-series-title">Series on {network.name}</h2>
            </div>
            {!catalogLoading && !seriesError && (
              <p>
                <strong>{totalResults.toLocaleString()}</strong> series
              </p>
            )}
          </header>

          {catalogLoading && (
            <div className="company-page__catalog-state">
              <Loading />
            </div>
          )}

          {!catalogLoading && seriesError && (
            <div className="company-page__catalog-state" role="alert">
              <i
                className="fa-solid fa-circle-exclamation"
                aria-hidden="true"
              ></i>
              <h3>Series catalogue could not be loaded</h3>
              <p>Check your connection and try this page again.</p>
            </div>
          )}

          {!catalogLoading && !seriesError && series.length > 0 && (
            <div className="company-page__grid" aria-live="polite">
              {series.map((show) => (
                <MovieCard
                  key={show.id}
                  {...show}
                  media_type="tv"
                  isFavorite={isInWatchlist(show.id, "tv")}
                  isWatched={isWatched(show.id, "tv")}
                  onToggleFavorite={toggleWatchlist}
                  onToggleWatched={toggleWatched}
                />
              ))}
            </div>
          )}

          {!catalogLoading && !seriesError && series.length === 0 && (
            <div className="company-page__catalog-state" role="status">
              <i className="fa-solid fa-tv" aria-hidden="true"></i>
              <h3>No series are listed</h3>
              <p>TMDB has not linked any series to this network.</p>
            </div>
          )}

          {!catalogLoading && !seriesError && totalPages > 1 && (
            <nav
              className="company-page__pagination"
              aria-label="Network series pagination"
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
                <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
              </button>
            </nav>
          )}
        </div>
      </section>
    </main>
  );
};

export default Network;
