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
  PROFILE_API,
} from "../../helpers/baseURL";
import "./Person.scss";

const createRequestState = (id) => ({
  id,
  status: "loading",
  error: false,
  person: null,
  credits: [],
  photos: [],
});

const Person = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const galleryRef = useRef(null);

  const [requestState, setRequestState] = useState(() =>
    createRequestState(id)
  );
  const { watchlist, toggleWatchlist } = useWatchlist();

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const fetchPerson = async () => {
      setRequestState(createRequestState(id));

      try {
        const [personResponse, creditsResponse, imagesResponse] =
          await Promise.all([
            fetch(`${BASE_URL}/person/${id}?${API_KEY}&language=en-US`, {
              signal: controller.signal,
            }),
            fetch(
              `${BASE_URL}/person/${id}/movie_credits?${API_KEY}&language=en-US`,
              { signal: controller.signal }
            ),
            fetch(`${BASE_URL}/person/${id}/images?${API_KEY}`, {
              signal: controller.signal,
            }),
          ]);

        const failedResponse = [
          personResponse,
          creditsResponse,
          imagesResponse,
        ].find((response) => !response.ok);

        if (failedResponse) {
          throw new Error(
            `TMDB request failed with status ${failedResponse.status}`
          );
        }

        const [personData, creditsData, imagesData] = await Promise.all([
          personResponse.json(),
          creditsResponse.json(),
          imagesResponse.json(),
        ]);

        if (!isActive || controller.signal.aborted) return;

        const sortedCredits =
          creditsData.cast
            ?.filter((movie) => movie.poster_path)
            .sort((a, b) => {
              const dateA = a.release_date ? new Date(a.release_date) : 0;
              const dateB = b.release_date ? new Date(b.release_date) : 0;
              return dateB - dateA;
            }) || [];

        setRequestState({
          id,
          status: "success",
          error: false,
          person: personData,
          credits: sortedCredits,
          photos: (imagesData.profiles || []).slice(1),
        });
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
  const credits = isCurrentRequest ? requestState.credits : [];
  const photos = isCurrentRequest ? requestState.photos : [];

  useEffect(() => {
    if (person?.name) {
      document.title = `${person.name} | M-movie`;
    }
  }, [person]);

  const scrollGallery = (direction) => {
    if (!galleryRef.current) return;

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    galleryRef.current.scrollBy({
      left: direction === "next" ? 520 : -520,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  const isInWatchlist = (movieId) => {
    return watchlist.some((movie) => movie.id === movieId);
  };

  const renderMovieCard = (movie) => (
    <MovieCard
      key={`${movie.id}-${movie.credit_id}`}
      {...movie}
      isFavorite={isInWatchlist(movie.id)}
      onToggleFavorite={toggleWatchlist}
    />
  );

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

  return (
    <main className="person">
      <section className="person-hero">
        <div className="page-container">
          <button
            className="person-hero__back"
            type="button"
            onClick={() => navigate(-1)}
          >
            <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
            <span>Back</span>
          </button>

          <div className="person-hero__content">
            <img
              className="person-hero__photo"
              src={
                person.profile_path ? POSTER_API + person.profile_path : Default
              }
              alt={`${person.name} portrait`}
              decoding="async"
            />

            <div className="person-hero__info">
              <span className="person-hero__label">Person Details</span>
              <h1>{person.name}</h1>

              <div className="person-hero__meta">
                <span>{person.known_for_department || "—"}</span>
                <span>Popularity {person.popularity?.toFixed(0) || "—"}</span>
                <span>{person.birthday || "—"}</span>
              </div>

              <p>{person.biography || "No biography available."}</p>
            </div>
          </div>
        </div>
      </section>

      {photos.length > 0 && (
        <section className="person-photos">
          <div className="person-photos__header">
            <div>
              <span>Gallery</span>
              <h2>Photos</h2>
            </div>

            <div className="person-photos__actions">
              <button
                type="button"
                aria-label="Previous photos"
                onClick={() => scrollGallery("prev")}
              >
                <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
              </button>
              <button
                type="button"
                aria-label="Next photos"
                onClick={() => scrollGallery("next")}
              >
                <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          <div className="person-photos__track" ref={galleryRef}>
            {photos.map((photo) => (
              <div className="person-photos__item" key={photo.file_path}>
                <img
                  src={PROFILE_API + photo.file_path}
                  alt={`${person.name}, gallery view`}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="person-known">
        <div className="page-container">
          <div className="person-known__header">
            <span>Filmography</span>
            <h2>All Movies</h2>
            <p>{credits.length} movies found</p>
          </div>

          <div className="person-known__grid">
            {credits.map(renderMovieCard)}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Person;
