import { fireEvent, render, screen } from "@testing-library/react";
import MovieAvailability, {
  MOVIE_REGION_STORAGE_KEY,
} from "./MovieAvailability";

jest.mock("../../hooks/useReveal", () => () => ({
  elementRef: { current: null },
  isVisible: true,
}));

const providersRequest = {
  data: {
    results: {
      US: {
        link: "https://www.themoviedb.org/movie/10/watch",
        flatrate: [
          {
            logo_path: "/stream.jpg",
            provider_id: 8,
            provider_name: "Stream Service",
          },
        ],
        rent: [
          {
            logo_path: "/rent.jpg",
            provider_id: 9,
            provider_name: "Rental Store",
          },
        ],
      },
    },
  },
  error: false,
  loading: false,
};

const releaseDatesRequest = {
  data: {
    results: [
      {
        iso_3166_1: "US",
        release_dates: [
          {
            certification: "R",
            release_date: "2024-05-03T00:00:00.000Z",
            type: 3,
          },
        ],
      },
    ],
  },
  error: false,
  loading: false,
};

describe("MovieAvailability", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(MOVIE_REGION_STORAGE_KEY, "US");
  });

  it("shows providers, JustWatch attribution, and regional release data", () => {
    render(
      <MovieAvailability
        providersRequest={providersRequest}
        releaseDatesRequest={releaseDatesRequest}
      />
    );

    expect(
      screen.getByRole("region", { name: "Watch & release" })
    ).toBeInTheDocument();
    expect(screen.getByText("Stream Service")).toBeInTheDocument();
    expect(screen.getByText("Rental Store")).toBeInTheDocument();
    expect(
      screen.getByText(/availability data supplied by justwatch via tmdb/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /see all options on tmdb/i })
    ).toHaveAttribute(
      "href",
      "https://www.themoviedb.org/movie/10/watch"
    );
    expect(screen.getByText("R")).toBeInTheDocument();
    expect(screen.getByText("Theatrical")).toBeInTheDocument();
    expect(screen.getByText("3 May 2024")).toBeInTheDocument();
  });

  it("persists a region change and keeps unavailable data local", () => {
    render(
      <MovieAvailability
        providersRequest={providersRequest}
        releaseDatesRequest={releaseDatesRequest}
      />
    );

    fireEvent.change(
      screen.getByRole("combobox", { name: "Availability region" }),
      { target: { value: "CA" } }
    );

    expect(window.localStorage.getItem(MOVIE_REGION_STORAGE_KEY)).toBe("CA");
    expect(
      screen.getByText(/no streaming, rental, or purchase options/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no regional release details are listed/i)
    ).toBeInTheDocument();
  });

  it("reports optional provider and release failures independently", () => {
    render(
      <MovieAvailability
        providersRequest={{ data: null, error: new Error("providers"), loading: false }}
        releaseDatesRequest={{ data: null, error: new Error("release"), loading: false }}
      />
    );

    expect(
      screen.getByText(/streaming options are temporarily unavailable/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/regional release information is temporarily unavailable/i)
    ).toBeInTheDocument();
  });
});
