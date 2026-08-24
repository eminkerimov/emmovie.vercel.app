import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import Reviews from "./Reviews";

jest.mock("../../hooks/useReveal", () => () => ({
  elementRef: { current: null },
  isVisible: true,
}));

const createReviews = (count, prefix = "Author") =>
  Array.from({ length: count }, (_, index) => ({
    id: `review-${prefix}-${index + 1}`,
    author: `${prefix} ${index + 1}`,
    author_details: { rating: 8 },
    content: `Review content ${index + 1}.`,
    created_at: "2024-01-02T10:00:00.000Z",
    url: `https://www.themoviedb.org/review/${prefix}-${index + 1}`,
  }));

describe("Reviews", () => {
  it("renders the labelled reviews section and its empty state", () => {
    render(<Reviews results={[]} />);

    const heading = screen.getByRole("heading", {
      level: 2,
      name: "User reviews",
    });
    const section = screen.getByRole("region", { name: "User reviews" });

    expect(section).toContainElement(heading);
    expect(screen.getByRole("status")).toHaveTextContent(
      "The audience is still quiet"
    );
    expect(screen.getByText("No reviews yet...")).toBeInTheDocument();
  });

  it("renders review metadata and preserves a zero rating", () => {
    render(
      <Reviews
        results={[
          {
            id: "review-1",
            author: "Ada Lovelace",
            author_details: { rating: 0 },
            content: "A bold but divisive film.",
            created_at: "2024-01-02T10:00:00.000Z",
            url: "https://www.themoviedb.org/review/review-1",
          },
          {
            id: "review-2",
            author: "Grace Hopper",
            author_details: { rating: 8 },
            content: "Sharp, confident storytelling.",
            created_at: "2024-02-03T10:00:00.000Z",
            url: "https://www.themoviedb.org/review/review-2",
          },
        ]}
      />
    );

    const firstReview = screen.getAllByRole("listitem")[0];
    const rating = within(firstReview).getByLabelText(
      "Rating 0 out of 10"
    );
    const reviewLink = within(firstReview).getByRole("link", {
      name: "Read full review by Ada Lovelace on TMDB",
    });

    expect(firstReview).toContainElement(
      screen.getByRole("heading", { level: 3, name: "Ada Lovelace" })
    );
    expect(rating).toHaveTextContent("0/10");
    expect(reviewLink).toHaveAttribute(
      "href",
      "https://www.themoviedb.org/review/review-1"
    );
    expect(reviewLink).toHaveAttribute("target", "_blank");
    expect(reviewLink).toHaveAttribute("rel", "noreferrer");
  });

  it("shows only three reviews and navigates between review pages", () => {
    render(<Reviews results={createReviews(7)} />);

    expect(
      screen.getByRole("heading", { level: 3, name: "Author 1" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Author 3" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 3, name: "Author 4" })
    ).not.toBeInTheDocument();

    const previous = screen.getByRole("button", {
      name: "Show previous reviews",
    });
    const next = screen.getByRole("button", {
      name: "Show next reviews",
    });

    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Showing loaded reviews 1 to 3 of 7"
    );

    fireEvent.click(next);

    expect(
      screen.getByRole("heading", { level: 3, name: "Author 4" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 3, name: "Author 1" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Showing loaded reviews 4 to 6 of 7"
    );

    fireEvent.click(next);

    expect(
      screen.getByRole("heading", { level: 3, name: "Author 7" })
    ).toBeInTheDocument();
    expect(next).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Showing loaded reviews 7 to 7 of 7"
    );

    fireEvent.click(previous);

    expect(
      screen.getByRole("heading", { level: 3, name: "Author 4" })
    ).toBeInTheDocument();
    expect(next).toBeEnabled();
  });

  it("returns to the first page when the review dataset changes", async () => {
    const { rerender } = render(<Reviews results={createReviews(6)} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Show next reviews" })
    );
    expect(
      screen.getByRole("heading", { level: 3, name: "Author 4" })
    ).toBeInTheDocument();

    rerender(<Reviews results={createReviews(4, "Replacement")} />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          level: 3,
          name: "Replacement 1",
        })
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: "Show previous reviews" })
    ).toBeDisabled();
  });

  it("handles missing author metadata, date, rating, and URL safely", () => {
    render(<Reviews results={[{ id: "review-1", content: "No metadata." }]} />);

    expect(
      screen.getByRole("heading", { level: 3, name: "Anonymous viewer" })
    ).toBeInTheDocument();
    expect(screen.getByText("Date unavailable")).toBeInTheDocument();
    expect(screen.getByLabelText("Rating unavailable")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /read full review/i })
    ).not.toBeInTheDocument();
  });

  it("keeps a long local review compact until the reader expands it", () => {
    const longReview = "Long-form review content. ".repeat(40);

    render(
      <Reviews
        results={[
          {
            id: "long-review",
            author: "Patient Viewer",
            content: longReview,
          },
        ]}
      />
    );

    const expand = screen.getByRole("button", {
      name: "Expand review by Patient Viewer",
    });

    expect(
      screen.queryByRole("navigation", { name: "Reviews pagination" })
    ).not.toBeInTheDocument();

    fireEvent.click(expand);

    expect(
      screen.getByRole("button", {
        name: "Collapse review by Patient Viewer",
      })
    ).toHaveAttribute("aria-expanded", "true");
  });
});
