import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ProgressiveImage from "./ProgressiveImage";

describe("ProgressiveImage", () => {
  it("reveals an image after it loads and decodes", async () => {
    const handleLoad = jest.fn();

    render(
      <ProgressiveImage
        src="/poster-one.jpg"
        alt="Poster"
        className="poster-image"
        onLoad={handleLoad}
      />
    );

    const image = screen.getByRole("img", { name: "Poster" });
    image.decode = jest.fn().mockResolvedValue(undefined);

    expect(image).toHaveClass("progressive-image", "poster-image");
    expect(image).not.toHaveClass("is-ready");

    fireEvent.load(image);

    expect(handleLoad).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(image).toHaveClass("is-ready"));
    expect(image.decode).toHaveBeenCalledTimes(1);
  });

  it("hides the previous source until the replacement image is ready", async () => {
    const { rerender } = render(
      <ProgressiveImage src="/portrait-one.jpg" alt="Portrait" />
    );
    const image = screen.getByRole("img", { name: "Portrait" });
    image.decode = jest.fn().mockResolvedValue(undefined);

    fireEvent.load(image);
    await waitFor(() => expect(image).toHaveClass("is-ready"));

    rerender(
      <ProgressiveImage src="/portrait-two.jpg" alt="Portrait" />
    );

    expect(image).toHaveAttribute("src", "/portrait-two.jpg");
    expect(image).not.toHaveClass("is-ready");

    fireEvent.load(image);
    await waitFor(() => expect(image).toHaveClass("is-ready"));
  });

  it("shows a broken image state and preserves the external error callback", () => {
    const handleError = jest.fn();

    render(
      <ProgressiveImage
        src="/missing.jpg"
        alt="Missing artwork"
        onError={handleError}
      />
    );

    const image = screen.getByRole("img", { name: "Missing artwork" });
    fireEvent.error(image);

    expect(image).toHaveClass("is-ready");
    expect(handleError).toHaveBeenCalledTimes(1);
  });
});
