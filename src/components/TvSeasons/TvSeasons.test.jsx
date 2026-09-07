import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { EPISODE_PROGRESS_KEY } from "../../hooks/useEpisodeProgress";
import TvSeasons from "./TvSeasons";

const createSeason = (seasonNumber) => ({
  id: seasonNumber + 100,
  name: seasonNumber === 0 ? "Specials" : `Season ${seasonNumber}`,
  season_number: seasonNumber,
  episode_count: 10,
  air_date: `202${seasonNumber}-01-01`,
  poster_path: `/season-${seasonNumber}.jpg`,
});

const routerFuture = {
  v7_relativeSplatPath: true,
  v7_startTransition: true,
};

const renderSeasons = (seasons = [createSeason(1), createSeason(2)]) =>
  render(
    <MemoryRouter future={routerFuture}>
      <TvSeasons data={{ id: 1399, seasons }} />
    </MemoryRouter>
  );

describe("TvSeasons", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("links seasons to their episode guides and shows local progress", () => {
    localStorage.setItem(
      EPISODE_PROGRESS_KEY,
      JSON.stringify({ "1399:1": [1, 2] })
    );

    renderSeasons();

    expect(
      screen.getByRole("heading", { name: "Seasons" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Open Season 1 episode guide",
      })
    ).toHaveAttribute("href", "/tv/1399/season/1");
    expect(screen.getByText("2 of 10 watched")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", {
        name: "Season 1 viewing progress",
      })
    ).toHaveAttribute("aria-valuenow", "2");
  });

  it("keeps long-running series compact until all seasons are requested", () => {
    renderSeasons(Array.from({ length: 7 }, (_, index) => createSeason(index + 1)));

    expect(
      screen.queryByRole("link", {
        name: "Open Season 7 episode guide",
      })
    ).not.toBeInTheDocument();

    userEvent.click(
      screen.getByRole("button", { name: "Show all 7 seasons" })
    );

    expect(
      screen.getByRole("link", {
        name: "Open Season 7 episode guide",
      })
    ).toBeInTheDocument();
  });

  it("does not render an empty seasons section", () => {
    const { container } = renderSeasons([]);

    expect(container).toBeEmptyDOMElement();
  });
});
