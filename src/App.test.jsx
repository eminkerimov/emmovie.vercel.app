import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("./components/Navbar/Navbar", () => () => null);
jest.mock("./pages/Home/Home", () => () => (
  <div data-testid="route-home">Home route</div>
));
jest.mock("./pages/Discover", () => () => (
  <div data-testid="route-discover">Discover route</div>
));
jest.mock("./pages/Watchlist", () => () => (
  <div data-testid="route-watchlist">Watchlist route</div>
));
jest.mock("./pages/Calendar", () => () => (
  <div data-testid="route-calendar">Calendar route</div>
));
jest.mock("./pages/Search/Search", () => () => (
  <div data-testid="route-search">Search route</div>
));
jest.mock("./pages/Movies/Movies", () => () => (
  <div data-testid="route-movies">Movies route</div>
));
jest.mock("./pages/Movie/Movie", () => () => (
  <div data-testid="route-movie">Movie route</div>
));
jest.mock("./pages/Person/Person", () => () => (
  <div data-testid="route-person">Person route</div>
));
jest.mock("./pages/Collection", () => () => (
  <div data-testid="route-collection">Collection route</div>
));
jest.mock("./pages/Company", () => () => (
  <div data-testid="route-company">Company route</div>
));
jest.mock("./pages/NotFound/NotFound", () => () => (
  <div data-testid="route-not-found">Not found route</div>
));

describe("main routes", () => {
  test.each([
    ["/", "route-home"],
    ["/discover", "route-discover"],
    ["/watchlist", "route-watchlist"],
    ["/calendar", "route-calendar"],
    ["/search?q=dune", "route-search"],
    ["/movies", "route-movies"],
    ["/movie/550", "route-movie"],
    ["/person/287", "route-person"],
    ["/collection/10", "route-collection"],
    ["/company/42", "route-company"],
    ["/missing-page", "route-not-found"],
  ])("renders %s", async (path, testId) => {
    window.history.pushState({}, "", path);

    render(<App />);

    expect(await screen.findByTestId(testId)).toBeInTheDocument();
  });
});
