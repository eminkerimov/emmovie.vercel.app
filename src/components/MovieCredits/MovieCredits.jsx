import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PROFILE_API } from "../../helpers/baseURL";
import "./MovieCredits.scss";

const INITIAL_CAST_COUNT = 12;
const CREATIVE_ROLES = [
  {
    label: "Director",
    matches: (credit) => credit.job === "Director",
  },
  {
    label: "Writing",
    matches: (credit) =>
      ["Screenplay", "Writer", "Story", "Teleplay"].includes(credit.job),
  },
  {
    label: "Producers",
    matches: (credit) =>
      ["Producer", "Executive Producer"].includes(credit.job),
  },
];

const VISIBLE_DEPARTMENTS = ["Directing", "Writing", "Production"];

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

const uniquePeople = (credits) => {
  const people = new Map();

  credits.forEach((credit) => {
    if (credit?.id && credit?.name && !people.has(credit.id)) {
      people.set(credit.id, credit);
    }
  });

  return [...people.values()];
};

const groupCrew = (crew) => {
  const departments = new Map();

  crew.forEach((credit) => {
    if (!credit?.id || !credit?.name) return;

    const department = credit.department || "Crew";
    const departmentPeople = departments.get(department) || new Map();
    const person = departmentPeople.get(credit.id) || {
      ...credit,
      jobs: [],
    };

    if (credit.job && !person.jobs.includes(credit.job)) {
      person.jobs.push(credit.job);
    }

    departmentPeople.set(credit.id, person);
    departments.set(department, departmentPeople);
  });

  return [...departments.entries()]
    .map(([department, people]) => ({
      department,
      people: [...people.values()],
    }))
    .sort((first, second) => {
      const firstIndex = VISIBLE_DEPARTMENTS.indexOf(first.department);
      const secondIndex = VISIBLE_DEPARTMENTS.indexOf(second.department);
      const safeFirstIndex = firstIndex === -1 ? VISIBLE_DEPARTMENTS.length : firstIndex;
      const safeSecondIndex = secondIndex === -1 ? VISIBLE_DEPARTMENTS.length : secondIndex;

      return safeFirstIndex - safeSecondIndex ||
        first.department.localeCompare(second.department);
    });
};

const PersonImage = ({ person }) =>
  person.profile_path ? (
    <img
      src={PROFILE_API + person.profile_path}
      alt=""
      loading="lazy"
      decoding="async"
    />
  ) : (
    <span className="movie-credits__placeholder" aria-hidden="true">
      {getInitials(person.name)}
    </span>
  );

