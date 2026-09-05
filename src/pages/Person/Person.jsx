import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import Loading from "../../components/Loading/Loading";
import MovieCard from "../../components/MovieCard/MovieCard";
import useWatchlist from "../../hooks/useWatchlist";
import Default from "../../images/Default.jpg";
import {
  API_KEY,
  BASE_URL,
  IMG_API,
  POSTER_API,
} from "../../helpers/baseURL";
import "./Person.scss";

const INITIAL_CREDIT_COUNT = 12;
const CREDIT_BATCH_SIZE = 12;
const FEATURED_CREDIT_COUNT = 6;
const UPCOMING_CREDIT_COUNT = 4;
const EMPTY_COLLECTION = [];

const createRequestState = (id) => ({
  id,
  status: "loading",
  error: false,
  person: null,
  castCredits: [],
  crewCredits: [],
  photos: [],
  externalIds: {},
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
  const creditsByTitle = new Map();

  credits.forEach((credit) => {
    if (!credit?.id) return;

    const mediaType = credit.media_type === "tv" ? "tv" : "movie";
    const title =
      credit.title ||
      credit.name ||
      credit.original_title ||
      credit.original_name;
    const releaseDate = credit.release_date || credit.first_air_date || "";
    const creditKey = `${mediaType}-${credit.id}`;
    const role = (credit[roleField] || credit.department || "").trim();
    const existingCredit = creditsByTitle.get(creditKey);

    if (existingCredit) {
      if (role && !existingCredit.creditRoles.includes(role)) {
        existingCredit.creditRoles.push(role);
      }
      return;
    }

    creditsByTitle.set(creditKey, {
      ...credit,
      title,
      release_date: releaseDate,
      media_type: mediaType,
      creditRoles: role ? [role] : [],
    });
  });

  return Array.from(creditsByTitle.values())
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

const getReleaseTime = (credit) => {
  if (!credit?.release_date) return 0;

  return Date.parse(`${credit.release_date}T00:00:00`) || 0;
};

const isUpcomingCredit = (credit) => {
  const releaseTime = getReleaseTime(credit);

  if (!releaseTime) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return releaseTime > today.getTime();
};

const getCreditSignificance = (credit) => {
  const popularity = Number(credit?.popularity) || 0;
  const voteAverage = Number(credit?.vote_average) || 0;
  const voteCount = Number(credit?.vote_count) || 0;

  return popularity + voteAverage * 2 + Math.log10(voteCount + 1) * 20;
};

const getUniqueCredits = (credits) => {
  const creditsByTitle = new Map();

  credits.forEach((credit) => {
    const creditKey = `${credit.media_type || "movie"}-${credit.id}`;
    const existingCredit = creditsByTitle.get(creditKey);

    if (
      !existingCredit ||
      getCreditSignificance(credit) > getCreditSignificance(existingCredit)
    ) {
      creditsByTitle.set(creditKey, credit);
    }
  });

  return Array.from(creditsByTitle.values());
};

const sortCredits = (credits, sortBy) => {
  const sortedCredits = [...credits];

  sortedCredits.sort((a, b) => {
    if (sortBy === "popular") {
      return (
        (Number(b.popularity) || 0) - (Number(a.popularity) || 0) ||
        (Number(b.vote_count) || 0) - (Number(a.vote_count) || 0)
      );
    }

    if (sortBy === "rating") {
      return (
        (Number(b.vote_average) || 0) - (Number(a.vote_average) || 0) ||
        (Number(b.vote_count) || 0) - (Number(a.vote_count) || 0)
      );
    }

    return (
      getReleaseTime(b) - getReleaseTime(a) ||
      (Number(b.popularity) || 0) - (Number(a.popularity) || 0)
    );
  });

  return sortedCredits;
};

const SOCIAL_PROFILES = [
  {
    key: "instagram_id",
    label: "Instagram",
    brand: "instagram",
    icon: "fa-brands fa-instagram",
    getUrl: (value) => `https://www.instagram.com/${encodeURIComponent(value)}/`,
  },
  {
    key: "twitter_id",
    label: "X",
    brand: "x",
    icon: "fa-brands fa-x-twitter",
    getUrl: (value) => `https://x.com/${encodeURIComponent(value)}`,
  },
  {
    key: "facebook_id",
    label: "Facebook",
    brand: "facebook",
    icon: "fa-brands fa-facebook-f",
    getUrl: (value) => `https://www.facebook.com/${encodeURIComponent(value)}`,
  },
];

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
  const lightboxRef = useRef(null);
  const lightboxCloseRef = useRef(null);
  const lightboxTriggerRef = useRef(null);
  const lightboxTouchStartRef = useRef(null);

  const [requestState, setRequestState] = useState(() =>
    createRequestState(id)
  );
  const [biographyExpanded, setBiographyExpanded] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [activeCreditType, setActiveCreditType] = useState("cast");
  const [creditMediaType, setCreditMediaType] = useState("all");
  const [creditSort, setCreditSort] = useState("latest");
  const [creditDecade, setCreditDecade] = useState("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [visibleCreditCount, setVisibleCreditCount] = useState(
    INITIAL_CREDIT_COUNT
  );
  const {
    watchlist,
    toggleWatchlist,
    toggleWatched,
    isWatched,
  } = useWatchlist();

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
      setCreditMediaType("all");
      setCreditSort("latest");
      setCreditDecade("all");
      setLightboxOpen(false);
      setVisibleCreditCount(INITIAL_CREDIT_COUNT);
      thumbnailRefs.current = [];

      try {
        const [personResult, creditsResult, imagesResult, externalIdsResult] =
          await Promise.allSettled([
            requestJson(`${BASE_URL}/person/${id}?${API_KEY}&language=en-US`),
            requestJson(
              `${BASE_URL}/person/${id}/combined_credits?${API_KEY}&language=en-US`
            ),
            requestJson(`${BASE_URL}/person/${id}/images?${API_KEY}`),
            requestJson(`${BASE_URL}/person/${id}/external_ids?${API_KEY}`),
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
        const externalIds =
          externalIdsResult.status === "fulfilled"
            ? externalIdsResult.value
            : {};
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
          externalIds,
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
  const externalIds = isCurrentRequest ? requestState.externalIds : {};

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

  useEffect(() => {
    if (!lightboxOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const lightboxTrigger = lightboxTriggerRef.current;
    document.body.style.overflow = "hidden";
    lightboxCloseRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      lightboxTrigger?.focus();
    };
  }, [lightboxOpen]);

  useEffect(() => {
    if (
      !lightboxOpen ||
      typeof window.Image !== "function" ||
      photos.length === 0
    ) {
      return;
    }

    [activePhotoIndex - 1, activePhotoIndex, activePhotoIndex + 1]
      .filter((index) => index >= 0 && index < photos.length)
      .forEach((index) => {
        const preloadImage = new window.Image();
        preloadImage.src = IMG_API + photos[index].file_path;
      });
  }, [activePhotoIndex, lightboxOpen, photos]);

  const allCredits = getUniqueCredits([...castCredits, ...crewCredits]);
  const uniqueCreditCount = new Set(
    allCredits.map(
      (credit) => `${credit.media_type || "movie"}-${credit.id}`
    )
  ).size;
  const careerRange = getCareerRange(allCredits);
  const activeCredits =
    activeCreditType === "crew" ? crewCredits : castCredits;
  const hasMovieCredits = activeCredits.some(
    (credit) => credit.media_type === "movie"
  );
  const hasTvCredits = activeCredits.some(
    (credit) => credit.media_type === "tv"
  );
  const mediaCredits = activeCredits.filter(
    (credit) =>
      creditMediaType === "all" || credit.media_type === creditMediaType
  );
  const availableDecades = Array.from(
    new Set(
      mediaCredits
        .map((credit) =>
          Number.parseInt(credit.release_date?.slice(0, 4), 10)
        )
        .filter((year) => Number.isFinite(year))
        .map((year) => Math.floor(year / 10) * 10)
    )
  ).sort((a, b) => b - a);
  const filteredCredits = mediaCredits.filter((credit) => {
    if (creditDecade === "all") return true;

    const releaseYear = Number.parseInt(credit.release_date?.slice(0, 4), 10);
    return Math.floor(releaseYear / 10) * 10 === Number(creditDecade);
  });
  const sortedCredits = sortCredits(filteredCredits, creditSort);
  const visibleCredits = sortedCredits.slice(0, visibleCreditCount);
  const primaryCredits =
    person?.known_for_department === "Acting" && castCredits.length > 0
      ? castCredits
      : crewCredits.length > 0
      ? crewCredits
      : castCredits;
  const knownForCredits = getUniqueCredits([...primaryCredits, ...allCredits])
    .filter((credit) => !isUpcomingCredit(credit))
    .sort(
      (a, b) => getCreditSignificance(b) - getCreditSignificance(a)
    )
    .slice(0, FEATURED_CREDIT_COUNT);
  const upcomingCredits = allCredits
    .filter(isUpcomingCredit)
    .sort((a, b) => getReleaseTime(a) - getReleaseTime(b))
    .slice(0, UPCOMING_CREDIT_COUNT);
  const activePhoto = photos[activePhotoIndex] || photos[0];
  const biography =
    person?.biography?.trim() || "No biography is available for this person.";
  const hasLongBiography = biography.length > 320;
  const aliases = person?.also_known_as?.filter(Boolean).slice(0, 2);
  const homepageUrl = getSafeExternalUrl(person?.homepage);
  const imdbId = externalIds?.imdb_id || person?.imdb_id;
  const imdbUrl = imdbId
    ? `https://www.imdb.com/name/${encodeURIComponent(imdbId)}/`
    : null;
  const socialProfiles = SOCIAL_PROFILES.map((profile) => {
    const value = externalIds?.[profile.key];

    if (typeof value !== "string" || !value.trim()) return null;

    return {
      ...profile,
      url: profile.getUrl(value.trim().replace(/^@/, "")),
    };
  }).filter(Boolean);

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
    setCreditMediaType("all");
    setCreditDecade("all");
    setVisibleCreditCount(INITIAL_CREDIT_COUNT);
  };

  const changeCreditMediaType = (event) => {
    setCreditMediaType(event.target.value);
    setCreditDecade("all");
    setVisibleCreditCount(INITIAL_CREDIT_COUNT);
  };

  const changeCreditSort = (event) => {
    setCreditSort(event.target.value);
    setVisibleCreditCount(INITIAL_CREDIT_COUNT);
  };

  const changeCreditDecade = (event) => {
    setCreditDecade(event.target.value);
    setVisibleCreditCount(INITIAL_CREDIT_COUNT);
  };

  const changeLightboxPhoto = (direction) => {
    if (photos.length < 2) return;

    setActivePhotoIndex(
      (currentIndex) =>
        (currentIndex + direction + photos.length) % photos.length
    );
  };

  const openLightbox = (index, trigger) => {
    selectPhoto(index);
    lightboxTriggerRef.current = trigger;
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const handleLightboxKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      changeLightboxPhoto(event.key === "ArrowLeft" ? -1 : 1);
      return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = Array.from(
      lightboxRef.current?.querySelectorAll("button:not([disabled])") || []
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const handleLightboxTouchStart = (event) => {
    lightboxTouchStartRef.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleLightboxTouchEnd = (event) => {
    const touchStart = lightboxTouchStartRef.current;
    const touchEnd = event.changedTouches[0]?.clientX;
    lightboxTouchStartRef.current = null;

    if (touchStart === null || typeof touchEnd !== "number") return;

    const distance = touchEnd - touchStart;
    if (Math.abs(distance) >= 48) {
      changeLightboxPhoto(distance > 0 ? -1 : 1);
    }
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
      label: "Credits",
      value: uniqueCreditCount > 0 ? `${uniqueCreditCount}` : "Not available",
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

              {(imdbUrl || homepageUrl || socialProfiles.length > 0) && (
                <div className="person-hero__links" aria-label="External links">
                  {imdbUrl && (
                    <a
                      className="person-hero__external-link person-hero__external-link--imdb"
                      href={imdbUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open IMDb profile"
                    >
                      <i className="fa-brands fa-imdb" aria-hidden="true"></i>
                      <span>IMDb</span>
                    </a>
                  )}
                  {homepageUrl && (
                    <a
                      className="person-hero__external-link person-hero__external-link--website"
                      href={homepageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open official website"
                    >
                      <i className="fa-solid fa-globe" aria-hidden="true"></i>
                      <span>Official site</span>
                    </a>
                  )}
                  {socialProfiles.map((profile) => (
                    <a
                      className={`person-hero__external-link person-hero__external-link--${profile.brand}${
                        profile.brand === "x"
                          ? " person-hero__external-link--icon-only"
                          : ""
                      }`}
                      href={profile.url}
                      key={profile.key}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${profile.label} profile`}
                      title={profile.brand === "x" ? "X" : undefined}
                    >
                      <i className={profile.icon} aria-hidden="true"></i>
                      {profile.brand !== "x" && <span>{profile.label}</span>}
                    </a>
                  ))}
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

      {knownForCredits.length > 0 && (
        <section className="person-featured" aria-labelledby="person-known-for-title">
          <div className="page-container">
            <div className="person-section-heading">
              <span>Career highlights</span>
              <h2 id="person-known-for-title">Known for</h2>
              <p>The most recognised work across film and television.</p>
            </div>

            <div className="person-featured__grid">
              {knownForCredits.map((movie) => {
                const isMovie = movie.media_type !== "tv";

                return (
                  <div
                    className="person-featured__credit"
                    key={`${movie.media_type}-${movie.id}`}
                  >
                    <MovieCard
                      {...movie}
                      detailsPath={
                        isMovie
                          ? undefined
                          : `/movie/${movie.id}?media=tv`
                      }
                      isFavorite={
                        isMovie &&
                        watchlist.some(
                          (watchlistMovie) => watchlistMovie.id === movie.id
                        )
                      }
                      isWatched={
                        isMovie && (isWatched?.(movie.id) || false)
                      }
                      onToggleFavorite={isMovie ? toggleWatchlist : undefined}
                      onToggleWatched={isMovie ? toggleWatched : undefined}
                    />
                    {movie.creditRole && (
                      <p className="person-featured__role">
                        {movie.creditRole}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {upcomingCredits.length > 0 && (
        <section className="person-upcoming" aria-labelledby="person-upcoming-title">
          <div className="page-container person-upcoming__layout">
            <div className="person-section-heading person-upcoming__heading">
              <span>Next on screen</span>
              <h2 id="person-upcoming-title">Upcoming projects</h2>
              <p>Announced film and television work with a future release date.</p>
            </div>

            <div className="person-upcoming__list">
              {upcomingCredits.map((movie) => {
                const detailsPath =
                  movie.media_type === "tv"
                    ? `/movie/${movie.id}?media=tv`
                    : `/movie/${movie.id}`;

                return (
                  <Link
                    className="person-upcoming__item"
                    key={`${movie.media_type}-${movie.id}`}
                    to={detailsPath}
                  >
                    <img
                      src={
                        movie.poster_path
                          ? POSTER_API + movie.poster_path
                          : Default
                      }
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                    <div>
                      <time dateTime={movie.release_date}>
                        {formatDate(movie.release_date)}
                      </time>
                      <h3>{movie.title || movie.original_title}</h3>
                      {movie.creditRole && <p>{movie.creditRole}</p>}
                    </div>
                    <i
                      className="fa-solid fa-arrow-right"
                      aria-hidden="true"
                    ></i>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

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
                <button
                  type="button"
                  aria-label="Open portrait fullscreen"
                  onClick={(event) =>
                    openLightbox(activePhotoIndex, event.currentTarget)
                  }
                >
                  <i className="fa-solid fa-expand" aria-hidden="true"></i>
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
                        onClick={(event) =>
                          openLightbox(index, event.currentTarget)
                        }
                        aria-label={`Open portrait ${index + 1} fullscreen`}
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

      {lightboxOpen && activePhoto &&
        createPortal(
          <div className="person-lightbox">
            <div
              className="person-lightbox__dialog"
              ref={lightboxRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="person-lightbox-title"
              aria-describedby="person-lightbox-status"
              onKeyDown={handleLightboxKeyDown}
            >
              <h2 className="sr-only" id="person-lightbox-title">
                Fullscreen portrait gallery
              </h2>

              <button
                className="person-lightbox__close"
                ref={lightboxCloseRef}
                type="button"
                aria-label="Close fullscreen gallery"
                onClick={closeLightbox}
              >
                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>

              <button
                className="person-lightbox__arrow person-lightbox__arrow--previous"
                type="button"
                aria-label="Previous fullscreen portrait"
                onClick={() => changeLightboxPhoto(-1)}
                disabled={photos.length < 2}
              >
                <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
              </button>

              <div
                className="person-lightbox__stage"
                onTouchStart={handleLightboxTouchStart}
                onTouchEnd={handleLightboxTouchEnd}
              >
                <img
                  src={IMG_API + activePhoto.file_path}
                  alt={`${person.name} fullscreen portrait`}
                  decoding="async"
                />
              </div>

              <button
                className="person-lightbox__arrow person-lightbox__arrow--next"
                type="button"
                aria-label="Next fullscreen portrait"
                onClick={() => changeLightboxPhoto(1)}
                disabled={photos.length < 2}
              >
                <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
              </button>

              <span className="sr-only" id="person-lightbox-status" aria-live="polite">
                Portrait {activePhotoIndex + 1} of {photos.length}
              </span>
            </div>
          </div>,
          document.body
        )}

      <section className="person-known" aria-labelledby="person-work-title">
        <div className="page-container">
          <div className="person-known__topline">
            <div className="person-known__header">
              <span>On screen and behind the camera</span>
              <h2 id="person-work-title">Filmography</h2>
              <p>
                {careerRange === "Not available"
                  ? "Film and television credits from TMDB"
                  : `Screen work · ${careerRange}`}
              </p>
            </div>

            {activeCredits.length > 0 && (
              <div className="person-known__controls">
                {castCredits.length > 0 && crewCredits.length > 0 && (
                  <div
                    className="person-known__switch"
                    role="group"
                    aria-label="Filmography category"
                  >
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

                <div className="person-known__filters">
                  <label className="person-known__filter--media">
                    <span>Media</span>
                    <select
                      aria-label="Media"
                      value={creditMediaType}
                      onChange={changeCreditMediaType}
                    >
                      <option value="all">All types</option>
                      <option value="movie" disabled={!hasMovieCredits}>
                        Movies
                      </option>
                      <option value="tv" disabled={!hasTvCredits}>
                        TV
                      </option>
                    </select>
                  </label>

                  <label>
                    <span>Sort</span>
                    <select
                      aria-label="Sort"
                      value={creditSort}
                      onChange={changeCreditSort}
                    >
                      <option value="latest">Latest</option>
                      <option value="popular">Popular</option>
                      <option value="rating">Rating</option>
                    </select>
                  </label>

                  <label>
                    <span>Decade</span>
                    <select
                      aria-label="Decade"
                      value={creditDecade}
                      onChange={changeCreditDecade}
                    >
                      <option value="all">All decades</option>
                      {availableDecades.map((decade) => (
                        <option value={decade} key={decade}>
                          {decade}s
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            )}
          </div>

          {sortedCredits.length > 0 ? (
            <>
              <div className="person-known__grid">
                {visibleCredits.map((movie) => {
                  const isMovie = movie.media_type !== "tv";

                  return (
                    <div
                      className="person-known__credit"
                      key={`${activeCreditType}-${movie.media_type}-${movie.id}`}
                    >
                      <MovieCard
                        {...movie}
                        detailsPath={
                          isMovie
                            ? undefined
                            : `/movie/${movie.id}?media=tv`
                        }
                        isFavorite={
                          isMovie &&
                          watchlist.some(
                            (watchlistMovie) => watchlistMovie.id === movie.id
                          )
                        }
                        isWatched={
                          isMovie && (isWatched?.(movie.id) || false)
                        }
                        onToggleFavorite={
                          isMovie ? toggleWatchlist : undefined
                        }
                        onToggleWatched={
                          isMovie ? toggleWatched : undefined
                        }
                      />
                      <p className="person-known__credit-role">
                        {movie.creditRole ||
                          (activeCreditType === "cast"
                            ? "Cast credit"
                            : "Crew credit")}
                      </p>
                    </div>
                  );
                })}
              </div>

              {visibleCreditCount < sortedCredits.length && (
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
          ) : mediaCredits.length > 0 ? (
            <p className="person-known__empty">
              No credits match this decade.
            </p>
          ) : (
            <p className="person-known__empty">
              No credits are available for this person.
            </p>
          )}
        </div>
      </section>
    </main>
  );
};

export default Person;
