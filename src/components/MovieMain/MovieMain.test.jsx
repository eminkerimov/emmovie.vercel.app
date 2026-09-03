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

const setupMovieMain = (isWatched = false, watchlist = [movie]) => {
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
        watchlist={watchlist}
        isWatched={isWatched}
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
        name: "Manage The Movie in My Library",
      })
    );
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Want to watch" })
    ).toHaveAttribute("aria-checked", "true");
    userEvent.click(
      screen.getByRole("menuitemcheckbox", { name: "Watched" })
    );

    expect(toggleWatched).toHaveBeenCalledTimes(1);
  });

  it("shows the persisted watched state", () => {
    setupMovieMain(true);

    userEvent.click(
      screen.getByRole("button", {
        name: "Manage The Movie in My Library",
      })
    );
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Watched" })
    ).toHaveAttribute("aria-checked", "true");
  });

  it("keeps the watched action available before the movie is saved", () => {
    const toggleWatched = setupMovieMain(false, []);

    userEvent.click(
      screen.getByRole("button", {
        name: "Manage The Movie in My Library",
      })
    );
    userEvent.click(
      screen.getByRole("menuitemcheckbox", { name: "Watched" })
    );

    expect(toggleWatched).toHaveBeenCalledTimes(1);
  });
});
