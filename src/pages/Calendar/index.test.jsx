import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import useFetchMovies from "../../hooks/useFetchMovies";
import useWatchlist from "../../hooks/useWatchlist";
import Calendar from "./index";

jest.mock("../../hooks/useFetchMovies");
jest.mock("../../hooks/useWatchlist");
jest.mock("../../components/Loading/Loading", () => () => (
  <div role="status">Loading releases</div>
));
jest.mock("../../components/MovieCard/MovieCard", () => (props) => (
  <article
    data-testid="calendar-movie-card"
    data-favorite={String(props.isFavorite)}
    data-watched={String(props.isWatched)}
  >
    {props.title}
  </article>
));

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{location.search}</output>;
};

const movies = [
  {
    id: 1,
    title: "Monday Premiere",
    release_date: "2026-09-07",
    poster_path: "/monday.jpg",
  },
  {
    id: 2,
    title: "Wednesday Premiere",
    release_date: "2026-09-09",
    poster_path: "/wednesday.jpg",
  },
];

describe("Release Calendar", () => {
  const fetchData = jest.fn();
  const fetchCountries = jest.fn();

  const setFetchHookResults = (
    calendarOverrides = {},
    countriesOverrides = {}
  ) => {
    const calendarResult = {
      data: {
        data: {
          results: movies,
          total_results: 42,
          total_pages: 3,
        },
      },
      loading: false,
      error: false,
      fetchData,
      ...calendarOverrides,
    };
    const countriesResult = {
      data: {
        data: [
          { iso_3166_1: "US", english_name: "United States" },
          { iso_3166_1: "GB", english_name: "United Kingdom" },
          { iso_3166_1: "FR", english_name: "France" },
          { iso_3166_1: "SG", english_name: "Singapore" },
        ],
      },
      loading: false,
      error: false,
      fetchData: fetchCountries,
      ...countriesOverrides,
    };
    let hookCall = 0;

    useFetchMovies.mockImplementation(() => {
      const result = hookCall % 2 === 0 ? calendarResult : countriesResult;
      hookCall += 1;
      return result;
    });
  };

  beforeEach(() => {
    fetchData.mockReset();
    fetchCountries.mockReset();
    window.localStorage.clear();
    window.scrollTo = jest.fn();
    useWatchlist.mockReturnValue({
      toggleWatchlist: jest.fn(),
      toggleWatched: jest.fn(),
      isInWatchlist: (movieId) => movieId === 1,
      isWatched: (movieId) => movieId === 2,
    });
    setFetchHookResults();
  });

  const renderCalendar = (entry = "/calendar") =>
    render(
      <MemoryRouter
        initialEntries={[entry]}
        future={{
          v7_relativeSplatPath: true,
          v7_startTransition: true,
        }}
      >
        <Routes>
          <Route
            path="/calendar"
            element={
              <>
                <Calendar />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    );

  it("loads a regional week, groups releases by day, and keeps library states", () => {
    renderCalendar(
      "/calendar?week=2026-09-07&region=GB&type=theatrical&page=2"
    );

    expect(fetchData).toHaveBeenCalledWith("GET", "/discover/movie", {
      language: "en-US",
      page: 2,
      include_adult: false,
      include_video: false,
      region: "GB",
      sort_by: "primary_release_date.asc",
      "release_date.gte": "2026-09-07",
      "release_date.lte": "2026-09-13",
      with_release_type: "2|3",
    });
    expect(
      screen.getByRole("heading", {
        name: "Monday, September 7, 2026",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Wednesday, September 9, 2026",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Monday Premiere")).toHaveAttribute(
      "data-favorite",
      "true"
    );
    expect(screen.getByText("Wednesday Premiere")).toHaveAttribute(
      "data-watched",
      "true"
    );
    expect(document.title).toBe("Release Calendar | M-movie");
    expect(fetchCountries).toHaveBeenCalledWith(
      "GET",
      "/configuration/countries",
      { language: "en-US" }
    );
  });

  it("uses every TMDB country and sorts the region names", () => {
    setFetchHookResults({}, {
      data: {
        data: [
          { iso_3166_1: "ZW", english_name: "Zimbabwe" },
          { iso_3166_1: "NZ", english_name: "New Zealand" },
          { iso_3166_1: "AD", english_name: "Andorra" },
        ],
      },
    });

    renderCalendar("/calendar?week=2026-09-07&region=NZ");

    expect(
      screen
        .getAllByRole("option")
        .map((option) => option.textContent)
    ).toEqual(["Andorra", "New Zealand", "Zimbabwe"]);
    expect(
      screen.getByRole("heading", { name: "New Zealand releases" })
    ).toBeInTheDocument();
  });

  it("keeps valid URL and saved region codes while countries load", () => {
    setFetchHookResults({}, {
      data: undefined,
      loading: true,
    });

    const { unmount } = renderCalendar(
      "/calendar?week=2026-09-07&region=NZ"
    );
    const urlRegionSelect = screen.getByRole("combobox", {
      name: "Release region",
    });

    expect(urlRegionSelect).toHaveValue("NZ");
    expect(screen.getByRole("option", { name: "NZ" })).toBeInTheDocument();
    expect(screen.getByText("Loading all TMDB regions…")).toBeInTheDocument();
    expect(fetchData).toHaveBeenCalledWith(
      "GET",
      "/discover/movie",
      expect.objectContaining({ region: "NZ" })
    );
    unmount();

    window.localStorage.setItem("emmovie_movie_region", "az");
    setFetchHookResults({}, {
      data: undefined,
      loading: true,
    });
    renderCalendar("/calendar?week=2026-09-07");

    expect(
      screen.getByRole("combobox", { name: "Release region" })
    ).toHaveValue("AZ");
  });

  it("uses a broad fallback list only when TMDB countries fail", () => {
    setFetchHookResults({}, {
      data: undefined,
      loading: false,
      error: new Error("Countries unavailable"),
    });

    renderCalendar("/calendar?week=2026-09-07&region=ZA");

    expect(
      screen.getByRole("option", { name: "South Africa" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/using fallback regions/i)
    ).toBeInTheDocument();
  });

  it("keeps week, region, release type, and pagination in the URL", async () => {
    renderCalendar("/calendar?week=2026-09-07&region=GB");

    userEvent.click(screen.getByRole("button", { name: "Next week" }));

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "week=2026-09-14"
      )
    );

    userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Release region" }),
      "FR"
    );
    userEvent.click(screen.getByRole("button", { name: "Digital" }));
    userEvent.click(screen.getByRole("button", { name: /next$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("region=FR");
    });
    expect(screen.getByTestId("location")).toHaveTextContent("type=digital");
    expect(screen.getByTestId("location")).toHaveTextContent("page=2");
    expect(window.localStorage.getItem("emmovie_movie_region")).toBe("FR");
  });

  it("uses current regional provider availability for streaming releases", () => {
    renderCalendar(
      "/calendar?week=2026-09-07&region=SG&type=streaming"
    );

    expect(fetchData).toHaveBeenCalledWith(
      "GET",
      "/discover/movie",
      expect.objectContaining({
        region: "SG",
        watch_region: "SG",
        with_watch_monetization_types: "flatrate",
        "release_date.gte": "2026-09-07",
        "release_date.lte": "2026-09-13",
      })
    );
    expect(
      screen.getByText(/streaming filters current subscription availability/i)
    ).toBeInTheDocument();
  });

  it("renders loading, error with retry, and empty states", () => {
    setFetchHookResults({
      data: undefined,
      loading: true,
      error: false,
      fetchData,
    });
    const { unmount } = renderCalendar("/calendar?week=2026-09-07");
    expect(screen.getByText("Loading releases")).toBeInTheDocument();
    unmount();
    fetchData.mockClear();

    setFetchHookResults({
      data: undefined,
      loading: false,
      error: new Error("Network error"),
      fetchData,
    });
    const { unmount: unmountErrorView } = renderCalendar(
      "/calendar?week=2026-09-07"
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Release dates could not be loaded"
    );
    userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(fetchData).toHaveBeenCalledTimes(2);
    unmountErrorView();

    setFetchHookResults({
      data: { data: { results: [], total_results: 0, total_pages: 0 } },
      loading: false,
      error: false,
      fetchData,
    });
    renderCalendar("/calendar?week=2026-09-07");
    expect(screen.getByText("No releases listed for this week")).toBeInTheDocument();
  });
});
