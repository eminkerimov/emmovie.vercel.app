import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  WatchlistProvider,
  WATCHLIST_META_KEY,
} from "../context/WatchlistContext";
import { NotificationProvider } from "../context/NotificationContext";
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

const renderWatchlist = (children = <WatchlistHarness />) =>
  render(
    <NotificationProvider>
      <WatchlistProvider>{children}</WatchlistProvider>
    </NotificationProvider>
  );

describe("useWatchlist persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("hydrates the existing emmovie_watchlist value without changing its format", () => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify([movie]));

    renderWatchlist();

    expect(screen.getByTestId("watchlist-count")).toHaveTextContent("1");
    expect(screen.getByTestId("favorite-state")).toHaveTextContent("saved");
    expect(JSON.parse(localStorage.getItem(WATCHLIST_KEY))).toEqual([movie]);
  });

  it("persists add, remove, and clear operations under emmovie_watchlist", async () => {
    renderWatchlist();

    userEvent.click(screen.getByRole("button", { name: /toggle movie/i }));

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(WATCHLIST_KEY))).toEqual([movie]);
    });
    expect(
      screen.getByText("Fight Club added to My Library.")
    ).toBeInTheDocument();

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

  it("keeps all consumers in sync in the same tab", async () => {
    renderWatchlist(
      <>
        <WatchlistHarness />
        <WatchlistHarness />
      </>
    );

    userEvent.click(
      screen.getAllByRole("button", {
        name: /toggle movie/i,
      })[0]
    );

    await waitFor(() => {
      screen
        .getAllByTestId("watchlist-count")
        .forEach((count) =>
          expect(count).toHaveTextContent("1")
        );
    });

    expect(
      JSON.parse(localStorage.getItem(WATCHLIST_META_KEY))[
        movie.id
      ]
    ).toMatchObject({ status: "want" });
  });
});
