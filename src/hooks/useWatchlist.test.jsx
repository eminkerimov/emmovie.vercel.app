import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import useWatchlist from "./useWatchlist";

const WATCHLIST_KEY = "emmovie_watchlist";
const movie = {
  id: 550,
  title: "Fight Club",
  poster_path: "/poster.jpg",
  overview: "An insomniac meets a soap maker.",
  vote_average: 8.4,
  release_date: "1999-10-15",
};

const WatchlistHarness = () => {
  const {
    watchlist,
    toggleWatchlist,
    clearWatchlist,
    isInWatchlist,
  } = useWatchlist();

  return (
    <div>
      <output data-testid="watchlist-count">{watchlist.length}</output>
      <output data-testid="favorite-state">
        {isInWatchlist(movie.id) ? "saved" : "not saved"}
      </output>
      <button type="button" onClick={() => toggleWatchlist(movie)}>
        Toggle movie
      </button>
      <button type="button" onClick={clearWatchlist}>
        Clear movies
      </button>
    </div>
  );
};

describe("useWatchlist persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("hydrates the existing emmovie_watchlist value without changing its format", () => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify([movie]));

    render(<WatchlistHarness />);

    expect(screen.getByTestId("watchlist-count")).toHaveTextContent("1");
    expect(screen.getByTestId("favorite-state")).toHaveTextContent("saved");
    expect(JSON.parse(localStorage.getItem(WATCHLIST_KEY))).toEqual([movie]);
  });

  it("persists add, remove, and clear operations under emmovie_watchlist", async () => {
    render(<WatchlistHarness />);

    userEvent.click(screen.getByRole("button", { name: /toggle movie/i }));

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(WATCHLIST_KEY))).toEqual([movie]);
    });

    userEvent.click(screen.getByRole("button", { name: /toggle movie/i }));

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(WATCHLIST_KEY))).toEqual([]);
    });

    userEvent.click(screen.getByRole("button", { name: /toggle movie/i }));
    userEvent.click(screen.getByRole("button", { name: /clear movies/i }));

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(WATCHLIST_KEY))).toEqual([]);
    });
    expect(localStorage.getItem("watchlist")).toBeNull();
  });
});
