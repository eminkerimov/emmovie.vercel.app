import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import MovieCard from "./MovieCard";

const movie = {
  id: 550,
  title: "Fight Club",
  poster_path: "/poster.jpg",
  overview: "An insomniac meets a soap maker.",
  vote_average: 8.4,
  release_date: "1999-10-15",
};

const renderMovieCard = (props = {}) =>
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <MovieCard {...movie} {...props} />
    </MemoryRouter>
  );

describe("MovieCard", () => {
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
});
