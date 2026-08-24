import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import useWatchlist from "../../hooks/useWatchlist";
import Person from "./Person";

jest.mock("../../hooks/useWatchlist");
jest.mock("../../components/Loading/Loading", () => () => (
  <div role="status">Loading person</div>
));
jest.mock("../../components/MovieCard/MovieCard", () => ({ title }) => (
  <article data-testid="person-movie-card">{title}</article>
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
    .mockResolvedValueOnce(createResponse(photosData));
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

  it("renders a compact biography, profile facts, gallery, and filmography controls", async () => {
    mockSuccessfulRequests();
    renderPerson();

    expect(
      await screen.findByRole("heading", { name: "Alex Morgan" })
    ).toBeInTheDocument();
    expect(screen.getByText("London, England")).toBeInTheDocument();
    expect(screen.getByText("2002–2022")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();

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
      screen.getByRole("button", { name: "Show portrait 2" })
    ).getByAltText("");
    const nextPortraitSource = nextPortraitImage.getAttribute("src");

    expect(nextPortraitImage).not.toHaveAttribute("srcset");

    userEvent.click(nextButton);

    expect(screen.getByRole("img", { name: /gallery portrait/i })).toHaveAttribute(
      "src",
      nextPortraitSource
    );
    expect(nextButton).toBeDisabled();

    expect(screen.getAllByTestId("person-movie-card")).toHaveLength(12);
    userEvent.click(screen.getByRole("button", { name: /show more work/i }));
    expect(screen.getAllByTestId("person-movie-card")).toHaveLength(13);

    userEvent.click(screen.getByRole("button", { name: "Crew" }));
    expect(screen.getByText("Directed Movie")).toBeInTheDocument();
    expect(screen.getByText("Director")).toBeInTheDocument();
  });

  it("keeps the profile available when optional credits and images fail", async () => {
    global.fetch
      .mockResolvedValueOnce(createResponse(personData))
      .mockRejectedValueOnce(new Error("Credits unavailable"))
      .mockResolvedValueOnce(
        createResponse({}, { ok: false, status: 503 })
      );

    renderPerson();

    expect(
      await screen.findByRole("heading", { name: "Alex Morgan" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no movie credits are available/i)
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
      .mockResolvedValueOnce(createResponse({ profiles: [] }));

    renderPerson();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Person could not be loaded"
      );
    });
  });
});
