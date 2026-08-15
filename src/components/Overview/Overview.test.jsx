import { render, screen } from "@testing-library/react";
import Overview from "./Overview";

jest.mock("../../hooks/useReveal", () => () => ({
  elementRef: { current: null },
  isVisible: true,
}));

describe("Overview", () => {
  it("connects the section heading and renders movie facts as a description list", () => {
    render(
      <Overview
        data={{ overview: "A precise synopsis." }}
        detailsData={[
          { title: "Release date", value: "1999-10-15" },
          { title: "Runtime", value: "139 min" },
        ]}
      />
    );

    const heading = screen.getByRole("heading", {
      level: 2,
      name: "Overview",
    });
    const section = screen.getByRole("region", { name: "Overview" });

    expect(section).toContainElement(heading);
    expect(screen.getByText("A precise synopsis.")).toBeInTheDocument();
    const terms = screen.getAllByRole("term");
    const definitions = screen.getAllByRole("definition");

    expect(terms).toHaveLength(2);
    expect(definitions).toHaveLength(2);
    expect(terms[0]).toHaveTextContent("Release date");
    expect(definitions[1]).toHaveTextContent("139 min");
  });
});
