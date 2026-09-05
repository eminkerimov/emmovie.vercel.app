import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Loading from "../../components/Loading/Loading";
import MovieCard from "../../components/MovieCard/MovieCard";
import { IMG_API, POSTER_API } from "../../helpers/baseURL";
import useFetchMovies from "../../hooks/useFetchMovies";
import useWatchlist from "../../hooks/useWatchlist";
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

const Company = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const catalogRef = useRef(null);
  const [pagination, setPagination] = useState({ companyId: id, page: 1 });
  const page = pagination.companyId === id ? pagination.page : 1;
  const {
    data: companyResponse,
    loading: companyLoading,
    error: companyError,
    fetchData: fetchCompany,
  } = useFetchMovies();
  const {
    data: moviesResponse,
    loading: moviesLoading,
    error: moviesError,
    fetchData: fetchMovies,
  } = useFetchMovies();
  const {
    toggleWatchlist,
    toggleWatched,
    isInWatchlist,
    isWatched,
  } = useWatchlist();
  const company = companyResponse?.data;
  const movieData = moviesResponse?.data;
  const movies = movieData?.results || [];
  const totalResults = Number(movieData?.total_results) || 0;
  const totalPages = Math.min(Number(movieData?.total_pages) || 0, 500);
  const homepageUrl = getSafeUrl(company?.homepage);

  useEffect(() => {
    fetchCompany("GET", `/company/${id}`, {});
  }, [fetchCompany, id]);

  useEffect(() => {
    fetchMovies("GET", "/discover/movie", {
      include_adult: false,
      include_video: false,
      language: "en-US",
      page,
      sort_by: "popularity.desc",
      with_companies: id,
    });
  }, [fetchMovies, id, page]);

  useEffect(() => {
    document.title = company?.name
      ? `${company.name} | M-movie`
      : "Production Company | M-movie";
  }, [company?.name]);

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;

    setPagination({ companyId: id, page: nextPage });

    window.requestAnimationFrame(() => {
      catalogRef.current?.scrollIntoView?.({ block: "start" });
    });
  };

  if (companyLoading && !company) {
    return (
      <main className="company-page company-page--state">
        <Loading />
      </main>
    );
  }

  if (companyError) {
    return (
      <main className="company-page company-page--state" role="alert">
        <div className="page-container company-page__state">
          <span>Studio unavailable</span>
          <h1>This company could not be loaded</h1>
          <p>Check your connection and return to the previous page.</p>
          <button type="button" onClick={() => navigate(-1)}>
            Go back
          </button>
        </div>
      </main>
    );
  }

  if (!company?.id) {
    return (
      <main className="company-page company-page--state" role="status">
        <div className="page-container company-page__state">
          <span>Studio unavailable</span>
          <h1>Production company not found</h1>
          <p>The requested company does not exist or has been removed.</p>
          <button type="button" onClick={() => navigate(-1)}>
            Go back
          </button>
        </div>
      </main>
    );
  }

  const heroBackdrop = movies.find((movie) => movie.backdrop_path)?.backdrop_path;
  const heroStyle = heroBackdrop
    ? {
        backgroundImage: `linear-gradient(90deg, rgba(5, 12, 17, 0.98) 0%, rgba(5, 12, 17, 0.88) 52%, rgba(5, 12, 17, 0.5) 100%), url(${IMG_API}${heroBackdrop})`,
      }
    : undefined;

  return (
    <main className="company-page">
      <section
        className="company-page__hero"
        style={heroStyle}
        aria-labelledby="company-title"
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
                {company.logo_path ? (
                  <img
                    src={POSTER_API + company.logo_path}
                    alt={`${company.name} logo`}
                    decoding="async"
                  />
                ) : (
                  <span aria-hidden="true">{company.name.slice(0, 2)}</span>
                )}
              </div>

              <div className="company-page__hero-copy">
                <span className="company-page__eyebrow">Production company</span>
                <h1 id="company-title">{company.name}</h1>
                {company.description && <p>{company.description}</p>}
              </div>
            </div>

            <dl className="company-page__facts">
              <div>
                <dt>Titles found</dt>
                <dd>{totalResults.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Origin</dt>
                <dd>{company.origin_country || "Not listed"}</dd>
              </div>
              <div>
                <dt>Headquarters</dt>
                <dd>{company.headquarters || "Not listed"}</dd>
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
                href={`https://www.themoviedb.org/company/${company.id}`}
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

            {company.parent_company?.id && (
              <p className="company-page__parent">
                Part of
                <Link to={`/company/${company.parent_company.id}`}>
                  {company.parent_company.name}
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>

      <section
        ref={catalogRef}
        className="company-page__catalog"
        aria-labelledby="company-films-title"
      >
        <div className="page-container">
          <header className="company-page__catalog-header">
            <div>
              <span>Studio catalogue</span>
              <h2 id="company-films-title">Films by {company.name}</h2>
            </div>
            {!moviesLoading && !moviesError && (
              <p>
                <strong>{totalResults.toLocaleString()}</strong>
                {totalResults === 1 ? " title" : " titles"}
              </p>
            )}
          </header>

          {moviesLoading && (
            <div className="company-page__catalog-state">
              <Loading />
            </div>
          )}

          {!moviesLoading && moviesError && (
            <div className="company-page__catalog-state" role="alert">
              <i
                className="fa-solid fa-circle-exclamation"
                aria-hidden="true"
              ></i>
              <h3>Film catalogue could not be loaded</h3>
              <p>Check your connection and try this page again.</p>
            </div>
          )}

          {!moviesLoading && !moviesError && movies.length > 0 && (
            <div className="company-page__grid" aria-live="polite">
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  {...movie}
                  isFavorite={isInWatchlist(movie.id)}
                  isWatched={isWatched(movie.id)}
                  onToggleFavorite={toggleWatchlist}
                  onToggleWatched={toggleWatched}
                />
              ))}
            </div>
          )}

          {!moviesLoading && !moviesError && movies.length === 0 && (
            <div className="company-page__catalog-state" role="status">
              <i className="fa-solid fa-film" aria-hidden="true"></i>
              <h3>No films are listed</h3>
              <p>TMDB has not linked any films to this company.</p>
            </div>
          )}

          {!moviesLoading && !moviesError && totalPages > 1 && (
            <nav
              className="company-page__pagination"
              aria-label="Company films pagination"
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

export default Company;
