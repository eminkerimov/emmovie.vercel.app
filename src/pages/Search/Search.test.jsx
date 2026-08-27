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
import Search from "./Search";

jest.mock("../../hooks/useFetchMovies");
jest.mock("../../hooks/useWatchlist");
jest.mock("../../components/Loading/Loading", () => () => (
  <div role="status" aria-label="Loading movies">
    Loading movies
  </div>
));
jest.mock("../../components/MovieCard/MovieCard", () => ({ title }) => (
  <article data-testid="search-result">{title}</article>
));

const fetchData = jest.fn();

const LocationProbe = () => {
  const location = useLocation();

  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
};

const renderSearch = (entry = "/search") =>
  render(
    <MemoryRouter
      initialEntries={[entry]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/search"
          element={
            <>
              <Search />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );

const setRequestState = ({ data, loading = false, error = false } = {}) => {
  useFetchMovies.mockReturnValue({ data, loading, error, fetchData });
};

describe("Search", () => {
  beforeEach(() => {
    fetchData.mockReset();
    localStorage.clear();
    useWatchlist.mockReturnValue({
      toggleWatchlist: jest.fn(),
      isInWatchlist: () => false,
    });
    setRequestState();
  });

  it("shows an empty prompt before a query is entered", () => {
    renderSearch();

    expect(
      screen.getByText(
        /enter a movie title or person name to start searching/i
      )
    ).toBeInTheDocument();
    expect(fetchData).not.toHaveBeenCalled();
  });

  it("updates the URL and starts a search from the form", async () => {
    renderSearch();

    userEvent.type(screen.getByRole("searchbox"), "Dune");
    userEvent.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/search?q=Dune"
      );
    });
    expect(fetchData).toHaveBeenCalledWith("GET", "/search/multi", {
      query: "Dune",
      include_adult: false,
      language: "en-US",
      page: 1,
    });
  });

  it("renders the loading state", () => {
    setRequestState({ loading: true });

    renderSearch("/search?q=Dune");

    expect(
      screen.getByRole("status", { name: /loading movies/i })
    ).toBeInTheDocument();
  });

  it("renders the error state", () => {
    setRequestState({ error: new Error("Network error") });

    renderSearch("/search?q=Dune");

    expect(screen.getByText(/search failed\. try again/i)).toBeInTheDocument();
  });

  it("renders the no-results state", () => {
    setRequestState({ data: { data: { results: [] } } });

    renderSearch("/search?q=Unknown");

    expect(
      screen.getByText(/no supported results found on this page/i)
    ).toBeInTheDocument();
  });

  it("renders returned movies", async () => {
    setRequestState({
      data: {
        data: {
          results: [
            {
              id: 438631,
              media_type: "movie",
              title: "Dune",
              release_date: "2021-09-15",
            },
          ],
        },
      },
    });

    renderSearch("/search?q=Dune");

    expect(await screen.findByTestId("search-result")).toHaveTextContent(
      "Dune"
    );
  });

  it("uses a type-specific endpoint and keeps the filter in the URL", async () => {
    setRequestState({
      data: {
        data: {
          results: [
            {
              id: 1892,
              name: "Matt Damon",
              known_for_department: "Acting",
            },
          ],
          total_pages: 1,
          total_results: 1,
        },
      },
    });

    renderSearch("/search?q=Matt&type=person");

    expect(
      await screen.findByRole("heading", {
        name: "Matt Damon",
      })
    ).toBeInTheDocument();
    expect(fetchData).toHaveBeenCalledWith(
      "GET",
      "/search/person",
      expect.objectContaining({
        query: "Matt",
        page: 1,
      })
    );
    expect(screen.getByTestId("location")).toHaveTextContent(
      "type=person"
    );
  });

  it("writes the server page to the URL", async () => {
    setRequestState({
      data: {
        data: {
          results: [
            {
              id: 438631,
              media_type: "movie",
              title: "Dune",
            },
          ],
          total_pages: 3,
          total_results: 50,
        },
      },
    });
    window.scrollTo = jest.fn();

    renderSearch("/search?q=Dune");
    userEvent.click(
      await screen.findByRole("button", { name: /next/i })
    );

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "page=2"
      )
    );
    expect(fetchData).toHaveBeenLastCalledWith(
      "GET",
      "/search/multi",
      expect.objectContaining({ page: 2 })
    );
  });
});
