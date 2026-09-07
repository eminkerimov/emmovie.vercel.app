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

  it("uses TMDB company logos and country flags in production details", () => {
    renderOverview({
      data: {
        overview: "A concise synopsis.",
        production_companies: [
          { id: 420, name: "Marvel Studios", logo_path: "/marvel.png" },
        ],
        production_countries: [
          { iso_3166_1: "US", name: "United States of America" },
        ],
      },
      detailsData: [
        { title: "Runtime", value: "110 min" },
        {
          title: "Production Companies",
          value: "Marvel Studios",
          links: [{ id: 420, label: "Marvel Studios", to: "/company/420" }],
        },
        { title: "Countries", value: "United States of America" },
      ],
    });

    expect(screen.getByRole("img", { name: "Marvel Studios" })).toHaveAttribute(
      "src",
      expect.stringContaining("/marvel.png")
    );
    expect(
      screen.getByRole("img", { name: "United States of America" })
    ).toHaveAttribute(
      "src",
      "https://flagcdn.io/flags/4x3/us.svg"
    );
    expect(
      screen.getAllByRole("term").map((term) => term.textContent)
    ).toEqual(["Runtime", "Production Companies", "Countries"]);
  });
});
