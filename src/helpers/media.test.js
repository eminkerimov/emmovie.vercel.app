import {
  getLibraryItemKey,
  getMediaDetailsPath,
  getMediaReleaseDate,
  getMediaSummary,
  getMediaTitle,
  getMediaTransitionName,
  getMediaType,
} from "./media";

const movie = {
  id: 550,
  title: "Fight Club",
  poster_path: "/fight.jpg",
  overview: "Overview",
  vote_average: 8.4,
  release_date: "1999-10-15",
};

const tvSeries = {
  id: 550,
  name: "Twin Peaks",
  poster_path: "/twin-peaks.jpg",
  overview: "Overview",
  vote_average: 8.5,
  first_air_date: "1990-04-08",
  media_type: "tv",
};

describe("media helpers", () => {
  it("normalizes movie and TV labels, dates, and details routes", () => {
    expect(getMediaType(movie)).toBe("movie");
    expect(getMediaType(tvSeries)).toBe("tv");
    expect(getMediaType({ media_type: "movie" }, "tv")).toBe("movie");
    expect(getMediaType({}, "tv")).toBe("tv");
    expect(getMediaTitle(movie)).toBe("Fight Club");
    expect(getMediaTitle(tvSeries)).toBe("Twin Peaks");
    expect(getMediaReleaseDate(movie)).toBe("1999-10-15");
    expect(getMediaReleaseDate(tvSeries)).toBe("1990-04-08");
    expect(getMediaDetailsPath(movie)).toBe("/movie/550");
    expect(getMediaDetailsPath(tvSeries)).toBe("/tv/550");
    expect(getMediaTransitionName(movie)).toBe("detail-poster-movie-550");
    expect(getMediaTransitionName(tvSeries)).toBe("detail-poster-tv-550");
  });

  it("uses collision-safe TV keys without changing the legacy movie key", () => {
    expect(getLibraryItemKey(movie)).toBe("550");
    expect(getLibraryItemKey(tvSeries)).toBe("tv:550");
    expect(getLibraryItemKey(550)).toBe("550");
    expect(getLibraryItemKey(550, "tv")).toBe("tv:550");
  });

  it("keeps the legacy movie summary and marks only TV summaries", () => {
    expect(getMediaSummary(movie)).toEqual(movie);
    expect(getMediaSummary(tvSeries)).toEqual({
      id: 550,
      title: "Twin Peaks",
      poster_path: "/twin-peaks.jpg",
      overview: "Overview",
      vote_average: 8.5,
      release_date: "1990-04-08",
      media_type: "tv",
    });
  });
});
