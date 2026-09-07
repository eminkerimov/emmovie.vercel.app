import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import MovieCard from "./MovieCard";

const movie = {
  id: 550,
  title: "Fight Club",
  poster_path: "/poster.jpg",
  overview: "An insomniac meets a soap maker.",
  vote_average: 8.4,
  release_date: "1999-10-15",
};

const originalMatchMedia = window.matchMedia;
const originalStartViewTransition = document.startViewTransition;

const LocationProbe = () => {
  const location = useLocation();

  return <output data-testid="location">{location.pathname}</output>;
};

const renderMovieCard = (props = {}) =>
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <MovieCard {...movie} {...props} />
      <LocationProbe />
    </MemoryRouter>
  );

describe("MovieCard", () => {
  afterEach(() => {
    window.matchMedia = originalMatchMedia;

    if (originalStartViewTransition) {
      Object.defineProperty(document, "startViewTransition", {
        configurable: true,
        value: originalStartViewTransition,
      });
    } else {
      delete document.startViewTransition;
    }
  });

  it("keeps navigation and the library menu as separate controls", () => {
    renderMovieCard({
      onToggleFavorite: jest.fn(),
      onToggleWatched: jest.fn(),
    });

    const movieLink = screen.getByRole("link", { name: /fight club/i });
    const libraryButton = screen.getByRole("button", {
      name: "Manage Fight Club in My Library",
    });

    expect(movieLink).toHaveAttribute("href", "/movie/550");
    expect(movieLink).not.toContainElement(libraryButton);
    expect(libraryButton).toHaveAttribute("aria-haspopup", "menu");
    expect(libraryButton).toHaveAttribute("aria-expanded", "false");
  });

  it("opens one menu and toggles Want to watch with the movie payload", () => {
    const onToggleFavorite = jest.fn();
    renderMovieCard({
      onToggleFavorite,
      onToggleWatched: jest.fn(),
    });

    userEvent.click(
      screen.getByRole("button", {
        name: "Manage Fight Club in My Library",
      })
    );
    userEvent.click(
      screen.getByRole("menuitemcheckbox", {
        name: "Want to watch",
      })
    );

    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
    expect(onToggleFavorite).toHaveBeenCalledWith(movie);
  });

  it("exposes both independent saved states in the same menu", () => {
    const onToggleFavorite = jest.fn();
    const onToggleWatched = jest.fn();
    renderMovieCard({
      isFavorite: true,
      isWatched: true,
      onToggleFavorite,
      onToggleWatched,
    });

    const libraryButton = screen.getByRole("button", {
      name: "Manage Fight Club in My Library",
    });

    expect(libraryButton).not.toHaveClass("is-active");
    userEvent.click(libraryButton);

    const wantItem = screen.getByRole("menuitemcheckbox", {
      name: "Want to watch",
    });
    const watchedItem = screen.getByRole("menuitemcheckbox", {
      name: "Watched",
    });

    expect(wantItem).toHaveAttribute("aria-checked", "true");
    expect(watchedItem).toHaveAttribute("aria-checked", "true");

    userEvent.click(watchedItem);

    expect(onToggleWatched).toHaveBeenCalledWith(movie);
    expect(onToggleFavorite).not.toHaveBeenCalled();
  });

  it("shows unchecked items for a movie that is in neither list", () => {
    renderMovieCard({
      onToggleFavorite: jest.fn(),
      onToggleWatched: jest.fn(),
    });

    userEvent.click(
      screen.getByRole("button", {
        name: "Manage Fight Club in My Library",
      })
    );

    expect(
      screen.getByRole("menuitemcheckbox", {
        name: "Want to watch",
      })
    ).toHaveAttribute("aria-checked", "false");
    expect(
      screen.getByRole("menuitemcheckbox", {
        name: "Watched",
      })
    ).toHaveAttribute("aria-checked", "false");
  });

  it("closes with Escape and returns focus to the trigger", () => {
    renderMovieCard({
      onToggleFavorite: jest.fn(),
      onToggleWatched: jest.fn(),
    });

    const libraryButton = screen.getByRole("button", {
      name: "Manage Fight Club in My Library",
    });

    userEvent.click(libraryButton);
    userEvent.keyboard("{Escape}");

    expect(libraryButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(libraryButton).toHaveFocus();
  });

  it("supports a custom internal details destination without exposing library actions", () => {
    renderMovieCard({
      detailsPath: "/movie/550?media=tv",
    });

    const detailsLink = screen.getByRole("link", {
      name: "Open Fight Club details",
    });

    expect(detailsLink).toHaveAttribute(
      "href",
      "/movie/550?media=tv"
    );
    expect(detailsLink).not.toHaveAttribute("target");
    expect(
      screen.queryByRole("button", {
        name: "Manage Fight Club in My Library",
      })
    ).not.toBeInTheDocument();
  });

  it("routes TV cards to /tv and preserves TV identity in library actions", () => {
    const onToggleFavorite = jest.fn();
    const tvTitle = {
      title: undefined,
      name: "Game of Thrones",
      id: 1399,
      media_type: "tv",
      poster_path: "/thrones.jpg",
      overview: "Nine noble families fight for control.",
      vote_average: 8.5,
      release_date: undefined,
      first_air_date: "2011-04-17",
    };

    renderMovieCard({
      ...tvTitle,
      onToggleFavorite,
      onToggleWatched: jest.fn(),
    });

    expect(
      screen.getByRole("link", {
        name: "Open Game of Thrones details",
      })
    ).toHaveAttribute("href", "/tv/1399");
    expect(screen.getByText("Series")).toBeInTheDocument();

    userEvent.click(
      screen.getByRole("button", {
        name: "Manage Game of Thrones in My Library",
      })
    );
    userEvent.click(
      screen.getByRole("menuitemcheckbox", { name: "Want to watch" })
    );

    expect(onToggleFavorite).toHaveBeenCalledWith({
      id: 1399,
      title: "Game of Thrones",
      poster_path: "/thrones.jpg",
      overview: "Nine noble families fight for control.",
      vote_average: 8.5,
      release_date: "2011-04-17",
      media_type: "tv",
    });
  });

  it("uses View Transition for an unmodified details navigation", async () => {
    const startViewTransition = jest.fn((callback) => {
      callback();
      return { finished: Promise.resolve() };
    });
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: startViewTransition,
    });
    window.matchMedia = jest.fn(() => ({ matches: false }));

    renderMovieCard();
    userEvent.click(
      screen.getByRole("link", { name: "Open Fight Club details" })
    );

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/movie/550");
    });
    expect(startViewTransition).toHaveBeenCalledTimes(1);
  });

  it("navigates without View Transition when reduced motion is preferred", async () => {
    const startViewTransition = jest.fn();
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: startViewTransition,
    });
    window.matchMedia = jest.fn(() => ({ matches: true }));

    renderMovieCard();
    userEvent.click(
      screen.getByRole("link", { name: "Open Fight Club details" })
    );

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/movie/550");
    });
    expect(startViewTransition).not.toHaveBeenCalled();
  });
});
