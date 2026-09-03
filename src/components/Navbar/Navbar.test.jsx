import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import useFetchMovies from "../../hooks/useFetchMovies";
import Navbar from "./Navbar";

jest.mock("../../hooks/useFetchMovies");

const LocationProbe = () => {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
};

const renderNavbar = () =>
  render(
    <MemoryRouter
      initialEntries={["/"]}
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <Navbar />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );

describe("Navbar universal search", () => {
  const fetchData = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    fetchData.mockClear();
    useFetchMovies.mockReturnValue({
      data: {
        data: {
          results: [
            {
              id: 550,
              media_type: "movie",
              title: "Fight Club",
              release_date: "1999-10-15",
              vote_average: 8.4,
              poster_path: "/fight.jpg",
            },
            {
              id: 1892,
              media_type: "person",
              name: "Matt Damon",
              known_for_department: "Acting",
              profile_path: "/matt.jpg",
            },
            {
              id: 99,
              media_type: "tv",
              name: "TV result",
            },
          ],
        },
      },
      loading: false,
      error: false,
      fetchData,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("searches movies and people and supports keyboard selection", () => {
    renderNavbar();

    const search = screen.getByRole("combobox", {
      name: /search movies and people/i,
    });
    userEvent.type(search, "matt");

    act(() => {
      jest.advanceTimersByTime(450);
    });

    expect(fetchData).toHaveBeenCalledWith(
      "GET",
      "/search/multi",
      expect.objectContaining({ query: "matt" })
    );
    expect(
      screen.getByRole("option", { name: /matt damon/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByText("TV result")
    ).not.toBeInTheDocument();

    fireEvent.keyDown(search, { key: "ArrowDown" });
    fireEvent.keyDown(search, { key: "ArrowDown" });
    fireEvent.keyDown(search, { key: "Enter" });

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/person/1892"
    );
  });

  it("shows Watchlist without an ambiguous shared count", () => {
    renderNavbar();

    const watchlistLink = screen.getByRole("link", {
      name: "Watchlist",
    });

    expect(watchlistLink).toBeInTheDocument();
    expect(watchlistLink).not.toHaveTextContent("2");
  });
});
