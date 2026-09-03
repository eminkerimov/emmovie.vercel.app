import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import useFetch from "../../helpers/useFetch";
import useWatchlist from "../../hooks/useWatchlist";
import useRecentlyViewed from "../../hooks/useRecentlyViewed";
import Movie from "./Movie";
import useMovieCollection from "./useMovieCollection";

jest.mock("../../helpers/useFetch");
jest.mock("../../hooks/useWatchlist");
jest.mock("../../hooks/useRecentlyViewed");
jest.mock("./useMovieCollection");
jest.mock("../../components/Loading/Loading", () => () => (
  <div>Movie loading</div>
));
jest.mock("../../components/MovieMain/MovieMain", () => (props) => (
  <div data-testid="movie-main">{props.data.title}</div>
));
jest.mock("../../components/Overview/Overview", () => () => (
  <div>Overview section</div>
));
jest.mock("./MovieAvailability", () => ({ providersRequest }) => (
  <div data-testid="availability-state">
    {providersRequest.error ? "providers failed" : "providers ready"}
  </div>
));
jest.mock("../../components/Posters/Posters", () => ({ error }) => (
  <div>{error ? "posters failed" : "posters ready"}</div>
));
jest.mock("../../components/Reviews/Reviews", () => ({ error }) => (
  <div>{error ? "reviews failed" : "reviews ready"}</div>
));
jest.mock("./MovieCollection", () => () => <div>Collection section</div>);
jest.mock("../../components/Related/Related", () => ({ mode }) => (
  <div>Related mode: {mode}</div>
));

const settledRequest = (data = {}) => ({
  data,
  error: false,
  loading: false,
});

const renderMovie = () =>
  render(
    <MemoryRouter
      initialEntries={["/movie/42"]}
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <Routes>
        <Route path="/movie/:id" element={<Movie />} />
      </Routes>
    </MemoryRouter>
  );

describe("Movie", () => {
  beforeEach(() => {
    useRecentlyViewed.mockReturnValue({
      addRecentlyViewed: jest.fn(),
      recentlyViewed: [],
    });
    useWatchlist.mockReturnValue({
      getWatchlistMeta: jest.fn(() => ({
        status: "want",
      })),
      setWatchlist: jest.fn(),
      toggleWatchlist: jest.fn(),
      toggleWatched: jest.fn(),
      updateWatchlistMeta: jest.fn(),
      isWatched: jest.fn(() => false),
      watchlist: [],
    });
    useMovieCollection.mockReturnValue(settledRequest(null));
  });

  it("uses only the core movie request for the fatal loading state", () => {
    useFetch.mockImplementation((url) => {
      if (/^42\?/.test(url)) {
        return { data: null, error: false, loading: true };
      }

      return settledRequest();
    });

    renderMovie();

    expect(screen.getByText("Movie loading")).toBeInTheDocument();
    expect(screen.queryByTestId("movie-main")).not.toBeInTheDocument();
  });

  it("keeps the movie usable when optional requests fail", () => {
    useFetch.mockImplementation((url) => {
      if (/^42\?/.test(url)) {
        return settledRequest({
          id: 42,
          title: "Core Movie",
          genres: [],
          production_companies: [],
          production_countries: [],
        });
      }

      return { data: null, error: new Error(`Failed: ${url}`), loading: false };
    });

    renderMovie();

    expect(screen.getByTestId("movie-main")).toHaveTextContent("Core Movie");
    expect(
      screen.queryByRole("heading", { name: /movie could not be loaded/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText("providers failed")).toBeInTheDocument();
    expect(screen.getByText("posters failed")).toBeInTheDocument();
    expect(screen.getByText("reviews failed")).toBeInTheDocument();
  });

  it("treats a core request failure as fatal", () => {
    useFetch.mockImplementation((url) =>
      /^42\?/.test(url)
        ? { data: null, error: new Error("core"), loading: false }
        : settledRequest()
    );

    renderMovie();

    expect(
      screen.getByRole("heading", { name: "Movie could not be loaded" })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("movie-main")).not.toBeInTheDocument();
  });
});
