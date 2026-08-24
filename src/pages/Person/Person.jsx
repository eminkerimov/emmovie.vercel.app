import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../../components/Loading/Loading";
import MovieCard from "../../components/MovieCard/MovieCard";
import useWatchlist from "../../hooks/useWatchlist";
import Default from "../../images/Default.jpg";
import {
  API_KEY,
  BASE_URL,
  POSTER_API,
} from "../../helpers/baseURL";
import "./Person.scss";

const INITIAL_CREDIT_COUNT = 12;
const CREDIT_BATCH_SIZE = 12;
const EMPTY_COLLECTION = [];

const createRequestState = (id) => ({
  id,
  status: "loading",
  error: false,
  person: null,
  castCredits: [],
  crewCredits: [],
  photos: [],
});

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const prepareCredits = (credits = [], roleField) => {
  const creditsByMovie = new Map();

  credits.forEach((credit) => {
    if (!credit?.id || !credit.poster_path) return;

    const role = (credit[roleField] || credit.department || "").trim();
    const existingCredit = creditsByMovie.get(credit.id);

    if (existingCredit) {
      if (role && !existingCredit.creditRoles.includes(role)) {
        existingCredit.creditRoles.push(role);
      }
      return;
    }

    creditsByMovie.set(credit.id, {
      ...credit,
      creditRoles: role ? [role] : [],
    });
  });

  return Array.from(creditsByMovie.values())
    .map(({ creditRoles, ...credit }) => ({
      ...credit,
      creditRole: creditRoles.join(" · "),
    }))
    .sort((a, b) => {
      const dateA = Date.parse(a.release_date) || 0;
      const dateB = Date.parse(b.release_date) || 0;
      return dateB - dateA;
    });
};

const preparePhotos = (profiles = [], heroPhotoPath) => {
  const seenPaths = new Set();

  return profiles.filter((photo) => {
    const path = photo?.file_path;

    if (!path || path === heroPhotoPath || seenPaths.has(path)) return false;

    seenPaths.add(path);
    return true;
  });
};

const getCareerRange = (credits) => {
  const years = credits
    .map((credit) => Number.parseInt(credit.release_date?.slice(0, 4), 10))
    .filter((year) => Number.isFinite(year));

  if (years.length === 0) return "Not available";

  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);

  return firstYear === lastYear ? `${firstYear}` : `${firstYear}–${lastYear}`;
};

