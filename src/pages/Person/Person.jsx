import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MovieCard from "../../components/MovieCard/MovieCard";
import Default from "../../images/Default.jpg";
import { API_KEY, BASE_URL, IMG_API } from "../../helpers/baseURL";
import "./Person.scss";

const Person = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [person, setPerson] = useState(null);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerson = async () => {
      try {
        setLoading(true);

        const [personResponse, creditsResponse] = await Promise.all([
          fetch(`${BASE_URL}/person/${id}?${API_KEY}&language=en-US`),
          fetch(`${BASE_URL}/person/${id}/movie_credits?${API_KEY}&language=en-US`),
        ]);

        const personData = await personResponse.json();
        const creditsData = await creditsResponse.json();

        setPerson(personData);
        setCredits(
          creditsData.cast
            ?.filter((movie) => movie.poster_path)
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, 8) || []
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPerson();
  }, [id]);

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

      <section className="person-known">
        <div className="container">
          <h2>Known For</h2>

          <div className="movie-container">
            {credits.map((movie) => (
              <MovieCard key={movie.id} {...movie} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Person;