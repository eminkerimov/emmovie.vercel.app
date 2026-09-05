import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import useFetchMovies from "../../hooks/useFetchMovies";
import useWatchlist from "../../hooks/useWatchlist";
import Company from ".";

jest.mock("../../hooks/useFetchMovies");
jest.mock("../../hooks/useWatchlist");
jest.mock("../../components/Loading/Loading", () => () => (
  <div role="status">Loading company</div>
));
jest.mock("../../components/MovieCard/MovieCard", () => (props) => (
  <article
    data-testid="company-movie"
    data-favorite={String(props.isFavorite)}
    data-watched={String(props.isWatched)}
  >
    {props.title}
  </article>
));

const companyData = {
  id: 41077,
  name: "Northlight Pictures",
  description: "An independent production company.",
  headquarters: "London, England",
  homepage: "https://example.com/studio",
  origin_country: "GB",
  logo_path: "/logo.png",
  parent_company: { id: 42, name: "Northlight Group" },
};

const movieData = {
  results: [
    {
      id: 10,
      title: "The First Feature",
      release_date: "2024-02-01",
      backdrop_path: "/feature.jpg",
    },
  ],
  total_results: 41,
  total_pages: 3,
};

const renderCompany = () =>
  render(
    <MemoryRouter
      initialEntries={["/company/41077"]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route path="/company/:id" element={<Company />} />
      </Routes>
    </MemoryRouter>
  );

describe("Company page", () => {
  const companyFetch = jest.fn();
  const moviesFetch = jest.fn();
  let companyState;
  let moviesState;
  let hookCall;

  beforeEach(() => {
    companyFetch.mockReset();
    moviesFetch.mockReset();
    hookCall = 0;
    companyState = {
      data: { data: companyData },
      loading: false,
      error: false,
      fetchData: companyFetch,
    };
    moviesState = {
      data: { data: movieData },
      loading: false,
      error: false,
      fetchData: moviesFetch,
    };
    useFetchMovies.mockImplementation(() => {
      const state = hookCall % 2 === 0 ? companyState : moviesState;
      hookCall += 1;
      return state;
    });
    useWatchlist.mockReturnValue({
      toggleWatchlist: jest.fn(),
      toggleWatched: jest.fn(),
      isInWatchlist: (movieId) => movieId === 10,
      isWatched: (movieId) => movieId === 10,
    });
    window.requestAnimationFrame = jest.fn((callback) => {
      callback();
      return 1;
    });
  });

  it("loads company details and its paginated film catalogue", () => {
    renderCompany();

    expect(companyFetch).toHaveBeenCalledWith("GET", "/company/41077", {});
    expect(moviesFetch).toHaveBeenCalledWith(
      "GET",
      "/discover/movie",
      expect.objectContaining({
        page: 1,
        sort_by: "popularity.desc",
        with_companies: "41077",
      })
    );
    expect(
      screen.getByRole("heading", { name: "Northlight Pictures", level: 1 })
    ).toBeInTheDocument();
    expect(document.title).toBe("Northlight Pictures | M-movie");
    expect(screen.getByRole("link", { name: /Northlight Group/i })).toHaveAttribute(
      "href",
      "/company/42"
    );
    expect(screen.getByTestId("company-movie")).toHaveAttribute(
      "data-favorite",
      "true"
    );
    expect(screen.getByTestId("company-movie")).toHaveAttribute(
      "data-watched",
      "true"
    );
  });

  it("requests the next server page from pagination", async () => {
    renderCompany();

    userEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    await waitFor(() =>
      expect(moviesFetch).toHaveBeenLastCalledWith(
        "GET",
        "/discover/movie",
        expect.objectContaining({ page: 2, with_companies: "41077" })
      )
    );
  });

  it("renders company loading, error, and not-found states", () => {
    companyState = {
      ...companyState,
      data: undefined,
      loading: true,
    };
    const { unmount } = renderCompany();

    expect(screen.getByRole("status")).toHaveTextContent("Loading company");
    unmount();

    hookCall = 0;
    companyState = {
      ...companyState,
      loading: false,
      error: new Error("Network error"),
    };
    const { unmount: unmountErrorView } = renderCompany();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This company could not be loaded"
    );
    unmountErrorView();

    hookCall = 0;
    companyState = {
      ...companyState,
      data: { data: {} },
      error: false,
    };
    renderCompany();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Production company not found"
    );
  });

  it("keeps film errors and empty results local to the catalogue", () => {
    moviesState = {
      ...moviesState,
      data: undefined,
      error: new Error("Discover unavailable"),
    };
    const { unmount } = renderCompany();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Film catalogue could not be loaded"
    );
    expect(
      screen.getByRole("heading", { name: "Northlight Pictures", level: 1 })
    ).toBeInTheDocument();
    unmount();

    hookCall = 0;
    moviesState = {
      ...moviesState,
      data: { data: { results: [], total_results: 0, total_pages: 0 } },
      error: false,
    };
    renderCompany();

    expect(screen.getByRole("status")).toHaveTextContent("No films are listed");
  });
});
