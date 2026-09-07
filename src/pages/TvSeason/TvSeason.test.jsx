import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import useFetch from "../../helpers/useFetch";
import { EPISODE_PROGRESS_KEY } from "../../hooks/useEpisodeProgress";
import TvSeason from "./TvSeason";

jest.mock("../../helpers/useFetch");

const series = {
  id: 1399,
  name: "Game of Thrones",
  poster_path: "/series.jpg",
  backdrop_path: "/backdrop.jpg",
};

const season = {
  id: 3624,
  name: "Season 1",
  season_number: 1,
  air_date: "2011-04-17",
  overview: "The first season.",
  poster_path: "/season.jpg",
  episodes: [
    {
      id: 102,
      episode_number: 2,
      name: "The Kingsroad",
      air_date: "2011-04-24",
      runtime: 56,
      vote_average: 8.6,
      overview: "The journey begins.",
      still_path: "/episode-2.jpg",
    },
    {
      id: 101,
      episode_number: 1,
      name: "Winter Is Coming",
      air_date: "2011-04-17",
      runtime: 62,
      vote_average: 8.8,
      overview: "The story begins.",
      still_path: "/episode-1.jpg",
    },
  ],
};

const settledRequest = (data) => ({
  data,
  loading: false,
  error: false,
});

const routerFuture = {
  v7_relativeSplatPath: true,
  v7_startTransition: true,
};

const mockRequests = ({
  seriesRequest = settledRequest(series),
  seasonRequest = settledRequest(season),
} = {}) => {
  useFetch.mockImplementation((url) =>
    url.includes("/season/") ? seasonRequest : seriesRequest
  );
};

const renderSeason = (entry = "/tv/1399/season/1") =>
  render(
    <MemoryRouter initialEntries={[entry]} future={routerFuture}>
      <Routes>
        <Route
          path="/tv/:id/season/:seasonNumber"
          element={<TvSeason />}
        />
      </Routes>
    </MemoryRouter>
  );

describe("TvSeason", () => {
  beforeEach(() => {
    localStorage.clear();
    useFetch.mockReset();
  });

  it("loads the TV season route and renders episodes in broadcast order", () => {
    mockRequests();

    renderSeason();

    expect(useFetch).toHaveBeenCalledWith(
      expect.stringMatching(/^1399\?api_key=.*language=en-US$/),
      "tv"
    );
    expect(useFetch).toHaveBeenCalledWith(
      expect.stringMatching(/^1399\/season\/1\?api_key=.*language=en-US$/),
      "tv"
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Season 1" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to Game of Thrones" })
    ).toHaveAttribute("href", "/tv/1399");

    const episodeHeadings = screen.getAllByRole("heading", { level: 3 });
    expect(episodeHeadings.map((heading) => heading.textContent)).toEqual([
      "Winter Is Coming",
      "The Kingsroad",
    ]);
  });

  it("tracks individual episodes and whole-season progress locally", async () => {
    mockRequests();
    renderSeason();

    userEvent.click(
      screen.getByRole("button", {
        name: "Mark Winter Is Coming as watched",
      })
    );

    expect(
      screen.getByRole("button", {
        name: "Mark Winter Is Coming as unwatched",
      })
    ).toHaveAttribute("aria-pressed", "true");
    expect(JSON.parse(localStorage.getItem(EPISODE_PROGRESS_KEY))).toEqual({
      "1399:1": [1],
    });

    userEvent.click(
      screen.getByRole("button", { name: "Mark season watched" })
    );

    await waitFor(() => {
      expect(
        screen.getByRole("progressbar", {
          name: "Season 1 viewing progress",
        })
      ).toHaveAttribute("aria-valuenow", "2");
    });
    expect(JSON.parse(localStorage.getItem(EPISODE_PROGRESS_KEY))).toEqual({
      "1399:1": [1, 2],
    });
  });

  it("treats the season request as the only fatal request", () => {
    mockRequests({
      seriesRequest: {
        data: null,
        loading: false,
        error: new Error("series failed"),
      },
    });

    renderSeason();

    expect(
      screen.getByRole("heading", { name: "Season 1" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to Series" })
    ).toHaveAttribute("href", "/tv/1399");
  });

  it("renders loading, error, and empty episode states", () => {
    mockRequests({
      seasonRequest: { data: null, loading: true, error: false },
    });
    const view = renderSeason();

    expect(screen.getByRole("status")).toHaveTextContent("Loading season");

    mockRequests({
      seasonRequest: {
        data: null,
        loading: false,
        error: new Error("season failed"),
      },
    });
    view.rerender(
      <MemoryRouter
        initialEntries={["/tv/1399/season/1"]}
        future={routerFuture}
      >
        <Routes>
          <Route
            path="/tv/:id/season/:seasonNumber"
            element={<TvSeason />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Season could not be loaded"
    );

    mockRequests({
      seasonRequest: settledRequest({ ...season, episodes: [] }),
    });
    view.rerender(
      <MemoryRouter
        initialEntries={["/tv/1399/season/1"]}
        future={routerFuture}
      >
        <Routes>
          <Route
            path="/tv/:id/season/:seasonNumber"
            element={<TvSeason />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "No episodes listed"
    );
  });
});
