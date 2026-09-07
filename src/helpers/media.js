export const getMediaType = (item, fallback = "movie") => {
  if (item?.media_type === "tv" || item?.media_type === "movie") {
    return item.media_type;
  }

  return fallback === "tv" ? "tv" : "movie";
};

export const getMediaTitle = (item) =>
  item?.title ||
  item?.name ||
  item?.original_title ||
  item?.original_name ||
  "Untitled";

export const getMediaReleaseDate = (item) =>
  item?.release_date || item?.first_air_date || "";

export const getMediaDetailsPath = (item, fallback = "movie") => {
  const mediaType = getMediaType(item, fallback);

  return `/${mediaType}/${item?.id}`;
};

export const getMediaTransitionName = (item, fallback = "movie") =>
  `detail-poster-${getMediaType(item, fallback)}-${item?.id}`;

export const getLibraryItemKey = (itemOrId, mediaType = "movie") => {
  const item =
    itemOrId && typeof itemOrId === "object"
      ? itemOrId
      : { id: itemOrId, media_type: mediaType };
  const type = getMediaType(item, mediaType);

  return type === "tv" ? `tv:${item.id}` : String(item.id);
};

export const getMediaSummary = (item, fallback = "movie") => {
  const mediaType = getMediaType(item, fallback);
  const summary = {
    id: item.id,
    title: getMediaTitle(item),
    poster_path: item.poster_path,
    overview: item.overview,
    vote_average: item.vote_average,
    release_date: getMediaReleaseDate(item),
  };

  return mediaType === "tv"
    ? { ...summary, media_type: "tv" }
    : summary;
};
