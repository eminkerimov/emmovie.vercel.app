import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import useFetchMovies from "../../hooks/useFetchMovies";
import {
  PROFILE_API,
  THUMBNAIL_API,
} from "../../helpers/baseURL";
import Default from "../../images/Default.jpg";
import "./Navbar.scss";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] =
    useState(false);
  const [activeResultIndex, setActiveResultIndex] =
    useState(-1);

  const navigate = useNavigate();
  const location = useLocation();
  const burgerRef = useRef(null);
  const mobilePanelRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const resultRefs = useRef([]);

  const { data, loading, error, fetchData } =
    useFetchMovies();

  const searchResults =
    data?.data?.results
      ?.filter((result) =>
        ["movie", "person"].includes(
          result.media_type || "movie"
        )
      )
      .slice(0, 6) || [];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen
      ? "hidden"
      : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;

      if (menuOpen) {
        setMenuOpen(false);
        setDropdownOpen(false);
        burgerRef.current?.focus();
        return;
      }

      setDropdownOpen(false);
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const query = searchTerm.trim();

    if (query.length < 2) {
      setDropdownOpen(false);
      setActiveResultIndex(-1);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchData("GET", "/search/multi", {
        query,
        language: "en-US",
        page: 1,
      });

      setDropdownOpen(true);
    }, 400);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [fetchData, searchTerm]);

  useEffect(() => {
    setActiveResultIndex(-1);
    resultRefs.current = [];
  }, [data]);

  useEffect(() => {
    if (!dropdownOpen) {
      setActiveResultIndex(-1);
    }
  }, [dropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const closeNavigation = () => {
    setMenuOpen(false);
    setDropdownOpen(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const query = searchTerm.trim();

    if (!query) return;

    closeNavigation();

    navigate(
      `/search?q=${encodeURIComponent(
        query
      )}&type=all&page=1`
    );
  };

  const handleResultClick = () => {
    setSearchTerm("");
    closeNavigation();
  };

  const handleNavigationClick = () => {
    setSearchTerm("");
    closeNavigation();
  };

  const getResultPath = (result) =>
    result.media_type === "person"
      ? `/person/${result.id}`
      : `/movie/${result.id}`;

  const handleSearchKeyDown = (event) => {
    if (!dropdownOpen || !searchResults.length) {
      if (
        event.key === "ArrowDown" &&
        searchTerm.trim().length >= 2 &&
        searchResults.length
      ) {
        setDropdownOpen(true);
        setActiveResultIndex(0);
        event.preventDefault();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveResultIndex((currentIndex) =>
        currentIndex >= searchResults.length - 1
          ? 0
          : currentIndex + 1
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveResultIndex((currentIndex) =>
        currentIndex <= 0
          ? searchResults.length - 1
          : currentIndex - 1
      );
    }

    if (
      event.key === "Enter" &&
      activeResultIndex >= 0
    ) {
      event.preventDefault();
      const selectedResult =
        searchResults[activeResultIndex];

      if (selectedResult) {
        handleResultClick();
        navigate(getResultPath(selectedResult));
      }
    }
  };

  return (
    <header
      className={`home-header ${
        isScrolled && !menuOpen ? "is-scrolled" : ""
      }`}
    >
      <Link
        className="home-header__logo"
        to="/"
        onClick={handleNavigationClick}
        aria-label="M-movie home"
      >
        <i className="fa-solid fa-film" aria-hidden="true"></i>
        <span>M-movie</span>
      </Link>

      <button
        ref={burgerRef}
        className={`home-header__burger ${
          menuOpen ? "is-open" : ""
        }`}
        type="button"
        onClick={() =>
          setMenuOpen((current) => !current)
        }
        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        aria-controls="primary-navigation-panel"
        aria-expanded={menuOpen}
      >
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </button>

      <div
        id="primary-navigation-panel"
        ref={mobilePanelRef}
        className={`home-header__mobile-panel ${
          menuOpen ? "is-open" : ""
        }`}
      >
        <div className="header-search" ref={searchRef}>
          <form
            className="home-header__search"
            onSubmit={handleSubmit}
            role="search"
          >
            <label className="sr-only" htmlFor="header-movie-search">
              Search movies and people
            </label>
            <input
              id="header-movie-search"
              ref={searchInputRef}
              type="search"
              role="combobox"
              placeholder="Search movies and people..."
              value={searchTerm}
              aria-autocomplete="list"
              aria-expanded={dropdownOpen}
              aria-controls="header-search-results"
              aria-activedescendant={
                activeResultIndex >= 0
                  ? `header-search-result-${activeResultIndex}`
                  : undefined
              }
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              onKeyDown={handleSearchKeyDown}
              onFocus={() => {
                if (searchTerm.trim().length >= 2) {
                  setDropdownOpen(true);
                }
              }}
            />
          </form>

          {dropdownOpen && (
            <div
              id="header-search-results"
              className="header-search__dropdown"
              aria-live="polite"
            >
              {loading && (
                <div className="header-search__status">
                  Searching...
                </div>
              )}

              {!loading && error && (
                <div className="header-search__status" role="alert">
                  Search is unavailable. Try again.
                </div>
              )}

              {!loading && !error &&
                searchResults.length > 0 && (
                  <>
                    <div
                      className="header-search__results"
                      role="listbox"
                      aria-label="Search suggestions"
                    >
                      {searchResults.map((result, index) => {
                        const isPerson =
                          result.media_type === "person";
                        const title = isPerson
                          ? result.name
                          : result.title;
                        const imagePath = isPerson
                          ? result.profile_path
                          : result.poster_path;

                        return (
                          <Link
                            id={`header-search-result-${index}`}
                            ref={(element) => {
                              resultRefs.current[index] =
                                element;
                            }}
                            role="option"
                            aria-selected={
                              activeResultIndex === index
                            }
                            className={`header-search__result ${
                              activeResultIndex === index
                                ? "is-active"
                                : ""
                            }`}
                            to={getResultPath(result)}
                            key={`${result.media_type || "movie"}-${result.id}`}
                            onMouseEnter={() =>
                              setActiveResultIndex(index)
                            }
                            onClick={handleResultClick}
                          >
                            <img
                              src={
                                imagePath
                                  ? (isPerson
                                      ? PROFILE_API
                                      : THUMBNAIL_API) +
                                    imagePath
                                  : Default
                              }
                              alt=""
                              loading="lazy"
                              decoding="async"
                            />

                            <div>
                              <strong>{title}</strong>

                              <span>
                                <span className="header-search__type">
                                  {isPerson
                                    ? "Person"
                                    : "Movie"}
                                </span>
                                {isPerson
                                  ? result.known_for_department ||
                                    "Known talent"
                                  : result.release_date?.slice(
                                      0,
                                      4
                                    ) || "Date unknown"}
                              </span>
                            </div>

                            {!isPerson &&
                              result.vote_average > 0 && (
                                <small>
                                  {result.vote_average.toFixed(1)}
                                </small>
                              )}
                          </Link>
                        );
                      })}
                    </div>

                    <button
                      className="header-search__all"
                      type="button"
                      onClick={handleSubmit}
                    >
                      View all results
                    </button>
                  </>
                )}

              {!loading && !error &&
                searchTerm.trim().length >= 2 &&
                searchResults.length === 0 && (
                  <div className="header-search__status">
                    No movies or people found
                  </div>
                )}
            </div>
          )}
        </div>

        <nav className="home-header__nav" aria-label="Primary navigation">
          <Link
            className={
              location.pathname === "/"
                ? "is-active"
                : ""
            }
            to="/"
            onClick={handleNavigationClick}
            aria-current={location.pathname === "/" ? "page" : undefined}
          >
            Home
          </Link>

          <Link
            className={
              location.pathname === "/discover"
                ? "is-active"
                : ""
            }
            to="/discover"
            onClick={handleNavigationClick}
            aria-current={
              location.pathname === "/discover" ? "page" : undefined
            }
          >
            Discover
          </Link>

          <Link
            className={
              location.pathname === "/watchlist"
                ? "is-active"
                : ""
            }
            to="/watchlist"
            onClick={handleNavigationClick}
            aria-current={
              location.pathname === "/watchlist" ? "page" : undefined
            }
          >
            <span>Watchlist</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
