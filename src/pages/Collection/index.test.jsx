import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import useWatchlist from "../../hooks/useWatchlist";
import useMovieCollection from "../Movie/useMovieCollection";
import Collection, { prepareCollectionMovies } from ".";

jest.mock("../Movie/useMovieCollection");
jest.mock("../../hooks/useWatchlist");
jest.mock("../../components/Loading/Loading", () => () => (
  <div role="status">Loading collection</div>
));
jest.mock("../../components/MovieCard/MovieCard", () => (props) => (
  <article
    data-testid="collection-movie"
    data-favorite={String(props.isFavorite)}
    data-watched={String(props.isWatched)}
  >
    <span>{props.title}</span>
    <button type="button" onClick={() => props.onToggleFavorite(props)}>
      Save {props.title}
    </button>
    <button type="button" onClick={() => props.onToggleWatched(props)}>
      Watch {props.title}
    </button>
  </article>
));

const collectionData = {
  id: 88,
  name: "The Story Collection",
  overview: "Three connected films.",
  poster_path: "/collection.jpg",
  backdrop_path: "/backdrop.jpg",
  parts: [
    { id: 2, title: "Second Story", release_date: "2022-06-01" },
    { id: 1, title: "First Story", release_date: "2019-04-10" },
    { id: 3, title: "Future Story", release_date: "" },
    { id: 1, title: "Duplicate Story", release_date: "2019-04-10" },
  ],
};

const renderCollection = () =>
  render(
    <MemoryRouter
      initialEntries={["/collection/88"]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route path="/collection/:id" element={<Collection />} />
      </Routes>
    </MemoryRouter>
  );

describe("Collection page", () => {
  const toggleWatchlist = jest.fn();
  const toggleWatched = jest.fn();

  beforeEach(() => {
    toggleWatchlist.mockReset();
    toggleWatched.mockReset();
    useMovieCollection.mockReturnValue({
      data: collectionData,
      loading: false,
      error: false,
    });
    useWatchlist.mockReturnValue({
      toggleWatchlist,
      toggleWatched,
      isInWatchlist: (movieId) => movieId === 1,
      isWatched: (movieId) => movieId === 2,
    });
  });

  it("loads the route collection and renders unique films chronologically", () => {
    renderCollection();

    expect(useMovieCollection).toHaveBeenCalledWith("88");
    expect(
      screen.getByRole("heading", { name: "The Story Collection", level: 1 })
    ).toBeInTheDocument();
    expect(document.title).toBe("The Story Collection | M-movie");
    expect(screen.getAllByTestId("collection-movie")).toHaveLength(3);
    const cards = screen.getAllByTestId("collection-movie");
    expect(within(cards[0]).getByText("First Story")).toBeInTheDocument();
    expect(within(cards[1]).getByText("Second Story")).toBeInTheDocument();
    expect(within(cards[2]).getByText("Future Story")).toBeInTheDocument();
    expect(screen.getAllByTestId("collection-movie")[0]).toHaveAttribute(
      "data-favorite",
      "true"
    );
    expect(screen.getAllByTestId("collection-movie")[1]).toHaveAttribute(
      "data-watched",
      "true"
    );

    userEvent.click(screen.getByRole("button", { name: "Save First Story" }));
    userEvent.click(screen.getByRole("button", { name: "Watch Second Story" }));

    expect(toggleWatchlist).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, title: "First Story" })
    );
    expect(toggleWatched).toHaveBeenCalledWith(
      expect.objectContaining({ id: 2, title: "Second Story" })
    );
  });

  it("exposes loading and request error states", () => {
    useMovieCollection.mockReturnValue({
      data: null,
      loading: true,
      error: false,
    });
    const { unmount } = renderCollection();

    expect(screen.getByRole("status")).toHaveTextContent("Loading collection");
    unmount();

    useMovieCollection.mockReturnValue({
      data: null,
      loading: false,
      error: new Error("Network error"),
    });
    renderCollection();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This collection could not be loaded"
    );
  });

  it("renders not-found and empty-catalogue states", () => {
    useMovieCollection.mockReturnValue({
      data: null,
      loading: false,
      error: false,
    });
    const { unmount } = renderCollection();

    expect(screen.getByRole("status")).toHaveTextContent("Collection not found");
    unmount();

    useMovieCollection.mockReturnValue({
      data: { ...collectionData, parts: [] },
      loading: false,
      error: false,
    });
    renderCollection();

    expect(screen.getByRole("status")).toHaveTextContent(
      "No films are listed yet"
    );
  });
});

describe("prepareCollectionMovies", () => {
  it("keeps undated films last and removes duplicate ids", () => {
    expect(prepareCollectionMovies(collectionData.parts).map(({ id }) => id)).toEqual([
      1, 2, 3,
    ]);
  });
});
