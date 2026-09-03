import React from "react";
import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import {
  WatchlistProvider,
  WATCHLIST_KEY,
  WATCHLIST_META_KEY,
  WATCHED_KEY,
} from "../../context/WatchlistContext";
import { NotificationProvider } from "../../context/NotificationContext";
import Watchlist from "./index";

const movies = [
  {
    id: 550,
    title: "Fight Club",
    poster_path: "/fight.jpg",
    overview: "Fight Club overview",
    vote_average: 8.4,
    release_date: "1999-10-15",
  },
  {
    id: 438631,
    title: "Dune",
    poster_path: "/dune.jpg",
    overview: "Dune overview",
    vote_average: 8,
    release_date: "2021-09-15",
  },
];
const watchedMovies = [movies[1]];

const renderWatchlist = () =>
  render(
    <MemoryRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <NotificationProvider>
        <WatchlistProvider>
          <Watchlist />
        </WatchlistProvider>
      </NotificationProvider>
    </MemoryRouter>
  );

describe("Watchlist library", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      WATCHLIST_KEY,
      JSON.stringify(movies)
    );
    localStorage.setItem(
      WATCHED_KEY,
      JSON.stringify(watchedMovies)
    );
  });

  it("defaults to Want to watch, filters that collection, and saves personal data", async () => {
    renderWatchlist();

    expect(
      screen.getByRole("tab", { name: "Want to watch" })
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.queryByRole("tab", { name: "All" })
    ).not.toBeInTheDocument();

    userEvent.type(
      screen.getByRole("searchbox", {
        name: /search want to watch movies/i,
      }),
      "dune"
    );

    expect(
      screen.getByRole("heading", { name: "Dune" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Fight Club" })
    ).not.toBeInTheDocument();

    userEvent.selectOptions(
      screen.getByLabelText("My rating for Dune"),
      "9"
    );

    await waitFor(() => {
      expect(
        JSON.parse(
          localStorage.getItem(WATCHLIST_META_KEY)
        )[438631]
      ).toMatchObject({
        personalRating: 9,
      });
    });
  });

  it("keeps the same movie independently in Want to watch and Watched", async () => {
    renderWatchlist();

    expect(
      screen.getByRole("heading", { name: "Dune" })
    ).toBeInTheDocument();

    userEvent.click(
      screen.getByRole("tab", { name: "Watched" })
    );

    expect(
      screen.getByRole("heading", {
        name: "Dune",
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Fight Club" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText("Date watched for Dune")
    ).toBeInTheDocument();

    userEvent.click(
      screen.getByRole("button", {
        name: "Manage Dune in My Library",
      })
    );
    userEvent.click(
      screen.getByRole("menuitemcheckbox", {
        name: "Want to watch",
      })
    );

    expect(
      screen.getByRole("heading", { name: "Dune" })
    ).toBeInTheDocument();

    userEvent.click(
      screen.getByRole("tab", { name: "Want to watch" })
    );

    expect(
      screen.getByRole("heading", { name: "Fight Club" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Dune" })
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(
        JSON.parse(localStorage.getItem(WATCHLIST_KEY))
      ).toEqual([movies[0]]);
    });
    await waitFor(() => {
      expect(
        JSON.parse(localStorage.getItem(WATCHED_KEY))
      ).toEqual(watchedMovies);
    });
  });

  it("marks a favorite as watched without removing it from Want to watch", async () => {
    renderWatchlist();

    userEvent.click(
      screen.getByRole("button", {
        name: "Manage Fight Club in My Library",
      })
    );
    userEvent.click(
      screen.getByRole("menuitemcheckbox", {
        name: "Watched",
      })
    );

    expect(
      screen.getByRole("heading", { name: "Fight Club" })
    ).toBeInTheDocument();

    userEvent.click(
      screen.getByRole("tab", { name: "Watched" })
    );

    expect(
      screen.getByRole("heading", { name: "Fight Club" })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        JSON.parse(localStorage.getItem(WATCHLIST_KEY))
      ).toEqual(movies);
    });
    await waitFor(() => {
      expect(
        JSON.parse(localStorage.getItem(WATCHED_KEY))
      ).toEqual([movies[0], movies[1]]);
    });
  });

  it("clears only the active Want to watch collection", async () => {
    renderWatchlist();

    userEvent.click(
      screen.getByRole("button", {
        name: "Clear Want to watch collection",
      })
    );

    expect(
      screen.getByRole("heading", {
        name: /no movies saved to watch/i,
      })
    ).toBeInTheDocument();

    userEvent.click(
      screen.getByRole("tab", { name: "Watched" })
    );

    expect(
      screen.getByRole("heading", { name: "Dune" })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        JSON.parse(localStorage.getItem(WATCHLIST_KEY))
      ).toEqual([]);
    });
    await waitFor(() => {
      expect(
        JSON.parse(localStorage.getItem(WATCHED_KEY))
      ).toEqual(watchedMovies);
    });
  });

  it("clears Watched without removing Want to watch movies", async () => {
    renderWatchlist();

    userEvent.click(
      screen.getByRole("tab", { name: "Watched" })
    );
    userEvent.click(
      screen.getByRole("button", {
        name: "Clear Watched collection",
      })
    );

    expect(
      screen.getByRole("heading", {
        name: /no watched movies yet/i,
      })
    ).toBeInTheDocument();

    userEvent.click(
      screen.getByRole("tab", { name: "Want to watch" })
    );

    expect(
      screen.getByRole("heading", { name: "Fight Club" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Dune" })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        JSON.parse(localStorage.getItem(WATCHED_KEY))
      ).toEqual([]);
    });
    await waitFor(() => {
      expect(
        JSON.parse(localStorage.getItem(WATCHLIST_KEY))
      ).toEqual(movies);
    });
  });
});