const getSafeExternalUrl = (value) => {
  if (!value) return null;

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

const Person = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const galleryTrackRef = useRef(null);
  const thumbnailRefs = useRef([]);

  const [requestState, setRequestState] = useState(() =>
    createRequestState(id)
  );
  const [biographyExpanded, setBiographyExpanded] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [activeCreditType, setActiveCreditType] = useState("cast");
  const [visibleCreditCount, setVisibleCreditCount] = useState(
    INITIAL_CREDIT_COUNT
  );
  const { watchlist, toggleWatchlist } = useWatchlist();

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const requestJson = async (url) => {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`TMDB request failed with status ${response.status}`);
      }

      return response.json();
    };

    const fetchPerson = async () => {
      setRequestState(createRequestState(id));
      setBiographyExpanded(false);
      setActivePhotoIndex(0);
      setActiveCreditType("cast");
      setVisibleCreditCount(INITIAL_CREDIT_COUNT);
      thumbnailRefs.current = [];

      try {
        const [personResult, creditsResult, imagesResult] =
          await Promise.allSettled([
            requestJson(`${BASE_URL}/person/${id}?${API_KEY}&language=en-US`),
            requestJson(
              `${BASE_URL}/person/${id}/movie_credits?${API_KEY}&language=en-US`
            ),
            requestJson(`${BASE_URL}/person/${id}/images?${API_KEY}`),
          ]);

        if (personResult.status === "rejected") {
          throw personResult.reason;
        }

        if (!isActive || controller.signal.aborted) return;

        const personData = personResult.value;
        const creditsData =
          creditsResult.status === "fulfilled" ? creditsResult.value : {};
        const imagesData =
          imagesResult.status === "fulfilled" ? imagesResult.value : {};
        const castCredits = prepareCredits(creditsData.cast, "character");
        const crewCredits = prepareCredits(creditsData.crew, "job");

        setRequestState({
          id,
          status: "success",
          error: false,
          person: personData,
          castCredits,
          crewCredits,
          photos: preparePhotos(
            imagesData.profiles,
            personData.profile_path
          ),
        });
        setActiveCreditType(castCredits.length > 0 ? "cast" : "crew");
      } catch (error) {
        if (!isActive || error.name === "AbortError") return;

        controller.abort();
        setRequestState({
          ...createRequestState(id),
          status: "error",
          error,
        });
      }
    };

    fetchPerson();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [id]);

  const isCurrentRequest = requestState.id === id;
  const loading = !isCurrentRequest || requestState.status === "loading";
  const error = isCurrentRequest ? requestState.error : false;
  const person = isCurrentRequest ? requestState.person : null;
  const castCredits = isCurrentRequest
    ? requestState.castCredits
    : EMPTY_COLLECTION;
  const crewCredits = isCurrentRequest
    ? requestState.crewCredits
    : EMPTY_COLLECTION;
  const photos = isCurrentRequest ? requestState.photos : EMPTY_COLLECTION;

  useEffect(() => {
    document.title = person?.name
      ? `${person.name} | M-movie`
      : "Person Details | M-movie";
  }, [id, person]);

  useEffect(() => {
    if (typeof window.Image !== "function" || photos.length === 0) return;

    [activePhotoIndex - 1, activePhotoIndex, activePhotoIndex + 1]
      .filter((index) => index >= 0 && index < photos.length)
      .forEach((index) => {
        const preloadImage = new window.Image();
        preloadImage.src = POSTER_API + photos[index].file_path;
      });
  }, [activePhotoIndex, photos]);

  const allCredits = [...castCredits, ...crewCredits];
  const uniqueMovieCount = new Set(allCredits.map((credit) => credit.id)).size;
  const careerRange = getCareerRange(allCredits);
  const activeCredits =
    activeCreditType === "crew" ? crewCredits : castCredits;
  const visibleCredits = activeCredits.slice(0, visibleCreditCount);
  const activePhoto = photos[activePhotoIndex] || photos[0];
  const biography =
    person?.biography?.trim() || "No biography is available for this person.";
  const hasLongBiography = biography.length > 320;
  const aliases = person?.also_known_as?.filter(Boolean).slice(0, 2);
  const homepageUrl = getSafeExternalUrl(person?.homepage);
  const imdbUrl = person?.imdb_id
    ? `https://www.imdb.com/name/${encodeURIComponent(person.imdb_id)}/`
    : null;

  const selectPhoto = (index, moveFocus = false) => {
    if (photos.length === 0) return;

    const nextIndex = Math.min(Math.max(index, 0), photos.length - 1);
    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    setActivePhotoIndex(nextIndex);
    if (moveFocus) {
      thumbnailRefs.current[nextIndex]?.focus();
    }
    const galleryItem = thumbnailRefs.current[nextIndex]?.parentElement;
    const galleryTrack = galleryTrackRef.current;

    if (galleryItem && galleryTrack) {
      const centeredPosition =
        galleryItem.offsetLeft -
        (galleryTrack.clientWidth - galleryItem.offsetWidth) / 2;

      galleryTrack.scrollTo?.({
        left: Math.max(centeredPosition, 0),
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }
  };

  const handleGalleryKeyDown = (event) => {
    const keyTargets = {
      ArrowLeft: activePhotoIndex - 1,
      ArrowRight: activePhotoIndex + 1,
      Home: 0,
      End: photos.length - 1,
    };

    if (!(event.key in keyTargets)) return;

    event.preventDefault();
    selectPhoto(keyTargets[event.key], true);
  };

  const changeCreditType = (type) => {
    setActiveCreditType(type);
    setVisibleCreditCount(INITIAL_CREDIT_COUNT);
  };

  if (loading) {
    return (
      <main className="page-state">
        <Loading />
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-state" role="alert">
        <div className="page-container">
          <h1>Person could not be loaded</h1>
          <p>Check your connection and try again.</p>
        </div>
      </main>
    );
  }

  if (!person || Object.keys(person).length === 0) {
    return (
      <main className="page-state" role="status">
        <div className="page-container">
          <h1>Person not found</h1>
          <p>The requested person is unavailable.</p>
        </div>
      </main>
    );
  }

  const personFacts = [
    { label: "Born", value: formatDate(person.birthday) },
    person.deathday
      ? { label: "Died", value: formatDate(person.deathday) }
      : null,
    { label: "From", value: person.place_of_birth || "Not available" },
    { label: "Career", value: careerRange },
    {
      label: "Movie credits",
      value: uniqueMovieCount > 0 ? `${uniqueMovieCount}` : "Not available",
    },
  ].filter(Boolean);

  return (
    <main className="person">
      <section className="person-hero" aria-labelledby="person-name">
        <div className="page-container">
          <button
            className="person-hero__back"
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
            <span>Back</span>
          </button>

          <div className="person-hero__dossier">
            <div className="person-hero__portrait">
              <img
                src={
                  person.profile_path
                    ? POSTER_API + person.profile_path
                    : Default
                }
                alt={`${person.name} portrait`}
                decoding="async"
              />
            </div>

            <div className="person-hero__info">
              <span className="person-hero__label">
                {person.known_for_department || "Film professional"}
              </span>
              <h1 id="person-name">{person.name}</h1>

              {aliases?.length > 0 && (
                <p className="person-hero__aliases">
                  Also known as {aliases.join(" · ")}
                </p>
              )}

              <div className="person-hero__biography">
                <span>Biography</span>
                <p className={biographyExpanded ? "is-expanded" : ""}>
                  {biography}
                </p>

                {hasLongBiography && (
                  <button
                    type="button"
                    onClick={() => setBiographyExpanded((expanded) => !expanded)}
                    aria-expanded={biographyExpanded}
                  >
                    {biographyExpanded ? "Show less" : "Read full biography"}
                    <i
                      className={`fa-solid fa-chevron-${
                        biographyExpanded ? "up" : "down"
                      }`}
                      aria-hidden="true"
                    ></i>
                  </button>
                )}
              </div>

              {(imdbUrl || homepageUrl) && (
                <div className="person-hero__links" aria-label="External links">
                  {imdbUrl && (
                    <a
                      href={imdbUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      IMDb
                      <i
                        className="fa-solid fa-arrow-up-right-from-square"
                        aria-hidden="true"
                      ></i>
                    </a>
                  )}
                  {homepageUrl && (
                    <a
                      href={homepageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Official site
                      <i
                        className="fa-solid fa-arrow-up-right-from-square"
                        aria-hidden="true"
                      ></i>
                    </a>
                  )}
                </div>
              )}
            </div>

            <dl className="person-facts" aria-label="Person facts">
              {personFacts.map((fact) => (
                <div className="person-facts__item" key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {photos.length > 0 && activePhoto && (
        <section className="person-gallery" aria-labelledby="person-gallery-title">
          <div className="page-container">
            <div className="person-gallery__header">
              <div>
                <span>Portrait archive</span>
                <h2 id="person-gallery-title">Gallery</h2>
              </div>

              <div className="person-gallery__actions">
                <button
                  type="button"
                  aria-label="Previous portrait"
                  aria-controls="person-gallery-track"
                  onClick={() => selectPhoto(activePhotoIndex - 1)}
                  disabled={activePhotoIndex === 0}
                >
                  <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  aria-label="Next portrait"
                  aria-controls="person-gallery-track"
                  onClick={() => selectPhoto(activePhotoIndex + 1)}
                  disabled={activePhotoIndex === photos.length - 1}
                >
                  <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
                </button>
              </div>
            </div>

            <div className="person-gallery__frame">
              <ul
                className="person-gallery__track"
                id="person-gallery-track"
                ref={galleryTrackRef}
                tabIndex={0}
                onKeyDown={handleGalleryKeyDown}
                aria-label={`Portraits of ${person.name}`}
              >
                {photos.map((photo, index) => {
                  const isActivePhoto = index === activePhotoIndex;

                  return (
                    <li
                      className={`person-gallery__item ${
                        isActivePhoto ? "is-active" : ""
                      }`}
                      key={photo.file_path}
                    >
                      <button
                        ref={(element) => {
                          thumbnailRefs.current[index] = element;
                        }}
                        type="button"
                        onClick={() => selectPhoto(index)}
                        aria-label={`Show portrait ${index + 1}`}
                        aria-pressed={isActivePhoto}
                        tabIndex={isActivePhoto ? 0 : -1}
                      >
                        <img
                          className="person-gallery__image"
                          src={POSTER_API + photo.file_path}
                          alt={
                            isActivePhoto
                              ? `${person.name} gallery portrait`
                              : ""
                          }
                          loading={
                            Math.abs(index - activePhotoIndex) <= 1
                              ? "eager"
                              : "lazy"
                          }
                          decoding="async"
                        />

                        {isActivePhoto && (
                          <span className="person-gallery__caption">
                            {person.name}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <span className="sr-only" aria-live="polite">
                Portrait {activePhotoIndex + 1} of {photos.length}
              </span>

              <div className="person-gallery__progress" aria-hidden="true">
                <span
                  style={{
                    width: `${((activePhotoIndex + 1) / photos.length) * 100}%`,
                  }}
                ></span>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="person-known" aria-labelledby="person-work-title">
        <div className="page-container">
          <div className="person-known__topline">
            <div className="person-known__header">
              <span>On screen and behind the camera</span>
              <h2 id="person-work-title">Filmography</h2>
              <p>
                {careerRange === "Not available"
                  ? "Movie credits from TMDB"
                  : `Movie work · ${careerRange}`}
              </p>
            </div>

            {castCredits.length > 0 && crewCredits.length > 0 && (
              <div className="person-known__switch" role="group" aria-label="Filmography category">
                <button
                  type="button"
                  onClick={() => changeCreditType("cast")}
                  aria-pressed={activeCreditType === "cast"}
                >
                  Acting
                </button>
                <button
                  type="button"
                  onClick={() => changeCreditType("crew")}
                  aria-pressed={activeCreditType === "crew"}
                >
                  Crew
                </button>
              </div>
            )}
          </div>

          {activeCredits.length > 0 ? (
            <>
              <div className="person-known__grid">
                {visibleCredits.map((movie) => (
                  <div
                    className="person-known__credit"
                    key={`${activeCreditType}-${movie.id}`}
                  >
                    <MovieCard
                      {...movie}
                      isFavorite={watchlist.some(
                        (watchlistMovie) => watchlistMovie.id === movie.id
                      )}
                      onToggleFavorite={toggleWatchlist}
                    />
                    <p className="person-known__credit-role">
                      {movie.creditRole ||
                        (activeCreditType === "cast"
                          ? "Cast credit"
                          : "Crew credit")}
                    </p>
                  </div>
                ))}
              </div>

              {visibleCreditCount < activeCredits.length && (
                <div className="person-known__more">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCreditCount(
                        (currentCount) => currentCount + CREDIT_BATCH_SIZE
                      )
                    }
                  >
                    Show more work
                    <i className="fa-solid fa-plus" aria-hidden="true"></i>
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="person-known__empty">
              No movie credits are available for this person.
            </p>
          )}
        </div>
      </section>
    </main>
  );
};

export default Person;
