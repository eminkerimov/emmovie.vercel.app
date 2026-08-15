import { render, screen } from "@testing-library/react";
import Posters from "./Posters";

jest.mock("react-slick", () => ({ children }) => (
  <div data-testid="posters-slider">{children}</div>
));

describe("Posters", () => {
  it("renders nothing, including no numeric zero, for an empty collection", () => {
    const { container } = render(<Posters data={{ posters: [] }} />);

    expect(container).toBeEmptyDOMElement();
    expect(container).not.toHaveTextContent("0");
  });

  it("renders available posters", () => {
    render(<Posters data={{ posters: [{ file_path: "/poster.jpg" }] }} />);

    expect(screen.getByRole("heading", { name: /posters/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /poster/i })).toBeInTheDocument();
  });
});
