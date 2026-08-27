import {
  getRegionalRelease,
  getRelatedSelection,
  getReleaseTypeLabel,
  selectFeaturedVideo,
} from "./movieData";

describe("movieData", () => {
  it("prefers an official YouTube trailer over other videos", () => {
    const selectedVideo = selectFeaturedVideo([
      {
        key: "new-unofficial",
        official: false,
        published_at: "2025-01-01",
        site: "YouTube",
        type: "Trailer",
      },
      {
        key: "official",
        official: true,
        published_at: "2024-01-01",
        site: "YouTube",
        type: "Trailer",
      },
      {
        key: "teaser",
        official: true,
        site: "YouTube",
        type: "Teaser",
      },
    ]);

    expect(selectedVideo.key).toBe("official");
  });

  it("uses a YouTube teaser only when no YouTube trailer exists", () => {
    expect(
      selectFeaturedVideo([
        { key: "vimeo", site: "Vimeo", type: "Trailer" },
        { key: "teaser", site: "YouTube", type: "Teaser" },
      ]).key
    ).toBe("teaser");
  });

  it("extracts the regional certification and exact release types", () => {
    const release = getRegionalRelease(
      {
        results: [
          {
            iso_3166_1: "US",
            release_dates: [
              {
                certification: "",
                release_date: "2024-04-10T00:00:00.000Z",
                type: 4,
              },
              {
                certification: "PG-13",
                release_date: "2024-04-01T00:00:00.000Z",
                type: 3,
              },
            ],
          },
        ],
      },
      "US"
    );

    expect(release.certification).toBe("PG-13");
    expect(release.releases[0].type).toBe(3);
    expect(getReleaseTypeLabel(release.releases[1].type)).toBe("Digital");
  });

  it("uses recommendations first and similar movies as a fallback", () => {
    const recommendations = {
      data: { results: [{ id: 1 }] },
      error: false,
      loading: false,
    };
    const similar = {
      data: { results: [{ id: 2 }] },
      error: false,
      loading: false,
    };

    expect(getRelatedSelection(recommendations, similar)).toMatchObject({
      data: recommendations.data,
      mode: "recommendations",
    });
    expect(
      getRelatedSelection(
        { data: { results: [] }, error: false, loading: false },
        similar
      )
    ).toMatchObject({ data: similar.data, mode: "similar" });
  });
});
