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
  });

  it("filters movies and saves personal status and rating", async () => {
    renderWatchlist();

    userEvent.type(
      screen.getByRole("searchbox", {
        name: /search saved movies/i,
      }),
      "dune"
    );

    expect(
      screen.getByRole("heading", { name: "Dune" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Fight Club" })
    ).not.toBeInTheDocument();

    userEvent.click(
      screen.getByRole("button", {
        name: "Mark Dune as watched",
      })
    );
    userEvent.selectOptions(
      screen.getByLabelText("My rating for Dune"),
      "9"
    );

    expect(
      screen.getByLabelText("Date watched for Dune")
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        JSON.parse(
          localStorage.getItem(WATCHLIST_META_KEY)
        )[438631]
      ).toMatchObject({
        status: "watched",
        personalRating: 9,
      });
    });
  });

  it("restores a cleared library with Undo", async () => {
    renderWatchlist();

    userEvent.click(
      screen.getByRole("button", { name: "Clear" })
    );
    expect(
      screen.getByRole("heading", {
        name: /no saved movies yet/i,
      })
    ).toBeInTheDocument();

    userEvent.click(
      screen.getByRole("button", { name: "Undo" })
    );

    expect(
      screen.getByRole("heading", { name: "Fight Club" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Dune" })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        JSON.parse(localStorage.getItem(WATCHLIST_KEY))
      ).toEqual(movies);
    });
  });
});
