import { render, screen, within } from "@testing-library/react";
import Reviews from "./Reviews";

jest.mock("../../hooks/useReveal", () => () => ({
  elementRef: { current: null },
  isVisible: true,
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

  it("marks the first review as featured and preserves a zero rating", () => {
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

    const featuredReview = screen.getAllByRole("listitem")[0];
    const rating = within(featuredReview).getByLabelText(
      "Rating 0 out of 10"
    );
    const reviewLink = within(featuredReview).getByRole("link", {
      name: "Read full review by Ada Lovelace on TMDB",
    });

    expect(featuredReview).toHaveClass("reviews__item--featured");
    expect(featuredReview).toContainElement(
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
});
