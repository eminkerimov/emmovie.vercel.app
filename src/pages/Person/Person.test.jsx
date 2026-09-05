import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import useWatchlist from "../../hooks/useWatchlist";
import Person from "./Person";

jest.mock("../../hooks/useWatchlist");
jest.mock("../../components/Loading/Loading", () => () => (
  <div role="status">Loading person</div>
));
jest.mock("../../components/MovieCard/MovieCard", () => ({ title, detailsPath }) => (
  <article
    data-testid={detailsPath ? "person-tv-card" : "person-movie-card"}
    data-details-path={detailsPath || ""}
  >
    {title}
  </article>
));

const longBiography = "A detailed career story. ".repeat(24).trim();

const personData = {
  id: 101,
  name: "Alex Morgan",
  biography: longBiography,
  birthday: "1980-04-18",
  place_of_birth: "London, England",
  known_for_department: "Acting",
  profile_path: "/hero.jpg",
  also_known_as: ["A. Morgan", "Alex M."],
  homepage: "https://example.com/alex",
  imdb_id: "nm0000101",
};

const castCredits = Array.from({ length: 13 }, (_, index) => ({
  id: index + 1,
  credit_id: `cast-${index + 1}`,
  title: `Movie ${index + 1}`,
  poster_path: `/movie-${index + 1}.jpg`,
  release_date: `${2010 + index}-01-01`,
  character: `Character ${index + 1}`,
  popularity: 13 - index,
  vote_average: 6 + index / 10,
  vote_count: 100 + index,
}));

const crewCredits = [
  {
    id: 99,
    credit_id: "crew-99",
    title: "Directed Movie",
    poster_path: "/directed.jpg",
    release_date: "2002-02-02",
    job: "Director",
  },
];

const photosData = {
  profiles: [
    { file_path: "/hero.jpg" },
    { file_path: "/portrait-one.jpg" },
    { file_path: "/portrait-two.jpg" },
  ],
};

const externalIdsData = {
  imdb_id: "nm0000101",
  instagram_id: "alexmorgan",
  twitter_id: "alex_morgan",
  facebook_id: "alex.morgan",
};

const createResponse = (data, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  json: jest.fn().mockResolvedValue(data),
});

const mockSuccessfulRequests = () => {
  global.fetch
    .mockResolvedValueOnce(createResponse(personData))
    .mockResolvedValueOnce(
      createResponse({ cast: castCredits, crew: crewCredits })
    )
    .mockResolvedValueOnce(createResponse(photosData))
    .mockResolvedValueOnce(createResponse(externalIdsData));
};

