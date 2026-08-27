const RELEASE_TYPE_LABELS = {
  1: "Premiere",
  2: "Limited theatrical",
  3: "Theatrical",
  4: "Digital",
  5: "Physical",
  6: "TV",
};

const VIDEO_PRIORITY = [
  (video) => video.site === "YouTube" && video.type === "Trailer" && video.official,
  (video) => video.site === "YouTube" && video.type === "Trailer",
  (video) => video.site === "YouTube" && video.type === "Teaser" && video.official,
  (video) => video.site === "YouTube" && video.type === "Teaser",
];

const RELEASE_TYPE_PRIORITY = [3, 2, 4, 5, 1, 6];

export const selectFeaturedVideo = (videos = []) => {
  if (!Array.isArray(videos)) return null;

  for (const matchesPriority of VIDEO_PRIORITY) {
    const candidates = videos.filter(matchesPriority);

    if (candidates.length) {
      return candidates.sort((first, second) =>
        (second.published_at || "").localeCompare(first.published_at || "")
      )[0];
    }
  }

  return null;
};

export const getReleaseTypeLabel = (type) =>
  RELEASE_TYPE_LABELS[type] || "Release";

export const getRegionalRelease = (releaseData, region) => {
  const regionalResult = releaseData?.results?.find(
    (result) => result.iso_3166_1 === region
  );
  const releases = Array.isArray(regionalResult?.release_dates)
    ? regionalResult.release_dates
    : [];
  const uniqueReleases = releases.filter((release, index, allReleases) => {
    const key = `${release.type}-${release.release_date}-${release.certification}`;

    return (
      allReleases.findIndex(
        (candidate) =>
          `${candidate.type}-${candidate.release_date}-${candidate.certification}` ===
          key
      ) === index
    );
  });
  const orderedReleases = [...uniqueReleases].sort((first, second) => {
    const firstPriority = RELEASE_TYPE_PRIORITY.indexOf(first.type);
    const secondPriority = RELEASE_TYPE_PRIORITY.indexOf(second.type);

    if (firstPriority !== secondPriority) {
      return firstPriority - secondPriority;
    }

    return (first.release_date || "").localeCompare(second.release_date || "");
  });
  const certification = orderedReleases.find(
    (release) => release.certification?.trim()
  )?.certification;

  return {
    certification: certification || "Not rated",
    releases: orderedReleases.slice(0, 4),
  };
};

export const getRelatedSelection = (
  recommendationsRequest,
  similarRequest
) => {
  const recommendations = recommendationsRequest.data?.results || [];
  const similar = similarRequest.data?.results || [];

  if (recommendations.length) {
    return {
      data: recommendationsRequest.data,
      error: false,
      loading: false,
      mode: "recommendations",
    };
  }

  if (recommendationsRequest.loading) {
    return {
      data: null,
      error: false,
      loading: true,
      mode: "recommendations",
    };
  }

  if (similar.length) {
    return {
      data: similarRequest.data,
      error: false,
      loading: false,
      mode: "similar",
    };
  }

  return {
    data: null,
    error: Boolean(recommendationsRequest.error && similarRequest.error),
    loading: similarRequest.loading,
    mode: "similar",
  };
};
