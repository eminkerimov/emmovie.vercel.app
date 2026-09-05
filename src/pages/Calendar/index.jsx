import React, { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Loading from "../../components/Loading/Loading";
import MovieCard from "../../components/MovieCard/MovieCard";
import useFetchMovies from "../../hooks/useFetchMovies";
import useWatchlist from "../../hooks/useWatchlist";
import "./index.scss";

const MOVIE_REGION_STORAGE_KEY = "emmovie_movie_region";

const FALLBACK_REGION_OPTIONS = [
  { id: "AE", name: "United Arab Emirates" },
  { id: "AR", name: "Argentina" },
  { id: "AT", name: "Austria" },
  { id: "AU", name: "Australia" },
  { id: "AZ", name: "Azerbaijan" },
  { id: "BE", name: "Belgium" },
  { id: "BG", name: "Bulgaria" },
  { id: "BO", name: "Bolivia" },
  { id: "BR", name: "Brazil" },
  { id: "CA", name: "Canada" },
  { id: "CH", name: "Switzerland" },
  { id: "CL", name: "Chile" },
  { id: "CN", name: "China" },
  { id: "CO", name: "Colombia" },
  { id: "CR", name: "Costa Rica" },
  { id: "CY", name: "Cyprus" },
  { id: "CZ", name: "Czech Republic" },
  { id: "DE", name: "Germany" },
  { id: "DK", name: "Denmark" },
  { id: "DO", name: "Dominican Republic" },
  { id: "EC", name: "Ecuador" },
  { id: "EE", name: "Estonia" },
  { id: "EG", name: "Egypt" },
  { id: "ES", name: "Spain" },
  { id: "FI", name: "Finland" },
  { id: "FR", name: "France" },
  { id: "GB", name: "United Kingdom" },
  { id: "GR", name: "Greece" },
  { id: "HK", name: "Hong Kong" },
  { id: "HR", name: "Croatia" },
  { id: "HU", name: "Hungary" },
  { id: "ID", name: "Indonesia" },
  { id: "IE", name: "Ireland" },
  { id: "IL", name: "Israel" },
  { id: "IN", name: "India" },
  { id: "IS", name: "Iceland" },
  { id: "IT", name: "Italy" },
  { id: "JP", name: "Japan" },
  { id: "KR", name: "South Korea" },
  { id: "LT", name: "Lithuania" },
  { id: "LU", name: "Luxembourg" },
  { id: "LV", name: "Latvia" },
  { id: "MX", name: "Mexico" },
  { id: "MY", name: "Malaysia" },
  { id: "NL", name: "Netherlands" },
  { id: "NO", name: "Norway" },
  { id: "NZ", name: "New Zealand" },
  { id: "PE", name: "Peru" },
  { id: "PH", name: "Philippines" },
  { id: "PK", name: "Pakistan" },
  { id: "PL", name: "Poland" },
  { id: "PT", name: "Portugal" },
  { id: "RO", name: "Romania" },
  { id: "RS", name: "Serbia" },
  { id: "RU", name: "Russia" },
  { id: "SA", name: "Saudi Arabia" },
  { id: "SE", name: "Sweden" },
  { id: "SG", name: "Singapore" },
  { id: "SI", name: "Slovenia" },
  { id: "SK", name: "Slovakia" },
  { id: "TH", name: "Thailand" },
  { id: "TR", name: "Turkey" },
  { id: "TW", name: "Taiwan" },
  { id: "UA", name: "Ukraine" },
  { id: "US", name: "United States" },
  { id: "UY", name: "Uruguay" },
  { id: "VE", name: "Venezuela" },
  { id: "VN", name: "Vietnam" },
  { id: "ZA", name: "South Africa" },
];

const normalizeRegionCode = (value) => {
  const regionCode = String(value || "").trim().toUpperCase();

  return /^[A-Z]{2}$/.test(regionCode) ? regionCode : "";
};

const sortRegions = (regions) =>
  [...regions].sort((firstRegion, secondRegion) =>
    firstRegion.name.localeCompare(secondRegion.name, "en", {
      sensitivity: "base",
    })
  );

const normalizeRegionOptions = (countries) => {
  if (!Array.isArray(countries)) return [];

  const regionsByCode = new Map();

  countries.forEach((country) => {
    const id = normalizeRegionCode(country?.iso_3166_1);

    if (!id) return;

    const englishName = String(country?.english_name || "").trim();
    const nativeName = String(country?.native_name || "").trim();

    regionsByCode.set(id, {
      id,
      name: englishName || nativeName || id,
    });
  });

  return sortRegions([...regionsByCode.values()]);
};

const SORTED_FALLBACK_REGION_OPTIONS = sortRegions(FALLBACK_REGION_OPTIONS);

const RELEASE_FILTERS = [
  { id: "all", label: "All releases", releaseTypes: "", monetization: "" },
  {
    id: "theatrical",
    label: "In cinemas",
    releaseTypes: "2|3",
    monetization: "",
  },
  { id: "digital", label: "Digital", releaseTypes: "4", monetization: "" },
  {
    id: "streaming",
    label: "Streaming",
    releaseTypes: "",
    monetization: "flatrate",
  },
];

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
});

const parseDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;

  const date = new Date(`${value}T12:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
};

const toDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const addDays = (date, amount) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
};

const getWeekStart = (date) => {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const distanceFromMonday = day === 0 ? -6 : 1 - day;

  weekStart.setHours(12, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() + distanceFromMonday);
  return weekStart;
};

const getPage = (value) => {
  const parsedPage = Number.parseInt(value, 10);
  return Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
};

const readPreferredRegion = () => {
  try {
    const savedRegion = normalizeRegionCode(
      window.localStorage.getItem(MOVIE_REGION_STORAGE_KEY)
    );

    return savedRegion || "US";
  } catch {
    return "US";
  }
};

const Calendar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, loading, error, fetchData } = useFetchMovies();
  const {
    data: countriesData,
    loading: countriesLoading,
    error: countriesError,
    fetchData: fetchCountries,
  } = useFetchMovies();
  const {
    toggleWatchlist,
    toggleWatched,
    isInWatchlist,
    isWatched,
  } = useWatchlist();

  const requestedWeek = searchParams.get("week");
  const requestedRegion = searchParams.get("region");
  const requestedReleaseType = searchParams.get("type") || "all";
  const page = getPage(searchParams.get("page"));

  const weekStart = useMemo(
    () => getWeekStart(parseDate(requestedWeek) || new Date()),
    [requestedWeek]
  );
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const startDate = toDateValue(weekStart);
  const endDate = toDateValue(weekEnd);
  const region = normalizeRegionCode(requestedRegion) || readPreferredRegion();
  const releaseFilter =
    RELEASE_FILTERS.find(({ id }) => id === requestedReleaseType) ||
    RELEASE_FILTERS[0];

  const requestParams = useMemo(() => {
    const params = {
      language: "en-US",
      page,
      include_adult: false,
      include_video: false,
      region,
      sort_by: "primary_release_date.asc",
      "release_date.gte": startDate,
      "release_date.lte": endDate,
    };

    if (releaseFilter.releaseTypes) {
      params.with_release_type = releaseFilter.releaseTypes;
    }

    if (releaseFilter.monetization) {
      params.watch_region = region;
      params.with_watch_monetization_types = releaseFilter.monetization;
    }

    return params;
  }, [
    endDate,
    page,
    region,
    releaseFilter.monetization,
    releaseFilter.releaseTypes,
    startDate,
  ]);

  useEffect(() => {
    document.title = "Release Calendar | M-movie";
  }, []);

  useEffect(() => {
    fetchData("GET", "/discover/movie", requestParams);
  }, [fetchData, requestParams]);

  useEffect(() => {
    fetchCountries("GET", "/configuration/countries", {
      language: "en-US",
    });
  }, [fetchCountries]);

  const configuredRegions = useMemo(
    () => normalizeRegionOptions(countriesData?.data),
    [countriesData]
  );
  const countriesUnavailable =
    Boolean(countriesError) ||
    (!countriesLoading &&
      countriesData !== undefined &&
      configuredRegions.length === 0);
  const availableRegions = useMemo(
    () =>
      configuredRegions.length
        ? configuredRegions
        : countriesUnavailable
        ? SORTED_FALLBACK_REGION_OPTIONS
        : [],
    [configuredRegions, countriesUnavailable]
  );
  const regionOptions = useMemo(() => {
    if (availableRegions.some(({ id }) => id === region)) {
      return availableRegions;
    }

    return sortRegions([
      ...availableRegions,
      { id: region, name: region },
    ]);
  }, [availableRegions, region]);
  const selectedRegionName =
    regionOptions.find(({ id }) => id === region)?.name || region;
  const isLoadingRegions =
    countriesLoading && configuredRegions.length === 0;

  const totalResults = data?.data?.total_results || 0;
  const totalPages = Math.min(data?.data?.total_pages || 0, 500);
  const currentWeekStart = toDateValue(getWeekStart(new Date()));

  const releaseGroups = useMemo(() => {
    const groups = new Map();
    const movies = Array.isArray(data?.data?.results)
      ? data.data.results
      : [];

    movies.forEach((movie) => {
      if (!parseDate(movie.release_date)) return;

      const group = groups.get(movie.release_date) || [];
      group.push(movie);
      groups.set(movie.release_date, group);
    });

    return [...groups.entries()].sort(([firstDate], [secondDate]) =>
      firstDate.localeCompare(secondDate)
    );
  }, [data]);

  const updateSearch = (updates, resetPage = true) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    });

    if (resetPage) nextParams.delete("page");
    setSearchParams(nextParams);
  };

  const moveWeek = (amount) => {
    updateSearch({ week: toDateValue(addDays(weekStart, amount * 7)) });
    window.scrollTo?.({ top: 0, behavior: "auto" });
  };

  const handleRegionChange = (event) => {
    const nextRegion = event.target.value;

    try {
      window.localStorage.setItem(MOVIE_REGION_STORAGE_KEY, nextRegion);
    } catch {
      // The selected region still works for the current session.
    }

    updateSearch({ region: nextRegion });
  };

  const handleReleaseTypeChange = (releaseType) => {
    updateSearch({ type: releaseType === "all" ? "" : releaseType });
  };

  const handlePageChange = (nextPage) => {
    updateSearch({ page: String(nextPage) }, false);
    window.scrollTo?.({ top: 0, behavior: "auto" });
  };

  return (
    <main className="release-calendar">
      <div className="page-container">
        <header className="release-calendar__hero">
          <div>
            <span className="release-calendar__eyebrow">Release schedule</span>
            <h1>Release calendar</h1>
          </div>

          <p>
            Browse regional movie premieres one week at a time. Dates and
            release formats are supplied by TMDB.
          </p>
        </header>

        <section
          className="release-calendar__controls"
          aria-label="Calendar controls"
        >
          <div className="release-calendar__week-controls">
            <button
              type="button"
              onClick={() => moveWeek(-1)}
              aria-label="Previous week"
            >
              <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
            </button>

            <div aria-live="polite">
              <span>Selected week</span>
              <strong>
                {DATE_FORMATTER.format(weekStart)} – {DATE_FORMATTER.format(weekEnd)}
              </strong>
            </div>

            <button
              type="button"
              onClick={() => moveWeek(1)}
              aria-label="Next week"
            >
              <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </button>

            <button
              className="release-calendar__today"
              type="button"
              disabled={startDate === currentWeekStart}
              onClick={() => updateSearch({ week: currentWeekStart })}
            >
              This week
            </button>
          </div>

          <div className="release-calendar__region">
            <label htmlFor="calendar-region">
              <span>Release region</span>
            </label>
            <select
              id="calendar-region"
              value={region}
              onChange={handleRegionChange}
              aria-describedby={
                isLoadingRegions || countriesUnavailable
                  ? "calendar-region-status"
                  : undefined
              }
            >
              {regionOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            {isLoadingRegions && (
              <small id="calendar-region-status" role="status">
                Loading all TMDB regions…
              </small>
            )}
            {countriesUnavailable && (
              <small id="calendar-region-status">
                TMDB region list unavailable. Using fallback regions.
              </small>
            )}
          </div>
        </section>

        <div
          className="release-calendar__types"
          role="group"
          aria-label="Release format"
        >
          {RELEASE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={filter.id === releaseFilter.id ? "is-active" : ""}
              aria-pressed={filter.id === releaseFilter.id}
              onClick={() => handleReleaseTypeChange(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {releaseFilter.id === "streaming" && (
          <p className="release-calendar__filter-note">
            Streaming filters current subscription availability. Day groups
            still use each movie&apos;s regional release date.
          </p>
        )}

        <section
          className="release-calendar__schedule"
          aria-labelledby="calendar-schedule-title"
        >
          <div className="release-calendar__schedule-header">
            <div>
              <span>Week at a glance</span>
              <h2 id="calendar-schedule-title">
                {selectedRegionName} releases
              </h2>
            </div>

            {!loading && !error && (
              <p>
                <strong>{totalResults.toLocaleString()}</strong>{" "}
                {totalResults === 1 ? "movie" : "movies"}
              </p>
            )}
          </div>

          {loading && (
            <div className="release-calendar__state">
              <Loading />
            </div>
          )}

          {!loading && error && (
            <div className="release-calendar__state" role="alert">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
              <h3>Release dates could not be loaded</h3>
              <p>Check the connection and try the request again.</p>
              <button
                type="button"
                onClick={() =>
                  fetchData("GET", "/discover/movie", requestParams)
                }
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && releaseGroups.length === 0 && (
            <div className="release-calendar__state">
              <i className="fa-regular fa-calendar-xmark" aria-hidden="true"></i>
              <h3>No releases listed for this week</h3>
              <p>Try another week, region, or release format.</p>
            </div>
          )}

          {!loading && !error && releaseGroups.length > 0 && (
            <div className="release-calendar__days">
              {releaseGroups.map(([date, dayMovies]) => {
                const releaseDate = parseDate(date);
                const headingId = `release-day-${date}`;

                return (
                  <section
                    className="release-calendar__day"
                    key={date}
                    aria-labelledby={headingId}
                  >
                    <header className="release-calendar__date">
                      <time dateTime={date}>
                        <span>{WEEKDAY_FORMATTER.format(releaseDate)}</span>
                        <strong>{releaseDate.getDate()}</strong>
                        <span>{MONTH_FORMATTER.format(releaseDate)}</span>
                      </time>
                      <div>
                        <h3 id={headingId}>
                          {FULL_DATE_FORMATTER.format(releaseDate)}
                        </h3>
                        <p>
                          {dayMovies.length}{" "}
                          {dayMovies.length === 1 ? "release" : "releases"}
                        </p>
                      </div>
                    </header>

                    <div className="release-calendar__grid">
                      {dayMovies.map((movie) => (
                        <MovieCard
                          key={movie.id}
                          {...movie}
                          isFavorite={isInWatchlist?.(movie.id) || false}
                          isWatched={isWatched?.(movie.id) || false}
                          onToggleFavorite={toggleWatchlist}
                          onToggleWatched={toggleWatched}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {!loading && !error && totalPages > 1 && (
            <nav
              className="release-calendar__pagination"
              aria-label="Release calendar pagination"
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
        </section>
      </div>
    </main>
  );
};

export default Calendar;
