import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  WatchlistProvider,
  WATCHED_KEY,
  WATCHLIST_KEY,
  WATCHLIST_META_KEY,
} from "../context/WatchlistContext";
import { NotificationProvider } from "../context/NotificationContext";
import useWatchlist from "./useWatchlist";

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
    watchedMovies,
    toggleWatchlist,
    toggleWatched,
    clearWatchlist,
    clearWatched,
    isInWatchlist,
    isWatched,
  } = useWatchlist();

  return (
    <div>
      <output data-testid="watchlist-count">{watchlist.length}</output>
      <output data-testid="watched-count">{watchedMovies.length}</output>
      <output data-testid="favorite-state">
        {isInWatchlist(movie.id) ? "saved" : "not saved"}
      </output>
      <output data-testid="watched-state">
        {isWatched(movie.id) ? "watched" : "not watched"}
      </output>
      <button type="button" onClick={() => toggleWatchlist(movie)}>
        Toggle watchlist
      </button>
      <button type="button" onClick={() => toggleWatched(movie)}>
        Toggle watched
      </button>
      <button type="button" onClick={clearWatchlist}>
        Clear watchlist
      </button>
      <button type="button" onClick={clearWatched}>
        Clear watched
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

  it("hydrates emmovie_watchlist without changing its format", () => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify([movie]));

    renderWatchlist();

    expect(screen.getByTestId("watchlist-count")).toHaveTextContent("1");
    expect(screen.getByTestId("watched-count")).toHaveTextContent("0");
    expect(JSON.parse(localStorage.getItem(WATCHLIST_KEY))).toEqual([movie]);
  });

  it("persists watchlist and watched membership independently", async () => {
    renderWatchlist();

    userEvent.click(
      screen.getByRole("button", { name: "Toggle watched" })
    );

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(WATCHED_KEY))).toEqual([movie]);
    });
    expect(JSON.parse(localStorage.getItem(WATCHLIST_KEY))).toEqual([]);

    userEvent.click(
      screen.getByRole("button", { name: "Toggle watchlist" })
    );

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(WATCHLIST_KEY))).toEqual([movie]);
    });
    expect(JSON.parse(localStorage.getItem(WATCHED_KEY))).toEqual([movie]);
    expect(screen.getByTestId("favorite-state")).toHaveTextContent("saved");
    expect(screen.getByTestId("watched-state")).toHaveTextContent("watched");
  });

  it("clearing either collection never clears the other", async () => {
    renderWatchlist();

    userEvent.click(
      screen.getByRole("button", { name: "Toggle watchlist" })
    );
    userEvent.click(
      screen.getByRole("button", { name: "Toggle watched" })
    );
    userEvent.click(
      screen.getByRole("button", { name: "Clear watchlist" })
    );

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(WATCHLIST_KEY))).toEqual([]);
    });
    expect(JSON.parse(localStorage.getItem(WATCHED_KEY))).toEqual([movie]);

    userEvent.click(
      screen.getByRole("button", { name: "Clear watched" })
    );

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(WATCHED_KEY))).toEqual([]);
    });
    expect(JSON.parse(localStorage.getItem(WATCHLIST_KEY))).toEqual([]);
  });

  it("toggles watchedAt without writing legacy status metadata", async () => {
    renderWatchlist();

    userEvent.click(
      screen.getByRole("button", { name: "Toggle watched" })
    );

    await waitFor(() => {
      expect(
        JSON.parse(localStorage.getItem(WATCHLIST_META_KEY))[movie.id]
          .watchedAt
      ).not.toBe("");
    });
    expect(
      JSON.parse(localStorage.getItem(WATCHLIST_META_KEY))[movie.id]
    ).not.toHaveProperty("status");

    userEvent.click(
      screen.getByRole("button", { name: "Toggle watched" })
    );

    await waitFor(() => {
      expect(
        JSON.parse(localStorage.getItem(WATCHLIST_META_KEY))[movie.id]
          .watchedAt
      ).toBe("");
    });
    expect(JSON.parse(localStorage.getItem(WATCHLIST_KEY))).toEqual([]);
  });

  it("migrates legacy watched metadata only when emmovie_watched is absent", async () => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify([movie]));
    localStorage.setItem(
      WATCHLIST_META_KEY,
      JSON.stringify({
        [movie.id]: {
          status: "watched",
          note: "Legacy note",
        },
      })
    );

    renderWatchlist();

    expect(screen.getByTestId("favorite-state")).toHaveTextContent("saved");
    expect(screen.getByTestId("watched-state")).toHaveTextContent("watched");

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(WATCHED_KEY))).toEqual([movie]);
    });
    expect(JSON.parse(localStorage.getItem(WATCHLIST_KEY))).toEqual([movie]);
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
        name: "Toggle watched",
      })[0]
    );

    await waitFor(() => {
      expect(screen.getAllByTestId("watched-count")[0]).toHaveTextContent(
        "1"
      );
    });
    expect(screen.getAllByTestId("watched-count")[1]).toHaveTextContent(
      "1"
    );
  });
});
