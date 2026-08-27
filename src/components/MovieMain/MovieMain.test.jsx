import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import MovieMain from "./MovieMain";

const movie = {
  id: 42,
  title: "The Movie",
  release_date: "2024-01-01",
  vote_average: 8,
  popularity: 100,
};

const setupMovieMain = (watchlistMeta = { status: "want" }) => {
  const toggleWatched = jest.fn();

  render(
    <MemoryRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <MovieMain
        data={movie}
        details={{ data: { cast: [] }, error: false, loading: false }}
        videos={[]}
        watchlist={[movie]}
        watchlistMeta={watchlistMeta}
        toggleWatchlist={jest.fn()}
        toggleWatched={toggleWatched}
      />
    </MemoryRouter>
  );

  return toggleWatched;
};

describe("MovieMain watched state", () => {
  it("exposes a real watched action for a saved movie", () => {
    const toggleWatched = setupMovieMain();

    userEvent.click(
      screen.getByRole("button", {
        name: "Mark The Movie as watched",
      })
    );

    expect(toggleWatched).toHaveBeenCalledTimes(1);
  });

  it("shows the persisted watched state", () => {
    setupMovieMain({ status: "watched" });

    expect(
      screen.getByRole("button", {
        name: "Move The Movie back to Want to watch",
      })
    ).toHaveAttribute("aria-pressed", "true");
  });
});
