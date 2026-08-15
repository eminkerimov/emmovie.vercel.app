import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import useFetchMovies from "../../hooks/useFetchMovies";
import Search from "./Search";

jest.mock("../../hooks/useFetchMovies");
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
    setRequestState();
  });

  it("shows an empty prompt before a query is entered", () => {
    renderSearch();

    expect(
      screen.getByText(/enter a movie title to start searching/i)
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
    expect(fetchData).toHaveBeenCalledWith("GET", "/search/movie", {
      query: "Dune",
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
      screen.getByText(/no movies found for this title/i)
    ).toBeInTheDocument();
  });

  it("renders returned movies", async () => {
    setRequestState({
      data: {
        data: {
          results: [
            {
              id: 438631,
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
});
