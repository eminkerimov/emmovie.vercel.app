import { act, renderHook } from "@testing-library/react";
import useEpisodeProgress, {
  EPISODE_PROGRESS_KEY,
  getSeasonProgressKey,
} from "./useEpisodeProgress";

describe("useEpisodeProgress", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores episode progress independently from title-level watched state", () => {
    const titleWatched = [{ id: 1399, title: "Game of Thrones", media_type: "tv" }];
    localStorage.setItem("emmovie_watched", JSON.stringify(titleWatched));
    const { result } = renderHook(() => useEpisodeProgress());

    act(() => {
      result.current.toggleEpisode(1399, 1, 2);
      result.current.toggleEpisode(1399, 2, 2);
    });

    expect(JSON.parse(localStorage.getItem(EPISODE_PROGRESS_KEY))).toEqual({
      "1399:1": [2],
      "1399:2": [2],
    });
    expect(JSON.parse(localStorage.getItem("emmovie_watched"))).toEqual(
      titleWatched
    );
    expect(result.current.isEpisodeWatched(1399, 1, 2)).toBe(true);
    expect(result.current.isEpisodeWatched(1399, 1, 1)).toBe(false);
  });

  it("marks and clears a complete season with compact episode numbers", () => {
    const { result } = renderHook(() => useEpisodeProgress());

    act(() => {
      result.current.setSeasonWatched(1399, 1, [3, 1, 2, 2], true);
    });

    expect(result.current.getSeasonProgress(1399, 1, 3)).toEqual({
      watched: 3,
      total: 3,
      percentage: 100,
      isComplete: true,
    });
    expect(JSON.parse(localStorage.getItem(EPISODE_PROGRESS_KEY))).toEqual({
      "1399:1": [1, 2, 3],
    });

    act(() => {
      result.current.setSeasonWatched(1399, 1, [1, 2, 3], false);
    });

    expect(JSON.parse(localStorage.getItem(EPISODE_PROGRESS_KEY))).toEqual({});
  });

  it("hydrates valid progress and ignores malformed entries", () => {
    localStorage.setItem(
      EPISODE_PROGRESS_KEY,
      JSON.stringify({
        "1399:1": ["2", 1, 2, 0, "bad"],
        "1399:2": "invalid",
      })
    );

    const { result } = renderHook(() => useEpisodeProgress());

    expect(result.current.getSeasonProgress(1399, 1, 3)).toMatchObject({
      watched: 2,
      percentage: 67,
    });
    expect(result.current.getSeasonProgress(1399, 2, 4).watched).toBe(0);
  });

  it("creates stable keys for regular seasons and specials", () => {
    expect(getSeasonProgressKey(1399, 1)).toBe("1399:1");
    expect(getSeasonProgressKey("1399", "0")).toBe("1399:0");
    expect(getSeasonProgressKey(null, 1)).toBeNull();
    expect(getSeasonProgressKey(1399, -1)).toBeNull();
  });
});