const renderPerson = () =>
  render(
    <MemoryRouter
      initialEntries={["/person/101"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/person/:id" element={<Person />} />
      </Routes>
    </MemoryRouter>
  );

describe("Person", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    useWatchlist.mockReturnValue({
      watchlist: [],
      toggleWatchlist: jest.fn(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders career highlights, profile facts, gallery, and filterable filmography", async () => {
    mockSuccessfulRequests();
    renderPerson();

    expect(
      await screen.findByRole("heading", { name: "Alex Morgan" })
    ).toBeInTheDocument();
    expect(screen.getByText("London, England")).toBeInTheDocument();
    expect(screen.getByText("2002–2022")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Known for" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /instagram/i })).toHaveAttribute(
      "href",
      "https://www.instagram.com/alexmorgan/"
    );
    expect(screen.getByRole("link", { name: "Open X profile" })).toHaveAttribute(
      "href",
      "https://x.com/alex_morgan"
    );
    expect(screen.getByRole("link", { name: /facebook/i })).toHaveAttribute(
      "href",
      "https://www.facebook.com/alex.morgan"
    );
    expect(screen.getByRole("link", { name: /official website/i })).toHaveAttribute(
      "href",
      "https://example.com/alex"
    );
    expect(
      screen.getByRole("link", { name: "Open X profile" })
    ).not.toHaveTextContent("X");

    const biography = screen.getByText(longBiography);
    const biographyButton = screen.getByRole("button", {
      name: /read full biography/i,
    });

    expect(biography).not.toHaveClass("is-expanded");
    userEvent.click(biographyButton);
    expect(biography).toHaveClass("is-expanded");
    expect(biographyButton).toHaveAttribute("aria-expanded", "true");

    const previousButton = screen.getByRole("button", {
      name: /previous portrait/i,
    });
    const nextButton = screen.getByRole("button", { name: /next portrait/i });

    expect(previousButton).toBeDisabled();
    expect(nextButton).toBeEnabled();
    expect(screen.getByRole("img", { name: /gallery portrait/i })).toHaveAttribute(
      "src",
      expect.stringContaining("/portrait-one.jpg")
    );

    const nextPortraitImage = within(
      screen.getByRole("button", { name: "Open portrait 2 fullscreen" })
    ).getByAltText("");
    const nextPortraitSource = nextPortraitImage.getAttribute("src");

    expect(nextPortraitImage).not.toHaveAttribute("srcset");

    userEvent.click(nextButton);

    expect(screen.getByRole("img", { name: /gallery portrait/i })).toHaveAttribute(
      "src",
      nextPortraitSource
    );
    expect(nextButton).toBeDisabled();

    const selectedPortraitButton = screen.getByRole("button", {
      name: "Open portrait 2 fullscreen",
    });
    userEvent.click(selectedPortraitButton);

    const lightbox = screen.getByRole("dialog", {
      name: /fullscreen portrait gallery/i,
    });
    expect(document.body).toHaveStyle({ overflow: "hidden" });
    expect(
      within(lightbox).getByRole("img", { name: /fullscreen portrait/i })
    ).toHaveAttribute("src", expect.stringContaining("/portrait-two.jpg"));

    fireEvent.keyDown(lightbox, { key: "ArrowLeft" });
    expect(
      within(lightbox).getByRole("img", { name: /fullscreen portrait/i })
    ).toHaveAttribute("src", expect.stringContaining("/portrait-one.jpg"));

    fireEvent.keyDown(lightbox, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(selectedPortraitButton).toHaveFocus();

    const filmography = screen.getByRole("region", { name: "Filmography" });

    expect(within(filmography).getAllByTestId("person-movie-card")).toHaveLength(
      12
    );
    userEvent.click(
      within(filmography).getByRole("button", { name: /show more work/i })
    );
    expect(within(filmography).getAllByTestId("person-movie-card")).toHaveLength(
      13
    );

    userEvent.selectOptions(
      within(filmography).getByLabelText("Sort"),
      "popular"
    );
    expect(
      within(filmography).getAllByTestId("person-movie-card")[0]
    ).toHaveTextContent("Movie 1");

    userEvent.selectOptions(
      within(filmography).getByLabelText("Decade"),
      "2020"
    );
    expect(within(filmography).getAllByTestId("person-movie-card")).toHaveLength(
      3
    );

    userEvent.click(within(filmography).getByRole("button", { name: "Crew" }));
    expect(within(filmography).getByLabelText("Media")).toHaveValue("all");
    expect(within(filmography).getByLabelText("Decade")).toHaveValue("all");
    expect(
      within(within(filmography).getByLabelText("Media")).getByRole("option", {
        name: "TV",
      })
    ).toBeDisabled();
    expect(within(filmography).getByText("Directed Movie")).toBeInTheDocument();
    expect(within(filmography).getByText("Director")).toBeInTheDocument();

    userEvent.click(
      within(filmography).getByRole("button", { name: "Acting" })
    );
    expect(within(filmography).getAllByTestId("person-movie-card")).toHaveLength(
      12
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/person/101/external_ids?"),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/person/101/combined_credits?"),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("normalizes television credits and filters the complete career by media type", async () => {
    const televisionCredit = {
      id: 501,
      credit_id: "tv-501",
      media_type: "tv",
      name: "Series One",
      poster_path: "/series-one.jpg",
      first_air_date: "2024-03-10",
      character: "Lead",
      popularity: 70,
      vote_average: 8.1,
      vote_count: 500,
    };
    const creditWithoutPoster = {
      id: 502,
      credit_id: "tv-502",
      media_type: "tv",
      name: "Archive Series",
      first_air_date: "2008-01-12",
      character: "Guest",
      popularity: 4,
    };

    global.fetch
      .mockResolvedValueOnce(createResponse(personData))
      .mockResolvedValueOnce(
        createResponse({
          cast: [...castCredits, televisionCredit, creditWithoutPoster],
          crew: crewCredits,
        })
      )
      .mockResolvedValueOnce(createResponse({ profiles: [] }))
      .mockResolvedValueOnce(createResponse({}));

    renderPerson();

    await screen.findByRole("heading", { name: "Alex Morgan" });
    const filmography = screen.getByRole("region", { name: "Filmography" });

    expect(
      within(filmography).queryByRole("group", { name: "Media type" })
    ).not.toBeInTheDocument();
    userEvent.selectOptions(within(filmography).getByLabelText("Media"), "tv");

    const televisionCards = within(filmography).getAllByTestId(
      "person-tv-card"
    );

    expect(televisionCards).toHaveLength(2);
    expect(televisionCards[0]).toHaveTextContent("Series One");
    expect(televisionCards[0]).toHaveAttribute(
      "data-details-path",
      "/movie/501?media=tv"
    );
    expect(within(filmography).getByText("Archive Series")).toBeInTheDocument();
    expect(within(filmography).queryByText("Movie 1")).not.toBeInTheDocument();
  });

  it("shows only future-dated credits as upcoming projects", async () => {
    const nextYear = new Date().getFullYear() + 1;
    const futureCredit = {
      id: 777,
      title: "Future Movie",
      poster_path: "/future.jpg",
      release_date: `${nextYear}-12-18`,
      character: "Lead",
      popularity: 999,
      vote_average: 0,
      vote_count: 0,
    };

    global.fetch
      .mockResolvedValueOnce(createResponse(personData))
      .mockResolvedValueOnce(
        createResponse({ cast: [...castCredits, futureCredit], crew: crewCredits })
      )
      .mockResolvedValueOnce(createResponse({ profiles: [] }))
      .mockResolvedValueOnce(createResponse({}));

    renderPerson();

    const upcomingSection = await screen.findByRole("region", {
      name: "Upcoming projects",
    });
    expect(
      within(upcomingSection).getByRole("link", { name: /future movie/i })
    ).toHaveAttribute("href", "/movie/777");

    const knownForSection = screen.getByRole("region", { name: "Known for" });
    expect(
      within(knownForSection).queryByText("Future Movie")
    ).not.toBeInTheDocument();
  });

  it("keeps the profile available when optional credits and images fail", async () => {
    global.fetch
      .mockResolvedValueOnce(createResponse(personData))
      .mockRejectedValueOnce(new Error("Credits unavailable"))
      .mockResolvedValueOnce(
        createResponse({}, { ok: false, status: 503 })
      )
      .mockRejectedValueOnce(new Error("External ids unavailable"));

    renderPerson();

    expect(
      await screen.findByRole("heading", { name: "Alex Morgan" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no credits are available/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Gallery" })
    ).not.toBeInTheDocument();
  });

  it("renders the error state when person details fail", async () => {
    global.fetch
      .mockResolvedValueOnce(
        createResponse({}, { ok: false, status: 500 })
      )
      .mockResolvedValueOnce(createResponse({ cast: [], crew: [] }))
      .mockResolvedValueOnce(createResponse({ profiles: [] }))
      .mockResolvedValueOnce(createResponse({}));

    renderPerson();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Person could not be loaded"
      );
    });
  });
});
