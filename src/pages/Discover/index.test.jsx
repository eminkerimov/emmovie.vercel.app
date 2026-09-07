import React from "react";
import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import useFetchMovies from "../../hooks/useFetchMovies";
import useWatchlist from "../../hooks/useWatchlist";
import Discover from "./index";

jest.mock("../../hooks/useFetchMovies");
jest.mock("../../hooks/useWatchlist");
jest.mock("../../components/Loading/Loading", () => () => (
  <div role="status">Loading</div>
));
jest.mock(
  "../../components/MovieCard/MovieCard",
  () => ({ title, name, media_type }) => (
    <article data-testid="discover-card" data-media-type={media_type}>
      {title || name}
    </article>
  )
);

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{location.search}</output>;
};

describe("Discover URL filters", () => {
  const discoverFetch = jest.fn();
  const genresFetch = jest.fn();
  const providersFetch = jest.fn();
  let hookCall;

  beforeEach(() => {
    hookCall = 0;
    discoverFetch.mockReset();
    genresFetch.mockReset();
    providersFetch.mockReset();
    window.scrollTo = jest.fn();
    useWatchlist.mockReturnValue({
      toggleWatchlist: jest.fn(),
      isInWatchlist: () => false,
    });

    const requestStates = [
      {
        data: {
          data: {
            results: [
              {
                id: 1,
                title: "Filtered movie",
                poster_path: "/poster.jpg",
              },
            ],
            total_results: 60,
            total_pages: 6,
          },
        },
        loading: false,
        error: false,
        fetchData: discoverFetch,
      },
      {
        data: {
          data: {
            genres: [
              { id: 28, name: "Action" },
              { id: 18, name: "Drama" },
              { id: 878, name: "Science Fiction" },
            ],
          },
        },
        loading: false,
        error: false,
        fetchData: genresFetch,
      },
      {
        data: {
          data: {
            results: [
              {
                provider_id: 8,
                provider_name: "Netflix",
                display_priorities: { GB: 1 },
              },
              {
                provider_id: 337,
                provider_name: "Disney Plus",
                display_priorities: { GB: 2 },
              },
            ],
          },
        },
        loading: false,
        error: false,
        fetchData: providersFetch,
      },
    ];

    useFetchMovies.mockImplementation(() => {
      const state = requestStates[hookCall % 3];
      hookCall += 1;
      return state;
    });
  });

  const renderDiscover = (entry) =>
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
            path="/discover"
            element={
              <>
                <Discover />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    );

  it("hydrates advanced filters from the URL and sends them to TMDB", () => {
    renderDiscover(
      "/discover?genres=28,18&from=2020-01-01&runtimeMin=90&language=fr&region=GB&provider=8&monetization=flatrate&page=3"
    );

    expect(screen.getByLabelText("Action")).toBeChecked();
    expect(screen.getByLabelText("Drama")).toBeChecked();
    expect(screen.getByLabelText("Original language")).toHaveValue(
      "fr"
    );
    expect(screen.getByLabelText("Streaming provider")).toHaveValue(
      "8"
    );

    expect(discoverFetch).toHaveBeenCalledWith(
      "GET",
      "/discover/movie",
      expect.objectContaining({
        page: 3,
        with_genres: "28,18",
        "primary_release_date.gte": "2020-01-01",
        "with_runtime.gte": "90",
        with_original_language: "fr",
        watch_region: "GB",
        with_watch_providers: "8",
        with_watch_monetization_types: "flatrate",
      })
    );
    expect(genresFetch).toHaveBeenCalledWith(
      "GET",
      "/genre/movie/list",
      { language: "en-US" }
    );
    expect(providersFetch).toHaveBeenCalledWith(
      "GET",
      "/watch/providers/movie",
      {
        language: "en-US",
        watch_region: "GB",
      }
    );
  });

  it("keeps server pagination in the URL", async () => {
    renderDiscover("/discover?genres=28&page=3");

    userEvent.click(
      screen.getByRole("button", { name: /next/i })
    );

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "page=4"
      )
    );
    expect(discoverFetch).toHaveBeenLastCalledWith(
      "GET",
      "/discover/movie",
      expect.objectContaining({
        page: 4,
        with_genres: "28",
      })
    );
  });

  it("uses TV endpoints, TV date parameters, and a supported TV sort", () => {
    renderDiscover(
      "/discover?media=tv&year=2024&from=2024-01-01&to=2024-12-31&sort=revenue.desc&region=GB"
    );

    expect(
      screen.getByRole("button", { name: "TV series" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("discover-card")).toHaveAttribute(
      "data-media-type",
      "tv"
    );
    expect(genresFetch).toHaveBeenCalledWith(
      "GET",
      "/genre/tv/list",
      { language: "en-US" }
    );
    expect(providersFetch).toHaveBeenCalledWith(
      "GET",
      "/watch/providers/tv",
      {
        language: "en-US",
        watch_region: "GB",
      }
    );
    expect(discoverFetch).toHaveBeenCalledWith(
      "GET",
      "/discover/tv",
      expect.objectContaining({
        sort_by: "popularity.desc",
        first_air_date_year: "2024",
        "first_air_date.gte": "2024-01-01",
        "first_air_date.lte": "2024-12-31",
      })
    );

    const tvParams = discoverFetch.mock.calls.find(
      ([, endpoint]) => endpoint === "/discover/tv"
    )[2];

    expect(tvParams).not.toHaveProperty("include_video");
    expect(tvParams).not.toHaveProperty("primary_release_year");
    expect(tvParams).not.toHaveProperty("primary_release_date.gte");
    expect(tvParams).not.toHaveProperty("primary_release_date.lte");
  });
});
