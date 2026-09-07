import React from "react";
import { render, screen } from "@testing-library/react";
import {
  CardGridSkeleton,
  GallerySkeleton,
  HomeSkeleton,
  MoviePageSkeleton,
  PersonPageSkeleton,
} from "./PageSkeletons";

describe("page skeletons", () => {
  it("renders the requested number of card placeholders with an accessible label", () => {
    render(<CardGridSkeleton className="results-grid" count={3} />);

    expect(
      screen.getByRole("status", { name: "Loading titles" })
    ).toHaveClass("results-grid");
    expect(screen.getAllByTestId("skeleton-card")).toHaveLength(3);
  });

  it("exposes page-specific loading states", () => {
    const { rerender } = render(<HomeSkeleton />);

    expect(
      screen.getByRole("status", { name: "Loading home page" })
    ).toBeInTheDocument();

    rerender(<MoviePageSkeleton transitionName="selected-poster" />);

    expect(
      screen.getByRole("status", { name: "Loading title details" })
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("movie-skeleton-poster").style.viewTransitionName
    ).toBe("selected-poster");

    rerender(<PersonPageSkeleton />);

    expect(
      screen.getByRole("status", { name: "Loading person profile" })
    ).toBeInTheDocument();
  });

  it("supports a contextual gallery label and placeholder count", () => {
    render(
      <GallerySkeleton
        className="portrait-gallery"
        count={2}
        label="Loading portraits"
      />
    );

    expect(
      screen.getByRole("status", { name: "Loading portraits" })
    ).toHaveClass("portrait-gallery");
    expect(screen.getAllByTestId("gallery-skeleton-block")).toHaveLength(2);
  });
});
