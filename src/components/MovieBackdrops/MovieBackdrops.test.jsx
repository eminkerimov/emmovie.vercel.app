import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MovieBackdrops from "./MovieBackdrops";

const settledRequest = (backdrops) => ({
  data: { backdrops },
  error: false,
  loading: false,
});

describe("MovieBackdrops", () => {
  it("renders unique backdrops and navigates without autoplay", () => {
    render(
      <MovieBackdrops
        title="Test Movie"
        imagesRequest={settledRequest([
          { file_path: "/one.jpg" },
          { file_path: "/two.jpg" },
          { file_path: "/two.jpg" },
        ])}
      />
    );

    expect(screen.getAllByRole("group", { name: /Backdrop/ })).toHaveLength(2);

    userEvent.click(screen.getByRole("button", { name: "Next backdrop" }));

    expect(screen.getByRole("button", { name: "Next backdrop" })).toBeDisabled();

    fireEvent.keyDown(
      screen.getByRole("region", { name: "Test Movie backdrops" }),
      { key: "ArrowLeft" }
    );

    expect(screen.getByRole("button", { name: "Previous backdrop" })).toBeDisabled();
  });

  it("opens the selected backdrop fullscreen and restores focus on close", () => {
    render(
      <MovieBackdrops
        title="Test Movie"
        imagesRequest={settledRequest([
          { file_path: "/one.jpg" },
          { file_path: "/two.jpg" },
        ])}
      />
    );

    const secondBackdrop = screen.getByRole("button", {
      name: "Open backdrop 2 fullscreen",
    });
    userEvent.click(secondBackdrop);

    const dialog = screen.getByRole("dialog", {
      name: "Test Movie fullscreen backdrop",
    });
    expect(document.body).toHaveStyle({ overflow: "hidden" });
    expect(
      within(dialog).getByRole("img", { name: "Test Movie fullscreen backdrop" })
    ).toHaveAttribute("src", expect.stringContaining("/original/two.jpg"));

    fireEvent.keyDown(dialog, { key: "ArrowRight" });
    expect(
      within(dialog).getByRole("img", { name: "Test Movie fullscreen backdrop" })
    ).toHaveAttribute("src", expect.stringContaining("/original/one.jpg"));

    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(secondBackdrop).toHaveFocus();
  });

  it("shows loading but omits failed and empty sliders", () => {
    const { rerender } = render(
      <MovieBackdrops
        title="Test Movie"
        imagesRequest={{ data: null, error: false, loading: true }}
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent("Loading backdrops");

    rerender(
      <MovieBackdrops
        title="Test Movie"
        imagesRequest={{ data: null, error: true, loading: false }}
      />
    );

    expect(screen.queryByRole("region")).not.toBeInTheDocument();

    rerender(
      <MovieBackdrops
        title="Test Movie"
        imagesRequest={settledRequest([])}
      />
    );

    expect(screen.queryByRole("heading", { name: "Backdrops" })).not.toBeInTheDocument();
  });
});
