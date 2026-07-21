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
import { IMG_API } from "../../helpers/baseURL";
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
  const searchRef = useRef(null);

  const { data, loading, fetchData } =
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
  }, [searchTerm]);

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
      >
        <i className="fa-solid fa-film"></i>
        <span>M-movie</span>
      </Link>

      <button
        className={`home-header__burger ${
          menuOpen ? "is-open" : ""
        }`}
        type="button"
        onClick={() =>
          setMenuOpen((current) => !current)
        }
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div
        className={`home-header__mobile-panel ${
          menuOpen ? "is-open" : ""
        }`}
      >
        <div className="header-search" ref={searchRef}>
          <form
            className="home-header__search"
            onSubmit={handleSubmit}
          >
            <input
              type="search"
              placeholder="Search movies..."
              value={searchTerm}
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
            <div className="header-search__dropdown">
              {loading && (
                <div className="header-search__status">
                  Searching...
                </div>
              )}

              {!loading &&
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
                              ? IMG_API +
                                movie.poster_path
                              : Default
                          }
                          alt={movie.title}
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

              {!loading &&
                searchTerm.trim().length >= 2 &&
                searchResults.length === 0 && (
                  <div className="header-search__status">
                    No movies found
                  </div>
                )}
            </div>
          )}
        </div>

        <nav className="home-header__nav">
          <Link
            className={
              location.pathname === "/"
                ? "is-active"
                : ""
            }
            to="/"
            onClick={handleNavigationClick}
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
          >
            Watchlist
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;