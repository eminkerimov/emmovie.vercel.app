import { act, render, screen } from "@testing-library/react";
import Loading from "./Loading";

describe("Loading", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("remains controlled by its parent instead of completing on a timer", () => {
    const { container } = render(<Loading />);

    expect(container).not.toBeEmptyDOMElement();
    expect(screen.queryByText(/loading completed/i)).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(screen.queryByText(/loading completed/i)).not.toBeInTheDocument();
  });
});
