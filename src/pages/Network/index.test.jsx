import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import useFetchMovies from "../../hooks/useFetchMovies";
import useWatchlist from "../../hooks/useWatchlist";
import Network from ".";

jest.mock("../../hooks/useFetchMovies");
jest.mock("../../hooks/useWatchlist");
jest.mock("../../components/Loading/Loading", () => () => (
  <div role="status">Loading network</div>
));
jest.mock("../../components/MovieCard/MovieCard", () => (props) => (
  <article
    data-testid="network-series"
    data-media-type={props.media_type}
    data-favorite={String(props.isFavorite)}
    data-watched={String(props.isWatched)}
  >
    {props.name}
  </article>
));

const networkData = {
  id: 49,
  name: "HBO",
  headquarters: "New York City, New York",
  homepage: "https://www.hbo.com",
  origin_country: "US",
  logo_path: "/hbo.png",
};

const seriesData = {
  results: [
    {
      id: 1399,
      name: "Game of Thrones",
      first_air_date: "2011-04-17",
      backdrop_path: "/got.jpg",
    },
  ],
  total_results: 41,
  total_pages: 3,
};

const renderNetwork = () =>
  render(
    <MemoryRouter
      initialEntries={["/network/49"]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route path="/network/:id" element={<Network />} />
      </Routes>
    </MemoryRouter>
  );

describe("Network page", () => {
  const networkFetch = jest.fn();
  const seriesFetch = jest.fn();
  let networkState;
  let seriesState;
  let hookCall;

  beforeEach(() => {
    networkFetch.mockReset();
    seriesFetch.mockReset();
    seriesFetch.mockResolvedValue(undefined);
    hookCall = 0;
    networkState = {
      data: { data: networkData },
      loading: false,
      error: false,
      fetchData: networkFetch,
    };
    seriesState = {
      data: { data: seriesData },
      loading: false,
      error: false,
      fetchData: seriesFetch,
    };
    useFetchMovies.mockImplementation(() => {
      const state = hookCall % 2 === 0 ? networkState : seriesState;
      hookCall += 1;
      return state;
    });
    useWatchlist.mockReturnValue({
      toggleWatchlist: jest.fn(),
      toggleWatched: jest.fn(),
      isInWatchlist: (showId, mediaType) =>
        showId === 1399 && mediaType === "tv",
      isWatched: (showId, mediaType) =>
        showId === 1399 && mediaType === "tv",
    });
    window.requestAnimationFrame = jest.fn((callback) => {
      callback();
      return 1;
    });
  });

  it("loads network details and a paginated TV catalogue", () => {
    renderNetwork();

    expect(networkFetch).toHaveBeenCalledWith("GET", "/network/49", {});
    expect(seriesFetch).toHaveBeenCalledWith(
      "GET",
      "/discover/tv",
      expect.objectContaining({
        page: 1,
        sort_by: "popularity.desc",
        with_networks: "49",
      })
    );
    expect(
      screen.getByRole("heading", { name: "HBO", level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByText("United States")).toBeInTheDocument();
    expect(screen.getByTestId("network-series")).toHaveAttribute(
      "data-media-type",
      "tv"
    );
    expect(screen.getByTestId("network-series")).toHaveAttribute(
      "data-favorite",
      "true"
    );
    expect(screen.getByTestId("network-series")).toHaveAttribute(
      "data-watched",
      "true"
    );
  });

  it("requests the next catalogue page", async () => {
    renderNetwork();

    userEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() =>
      expect(seriesFetch).toHaveBeenLastCalledWith(
        "GET",
        "/discover/tv",
        expect.objectContaining({ page: 2, with_networks: "49" })
      )
    );
    expect(await screen.findByText("Page 2 of 3")).toBeInTheDocument();
  });

  it("renders network loading, error, and not-found states", () => {
    networkState = {
      ...networkState,
      data: undefined,
      loading: false,
    };
    const { unmount } = renderNetwork();

    expect(screen.getByRole("status")).toHaveTextContent("Loading network");
    unmount();

    hookCall = 0;
    networkState = {
      ...networkState,
      loading: false,
      error: new Error("Network error"),
    };
    const { unmount: unmountErrorView } = renderNetwork();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This TV network could not be loaded"
    );
    unmountErrorView();

    hookCall = 0;
    networkState = {
      ...networkState,
      data: { data: {} },
      error: false,
    };
    renderNetwork();

    expect(screen.getByRole("status")).toHaveTextContent(
      "TV network not found"
    );
  });

  it("keeps catalogue errors and empty results local", () => {
    seriesState = {
      ...seriesState,
      data: undefined,
      error: new Error("Discover unavailable"),
    };
    const { unmount } = renderNetwork();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Series catalogue could not be loaded"
    );
    expect(
      screen.getByRole("heading", { name: "HBO", level: 1 })
    ).toBeInTheDocument();
    unmount();

    hookCall = 0;
    seriesState = {
      ...seriesState,
      data: { data: { results: [], total_results: 0, total_pages: 0 } },
      error: false,
    };
    renderNetwork();

    expect(screen.getByRole("status")).toHaveTextContent(
      "No series are listed"
    );
  });
});
