import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Overview from "./Overview";

jest.mock("../../hooks/useReveal", () => () => ({
  elementRef: { current: null },
  isVisible: true,
}));

const renderOverview = (props) =>
  render(
    <MemoryRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Overview {...props} />
    </MemoryRouter>
  );

describe("Overview", () => {
  it("connects the heading and renders facts as a description list", () => {
    renderOverview({
      data: { overview: "A precise synopsis." },
      detailsData: [
        { title: "Release date", value: "1999-10-15" },
        { title: "Runtime", value: "139 min" },
      ],
    });

    const heading = screen.getByRole("heading", {
      level: 2,
      name: "Overview",
    });
    const section = screen.getByRole("region", { name: "Overview" });

    expect(section).toContainElement(heading);
    expect(screen.getByText("A precise synopsis.")).toBeInTheDocument();
    expect(screen.getAllByRole("term")).toHaveLength(2);
    expect(screen.getAllByRole("definition")).toHaveLength(2);
    expect(screen.getAllByRole("term")[0]).toHaveTextContent("Release date");
    expect(screen.getAllByRole("definition")[1]).toHaveTextContent("139 min");
  });

  it("links production companies to their internal pages", () => {
    renderOverview({
      data: { overview: "A concise synopsis." },
      detailsData: [
        {
          title: "Production Companies",
          value: "Studio One",
          links: [{ id: 10, label: "Studio One", to: "/company/10" }],
        },
      ],
    });

    expect(screen.getByRole("link", { name: "Studio One" })).toHaveAttribute(
      "href",
      "/company/10"
    );
  });
});
