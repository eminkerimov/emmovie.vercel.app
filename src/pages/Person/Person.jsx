import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MovieCard from "../../components/MovieCard/MovieCard";
import Default from "../../images/Default.jpg";
import { API_KEY, BASE_URL, IMG_API } from "../../helpers/baseURL";
import "./Person.scss";

const WATCHLIST_KEY = "emmovie_watchlist";

const Person = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const galleryRef = useRef(null);

  const [person, setPerson] = useState(null);
  const [credits, setCredits] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState(() => {
    const savedWatchlist = localStorage.getItem(WATCHLIST_KEY);
    return savedWatchlist ? JSON.parse(savedWatchlist) : [];
  });

  useEffect(() => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    const fetchPerson = async () => {
      try {
        setLoading(true);

        const [personResponse, creditsResponse, imagesResponse] =
          await Promise.all([
            fetch(`${BASE_URL}/person/${id}?${API_KEY}&language=en-US`),
            fetch(`${BASE_URL}/person/${id}/movie_credits?${API_KEY}&language=en-US`),
            fetch(`${BASE_URL}/person/${id}/images?${API_KEY}`),
          ]);

        const personData = await personResponse.json();
        const creditsData = await creditsResponse.json();
        const imagesData = await imagesResponse.json();

        setPerson(personData);

        setCredits(
          creditsData.cast
            ?.filter((movie) => movie.poster_path)
            .sort((a, b) => {
              const dateA = a.release_date ? new Date(a.release_date) : 0;
              const dateB = b.release_date ? new Date(b.release_date) : 0;
              return dateB - dateA;
            }) || []
        );

        setPhotos((imagesData.profiles || []).slice(1));
      } finally {
        setLoading(false);
      }
    };

    fetchPerson();
  }, [id]);

  const scrollGallery = (direction) => {
    if (!galleryRef.current) return;

    galleryRef.current.scrollBy({
      left: direction === "next" ? 520 : -520,
      behavior: "smooth",
    });
  };

  const toggleWatchlist = (movie) => {
    setWatchlist((prev) => {
      const alreadySaved = prev.some((item) => item.id === movie.id);

      if (alreadySaved) {
        return prev.filter((item) => item.id !== movie.id);
      }

      return [movie, ...prev];
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

  if (loading) return <h1>LOADING...</h1>;
  if (!person) return null;

  return (
    <div className="person">
      <section className="person-hero">
        <div className="container">
          <button className="person-hero__back" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left"></i>
            <span>Back</span>
          </button>

          <div className="person-hero__content">
            <img
              className="person-hero__photo"
              src={person.profile_path ? IMG_API + person.profile_path : Default}
              alt={person.name}
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
              <button type="button" onClick={() => scrollGallery("prev")}>
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <button type="button" onClick={() => scrollGallery("next")}>
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>

          <div className="person-photos__track" ref={galleryRef}>
            {photos.map((photo) => (
              <div className="person-photos__item" key={photo.file_path}>
                <img src={IMG_API + photo.file_path} alt={person.name} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="person-known">
        <div className="container">
          <div className="person-known__header">
            <span>Filmography</span>
            <h2>All Movies</h2>
            <p>{credits.length} movies found</p>
          </div>

          <div className="movie-container">{credits.map(renderMovieCard)}</div>
        </div>
      </section>
    </div>
  );
};

export default Person;