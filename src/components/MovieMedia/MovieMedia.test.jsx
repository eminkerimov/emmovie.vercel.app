import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MovieMedia from "./MovieMedia";

const settledRequest = (data) => ({
  data,
  error: false,
  loading: false,
});

describe("MovieMedia", () => {
  it("omits unavailable media types and switches accessible tabs", () => {
    render(
      <MovieMedia
        title="Test Movie"
        videosRequest={settledRequest({
          results: [
            { id: "video-1", key: "youtube-key", name: "Official Trailer", site: "YouTube" },
          ],
        })}
        imagesRequest={settledRequest({
          posters: [{ file_path: "/poster.jpg" }],
          backdrops: [],
          logos: [],
        })}
      />
    );

    expect(screen.getByRole("tab", { name: /Videos 1/ })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.queryByRole("tab", { name: /Backdrops/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Logos/ })).not.toBeInTheDocument();

    userEvent.click(screen.getByRole("tab", { name: /Posters 1/ }));

    expect(screen.getByRole("tab", { name: /Posters 1/ })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("button", { name: /Open Poster/ })).toBeInTheDocument();
  });

  it("opens an image viewer, supports keyboard navigation, and restores focus", () => {
    render(
      <MovieMedia
        title="Test Movie"
        videosRequest={settledRequest({ results: [] })}
        imagesRequest={settledRequest({
          posters: [
            { file_path: "/poster-one.jpg" },
            { file_path: "/poster-two.jpg" },
          ],
          backdrops: [],
          logos: [],
        })}
      />
    );

    const firstPoster = screen.getByRole("button", {
      name: "Open Poster 1 of 2",
    });
    userEvent.click(firstPoster);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    const posterImage = screen.getByRole("img", {
      name: "Test Movie fullscreen poster",
    });
    expect(posterImage.parentElement).toHaveClass("fullscreen-gallery__stage");
    expect(posterImage).toHaveAttribute(
      "src",
      expect.stringContaining("/original/poster-one.jpg")
    );

    fireEvent.keyDown(dialog, { key: "ArrowRight" });

    expect(
      screen.getByRole("img", { name: "Test Movie fullscreen poster" })
    ).toHaveAttribute(
      "src",
      expect.stringContaining("/poster-two.jpg")
    );

    fireEvent.keyDown(dialog, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(firstPoster).toHaveFocus();
  });

  it("opens supported videos in the modal player", () => {
    render(
      <MovieMedia
        title="Test Movie"
        videosRequest={settledRequest({
          results: [
            { id: "video-1", key: "youtube-key", name: "Official Trailer", site: "YouTube" },
          ],
        })}
        imagesRequest={settledRequest({ posters: [], backdrops: [], logos: [] })}
      />
    );

    userEvent.click(
      screen.getByRole("button", { name: /Open Official Trailer/ })
    );

    expect(screen.getByTitle("Official Trailer")).toHaveAttribute(
      "src",
      expect.stringContaining("youtube-nocookie.com/embed/youtube-key")
    );
  });

  it("renders no section when all media requests settle empty", () => {
    const { container } = render(
      <MovieMedia
        title="Test Movie"
        videosRequest={settledRequest({ results: [] })}
        imagesRequest={settledRequest({ posters: [], backdrops: [], logos: [] })}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
