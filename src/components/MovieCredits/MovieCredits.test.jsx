import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import MovieCredits from "./MovieCredits";

const renderCredits = (request) =>
  render(
    <MemoryRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <MovieCredits request={request} />
    </MemoryRouter>
  );

const settledRequest = {
  error: false,
  loading: false,
  data: {
    cast: [
      { id: 1, name: "Lead Actor", character: "The Lead", order: 0 },
      { id: 2, name: "Second Actor", character: "The Friend", order: 1 },
    ],
    crew: [
      { id: 3, name: "A Director", department: "Directing", job: "Director" },
      { id: 4, name: "A Writer", department: "Writing", job: "Screenplay" },
      { id: 5, name: "A Producer", department: "Production", job: "Producer" },
      { id: 6, name: "A Composer", department: "Sound", job: "Music" },
    ],
  },
};

describe("MovieCredits", () => {
  it("renders key creatives and switches between complete cast and crew views", () => {
    renderCredits(settledRequest);

    expect(screen.getByRole("link", { name: "A Director" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "A Writer" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "A Producer" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Lead Actor/ })).toBeInTheDocument();

    userEvent.click(screen.getByRole("tab", { name: /Crew/ }));

    expect(screen.getByRole("heading", { name: "Directing" })).toBeInTheDocument();
    expect(screen.getByText("Screenplay")).toBeInTheDocument();
    expect(screen.queryByText("A Composer")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sound" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Lead Actor/ })).not.toBeInTheDocument();
  });

  it("supports arrow-key tab navigation", () => {
    renderCredits(settledRequest);

    const castTab = screen.getByRole("tab", { name: /Cast/ });
    castTab.focus();
    userEvent.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: /Crew/ })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("tab", { name: /Crew/ })).toHaveFocus();
  });

  it("progressively reveals a long cast list", () => {
    const cast = Array.from({ length: 13 }, (_, index) => ({
      id: index + 1,
      name: `Actor ${index + 1}`,
      character: `Role ${index + 1}`,
      order: index,
    }));

    renderCredits({
      data: { cast, crew: [] },
      error: false,
      loading: false,
    });

    expect(screen.queryByText("Actor 13")).not.toBeInTheDocument();
    userEvent.click(
      screen.getByRole("button", { name: "Show all 13 cast members" })
    );
    expect(screen.getByText("Actor 13")).toBeInTheDocument();
  });

  it("does not render an empty or failed section", () => {
    const { container } = renderCredits({
      data: { cast: [], crew: [] },
      error: false,
      loading: false,
    });

    expect(container).toBeEmptyDOMElement();
  });
});
