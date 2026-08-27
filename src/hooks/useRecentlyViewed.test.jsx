import React from "react";
import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import useRecentlyViewed, {
  RECENTLY_VIEWED_KEY,
} from "./useRecentlyViewed";

const firstMovie = {
  id: 550,
  title: "Fight Club",
  poster_path: "/fight.jpg",
  overview: "Overview",
  vote_average: 8.4,
  release_date: "1999-10-15",
  ignoredField: "not persisted",
};

const HistoryHarness = () => {
  const {
    recentlyViewed,
    addRecentlyViewed,
  } = useRecentlyViewed();

  return (
    <>
      <output data-testid="history">
        {recentlyViewed.map((movie) => movie.title).join(",")}
      </output>
      <button
        type="button"
        onClick={() => addRecentlyViewed(firstMovie)}
      >
        Add first
      </button>
      <button
        type="button"
        onClick={() =>
          addRecentlyViewed({
            ...firstMovie,
            id: 438631,
            title: "Dune",
          })
        }
      >
        Add second
      </button>
    </>
  );
};

describe("useRecentlyViewed", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists compact, deduplicated movie history", async () => {
    render(<HistoryHarness />);

    userEvent.click(
      screen.getByRole("button", { name: "Add first" })
    );
    userEvent.click(
      screen.getByRole("button", { name: "Add second" })
    );
    userEvent.click(
      screen.getByRole("button", { name: "Add first" })
    );

    expect(screen.getByTestId("history")).toHaveTextContent(
      "Fight Club,Dune"
    );

    await waitFor(() =>
      expect(
        JSON.parse(
          localStorage.getItem(RECENTLY_VIEWED_KEY)
        )
      ).toHaveLength(2)
    );

    const storedMovies = JSON.parse(
      localStorage.getItem(RECENTLY_VIEWED_KEY)
    );
    expect(storedMovies[0]).toEqual(
      expect.objectContaining({
        id: 550,
        title: "Fight Club",
      })
    );
    expect(storedMovies[0].ignoredField).toBeUndefined();
  });
});