const MovieCredits = ({ request }) => {
  const [activeTab, setActiveTab] = useState("cast");
  const [showAllCast, setShowAllCast] = useState(false);
  const tabRefs = useRef({});
  const data = request?.data;
  const cast = useMemo(
    () => (Array.isArray(data?.cast) ? data.cast.filter((person) => person?.id) : []),
    [data]
  );
  const crew = useMemo(
    () =>
      (Array.isArray(data?.crew) ? data.crew : []).filter(
        (person) =>
          person?.id && VISIBLE_DEPARTMENTS.includes(person.department)
      ),
    [data]
  );
  const crewGroups = useMemo(() => groupCrew(crew), [crew]);
  const crewCount = useMemo(
    () => crewGroups.reduce((total, group) => total + group.people.length, 0),
    [crewGroups]
  );
  const keyCreatives = useMemo(
    () =>
      CREATIVE_ROLES.map((role) => ({
        ...role,
        people: uniquePeople(crew.filter(role.matches)),
      })).filter((role) => role.people.length),
    [crew]
  );
  const tabs = useMemo(
    () =>
      [
        { id: "cast", label: "Cast", count: cast.length },
        { id: "crew", label: "Crew", count: crewCount },
      ].filter((tab) => tab.count > 0),
    [cast.length, crewCount]
  );

  useEffect(() => {
    if (tabs.length && !tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [activeTab, tabs]);

  useEffect(() => {
    setShowAllCast(false);
  }, [data]);

  const selectTab = (tabId) => {
    setActiveTab(tabId);
    tabRefs.current[tabId]?.focus();
  };

  const handleTabKeyDown = (event, tabId) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === tabId);
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === currentIndex) return;

    event.preventDefault();
    selectTab(tabs[nextIndex].id);
  };

  if (!request?.loading && (request?.error || !tabs.length)) return null;

  const visibleCast = showAllCast ? cast : cast.slice(0, INITIAL_CAST_COUNT);

  return (
    <section className="movie-credits" aria-labelledby="movie-credits-title">
      <div className="page-container">
        <header className="movie-credits__heading">
          <div>
            <span>Behind the picture</span>
            <h2 id="movie-credits-title">Cast &amp; crew</h2>
          </div>
          {!request?.loading && (
            <p>{cast.length} performers · {crewCount} selected crew members</p>
          )}
        </header>

        {request?.loading ? (
          <p className="movie-credits__status" role="status">
            Loading full credits…
          </p>
        ) : (
          <>
            {keyCreatives.length > 0 && (
              <div className="movie-credits__creatives" aria-label="Key creatives">
                {keyCreatives.map((role) => (
                  <div className="movie-credits__creative" key={role.label}>
                    <span>{role.label}</span>
                    <div>
                      {role.people.slice(0, 4).map((person) => (
                        <Link key={person.id} to={`/person/${person.id}`}>
                          {person.name}
                        </Link>
                      ))}
                      {role.people.length > 4 && (
                        <span>+{role.people.length - 4} more</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="movie-credits__tabs" role="tablist" aria-label="Movie credits">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  ref={(node) => {
                    tabRefs.current[tab.id] = node;
                  }}
                  id={`movie-credits-${tab.id}-tab`}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`movie-credits-${tab.id}-panel`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
                >
                  {tab.label}
                  <span>{tab.count}</span>
                </button>
              ))}
            </div>

            {activeTab === "cast" && (
              <div
                id="movie-credits-cast-panel"
                className="movie-credits__panel"
                role="tabpanel"
                aria-labelledby="movie-credits-cast-tab"
              >
                <div className="movie-credits__cast-grid">
                  {visibleCast.map((person) => (
                    <Link
                      className="movie-credits__cast-card"
                      key={`${person.credit_id || person.id}-${person.order}`}
                      to={`/person/${person.id}`}
                    >
                      <PersonImage person={person} />
                      <span className="movie-credits__cast-copy">
                        <strong>{person.name}</strong>
                        <span>{person.character || "Cast"}</span>
                      </span>
                    </Link>
                  ))}
                </div>

                {cast.length > INITIAL_CAST_COUNT && (
                  <button
                    className="movie-credits__expand"
                    type="button"
                    aria-expanded={showAllCast}
                    onClick={() => setShowAllCast((current) => !current)}
                  >
                    {showAllCast ? "Show fewer cast members" : `Show all ${cast.length} cast members`}
                    <i
                      className={`fa-solid fa-chevron-${showAllCast ? "up" : "down"}`}
                      aria-hidden="true"
                    ></i>
                  </button>
                )}
              </div>
            )}

            {activeTab === "crew" && (
              <div
                id="movie-credits-crew-panel"
                className="movie-credits__panel movie-credits__crew"
                role="tabpanel"
                aria-labelledby="movie-credits-crew-tab"
              >
                {crewGroups.map((group) => (
                  <section className="movie-credits__department" key={group.department}>
                    <header>
                      <h3>{group.department}</h3>
                      <span>
                        {group.people.length} {group.people.length === 1 ? "person" : "people"}
                      </span>
                    </header>
                    <ul>
                      {group.people.map((person) => (
                        <li key={`${group.department}-${person.id}`}>
                          <Link to={`/person/${person.id}`}>{person.name}</Link>
                          <span>{person.jobs.join(" · ")}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default MovieCredits;
