import React from "react";
import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import useFetchMovies from "../../hooks/useFetchMovies";
import useRecentlyViewed from "../../hooks/useRecentlyViewed";
import useWatchlist from "../../hooks/useWatchlist";
import Home from "./Home";

jest.mock("../../hooks/useFetchMovies");
jest.mock("../../hooks/useRecentlyViewed");
jest.mock("../../hooks/useWatchlist");
jest.mock("../../components/Loading/Loading", () => () => (
  <div role="status">Loading</div>
));
jest.mock("../../components/MovieCard/MovieCard", () => ({ title }) => (
  <article data-testid="home-movie-card">{title}</article>
));

const createMovie = (id, title) => ({
  id,
  title,
  poster_path: `/${id}-poster.jpg`,
  backdrop_path: `/${id}-backdrop.jpg`,
  overview: `${title} overview`,
  vote_average: 8.2,
  release_date: "2025-01-01",
});

describe("Home discovery and library sections", () => {
  const trendingFetch = jest.fn();
  const catalogFetch = jest.fn();
  const recommendationsFetch = jest.fn();
  let hookCall;

  beforeEach(() => {
    hookCall = 0;
    trendingFetch.mockReset();
    catalogFetch.mockReset();
    recommendationsFetch.mockReset();

    trendingFetch.mockImplementation((method, endpoint) =>
      Promise.resolve({
        data: {
          results: [
            endpoint.endsWith("/week")
              ? createMovie(2, "Weekly Hero")
              : createMovie(1, "Daily Hero"),
          ],
        },
      })
    );
    catalogFetch.mockImplementation((method, endpoint) => {
      const movie =
        endpoint === "/movie/top_rated"
          ? createMovie(20, "Top Rated Movie")
          : endpoint === "/movie/upcoming"
          ? createMovie(30, "Upcoming Movie")
          : createMovie(10, "Popular Movie");

      return Promise.resolve({
        data: { results: [movie] },
      });
    });
    recommendationsFetch.mockResolvedValue({
      data: {
        results: [createMovie(40, "Recommended Movie")],
      },
    });

    const requestStates = [
      {
        data: undefined,
        loading: false,
        error: false,
        fetchData: trendingFetch,
      },
      {
        data: undefined,
        loading: false,
        error: false,
        fetchData: catalogFetch,
      },
      {
        data: undefined,
        loading: false,
        error: false,
        fetchData: recommendationsFetch,
      },
    ];

    useFetchMovies.mockImplementation(() => {
      const state = requestStates[hookCall % 3];
      hookCall += 1;
      return state;
    });
    useRecentlyViewed.mockReturnValue({
      recentlyViewed: [createMovie(50, "Recently Opened")],
    });
    useWatchlist.mockReturnValue({
      watchlist: [createMovie(60, "Saved Movie")],
      toggleWatchlist: jest.fn(),
      isInWatchlist: () => false,
    });
  });

  const renderHome = () =>
    render(
      <MemoryRouter
        future={{
          v7_relativeSplatPath: true,
          v7_startTransition: true,
        }}
      >
        <Home />
      </MemoryRouter>
    );

  it("loads trending and catalog data lazily and renders P3 sections", async () => {
    renderHome();

    expect(
      await screen.findByRole("heading", {
        name: "Daily Hero",
      })
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Popular Movie")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Recently viewed",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Recently Opened")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", {
        name: "Because you saved Saved Movie",
      })
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Recommended Movie")
    ).toBeInTheDocument();

    expect(catalogFetch).toHaveBeenCalledTimes(1);
    expect(catalogFetch).toHaveBeenCalledWith(
      "GET",
      "/movie/popular",
      { language: "en-US", page: 1 }
    );
    expect(screen.queryByText(/^0[123]$/)).not.toBeInTheDocument();

    userEvent.click(
      screen.getByRole("tab", { name: "Top Rated" })
    );

    expect(
      await screen.findByText("Top Rated Movie")
    ).toBeInTheDocument();
    expect(catalogFetch).toHaveBeenLastCalledWith(
      "GET",
      "/movie/top_rated",
      { language: "en-US", page: 1 }
    );

    userEvent.click(
      screen.getByRole("button", { name: "This week" })
    );

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: "Weekly Hero",
        })
      ).toBeInTheDocument()
    );
    expect(trendingFetch).toHaveBeenLastCalledWith(
      "GET",
      "/trending/movie/week",
      { language: "en-US" }
    );
  });
});
