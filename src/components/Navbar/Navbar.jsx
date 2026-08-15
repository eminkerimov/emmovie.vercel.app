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
import { THUMBNAIL_API } from "../../helpers/baseURL";
import Default from "../../images/Default.jpg";
import "./Navbar.scss";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] =
    useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const burgerRef = useRef(null);
  const mobilePanelRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  const { data, loading, error, fetchData } =
    useFetchMovies();

  const searchResults =
    data?.data?.results?.slice(0, 5) || [];

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
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchData("GET", "/search/movie", {
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
      `/search?q=${encodeURIComponent(query)}`
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
              Search movies
            </label>
            <input
              id="header-movie-search"
              ref={searchInputRef}
              type="search"
              placeholder="Search movies..."
              value={searchTerm}
              aria-controls="header-search-results"
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
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
                    {searchResults.map((movie) => (
                      <Link
                        className="header-search__result"
                        to={`/movie/${movie.id}`}
                        key={movie.id}
                        onClick={handleResultClick}
                      >
                        <img
                          src={
                            movie.poster_path
                              ? THUMBNAIL_API +
                                movie.poster_path
                              : Default
                          }
                          alt={movie.title}
                          loading="lazy"
                          decoding="async"
                        />

                        <div>
                          <strong>{movie.title}</strong>

                          <span>
                            {movie.release_date?.slice(
                              0,
                              4
                            ) || "N/A"}
                          </span>
                        </div>

                        {movie.vote_average > 0 && (
                          <small>
                            {movie.vote_average.toFixed(
                              1
                            )}
                          </small>
                        )}
                      </Link>
                    ))}

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
                    No movies found
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
            Watchlist
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
