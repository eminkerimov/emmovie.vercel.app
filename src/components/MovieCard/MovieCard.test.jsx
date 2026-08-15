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
  it("keeps movie navigation and the watchlist action as separate controls", () => {
    renderMovieCard({ onToggleFavorite: jest.fn() });

    const movieLink = screen.getByRole("link", { name: /fight club/i });
    const favoriteButton = screen.getByRole("button", {
      name: /add to watchlist/i,
    });

    expect(movieLink).toHaveAttribute("href", "/movie/550");
    expect(movieLink).not.toContainElement(favoriteButton);
  });

  it("passes the complete movie payload to the favorite callback", () => {
    const onToggleFavorite = jest.fn();
    renderMovieCard({ onToggleFavorite });

    userEvent.click(
      screen.getByRole("button", { name: /add to watchlist/i })
    );

    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
    expect(onToggleFavorite).toHaveBeenCalledWith(movie);
  });

  it("exposes the remove action for an already saved movie", () => {
    renderMovieCard({ isFavorite: true, onToggleFavorite: jest.fn() });

    expect(
      screen.getByRole("button", { name: /remove from watchlist/i })
    ).toBeInTheDocument();
  });
});
