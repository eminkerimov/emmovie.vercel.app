import React, { useEffect, useMemo, useRef, useState } from "react";
import { POSTER_API } from "../../helpers/baseURL";
import FullscreenGallery from "../FullscreenGallery/FullscreenGallery";
import "./MovieMedia.scss";

const INITIAL_MEDIA_COUNT = 8;
const ORIGINAL_IMAGE_API = "https://image.tmdb.org/t/p/original";

const uniqueBy = (items, getKey) => {
  const seen = new Set();

  return items.filter((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

const getVideoThumbnail = (video) =>
  `https://i.ytimg.com/vi/${video.key}/hqdefault.jpg`;

const buildCategories = (videosData, imagesData) => {
  const videos = uniqueBy(
    (Array.isArray(videosData?.results) ? videosData.results : [])
      .filter((video) => video?.site === "YouTube" && video?.key)
      .sort((first, second) => {
        if (first.official !== second.official) return first.official ? -1 : 1;
        if (first.type === "Trailer" && second.type !== "Trailer") return -1;
        if (second.type === "Trailer" && first.type !== "Trailer") return 1;
        return (second.published_at || "").localeCompare(first.published_at || "");
      })
      .map((video) => ({
        ...video,
        kind: "video",
        label: video.name || video.type || "Video",
        thumbnail: getVideoThumbnail(video),
      })),
    (video) => video.key
  );

  const createImages = (type) =>
    uniqueBy(
      (Array.isArray(imagesData?.[type]) ? imagesData[type] : [])
        .filter((image) => image?.file_path)
        .map((image) => ({
          ...image,
          kind: "image",
          mediaType: type,
          label: `${type.charAt(0).toUpperCase()}${type.slice(1, -1)}`,
        })),
      (image) => image.file_path
    );

  return [
    { id: "videos", label: "Videos", items: videos },
    { id: "posters", label: "Posters", items: createImages("posters") },
  ].filter((category) => category.items.length > 0);
};

const getImageUrl = (item, fullSize = false) => {
  if (item.kind === "video") return item.thumbnail;
  if (fullSize) return ORIGINAL_IMAGE_API + item.file_path;

  return POSTER_API + item.file_path;
};

const MovieMedia = ({ imagesRequest, title, videosRequest }) => {
  const categories = useMemo(
    () => buildCategories(videosRequest?.data, imagesRequest?.data),
    [imagesRequest?.data, videosRequest?.data]
  );
  const [activeCategory, setActiveCategory] = useState(
    () => categories[0]?.id || ""
  );
  const [expandedCategories, setExpandedCategories] = useState({});
  const [activeIndex, setActiveIndex] = useState(null);
  const tabRefs = useRef({});
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const currentCategory =
    categories.find((category) => category.id === activeCategory) || categories[0];
  const currentItems = useMemo(
    () => currentCategory?.items || [],
    [currentCategory]
  );
  const activeItem = activeIndex === null ? null : currentItems[activeIndex];
  const isPosterViewer = activeItem?.mediaType === "posters";
  const isLoading = imagesRequest?.loading || videosRequest?.loading;

  useEffect(() => {
    if (categories.length && !categories.some((category) => category.id === activeCategory)) {
      setActiveCategory(categories[0].id);
    }

    if (!categories.length) setActiveCategory("");
  }, [activeCategory, categories]);

  useEffect(() => {
    setExpandedCategories({});
    setActiveIndex(null);
  }, [imagesRequest?.data, videosRequest?.data]);

  useEffect(() => {
    if (activeIndex === null || isPosterViewer) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveIndex(null);
        triggerRef.current?.focus();
        return;
      }

      if (event.key === "ArrowLeft" && currentItems.length > 1) {
        event.preventDefault();
        setActiveIndex((index) =>
          index === 0 ? currentItems.length - 1 : index - 1
        );
        return;
      }

      if (event.key === "ArrowRight" && currentItems.length > 1) {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % currentItems.length);
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), iframe, [href], [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, currentItems, isPosterViewer]);

  const closeViewer = () => {
    setActiveIndex(null);
    triggerRef.current?.focus();
  };

  const openViewer = (event, index) => {
    triggerRef.current = event.currentTarget;
    setActiveIndex(index);
  };

  const selectTab = (categoryId, moveFocus = false) => {
    setActiveIndex(null);
    setActiveCategory(categoryId);
    if (moveFocus) tabRefs.current[categoryId]?.focus();
  };

  const handleTabKeyDown = (event, categoryId) => {
    const currentIndex = categories.findIndex(
      (category) => category.id === categoryId
    );
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % categories.length;
    if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + categories.length) % categories.length;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = categories.length - 1;
    if (nextIndex === currentIndex) return;

    event.preventDefault();
    selectTab(categories[nextIndex].id, true);
  };

  if (!categories.length && !isLoading) return null;

  const isExpanded = Boolean(expandedCategories[currentCategory?.id]);
  const visibleItems = isExpanded
    ? currentItems
    : currentItems.slice(0, INITIAL_MEDIA_COUNT);
  const categoryLabel = currentCategory?.label || "Media";

  return (
    <>
      <section className="movie-media" aria-labelledby="movie-media-title">
        <div className="page-container">
          <header className="movie-media__heading">
            <div>
              <span>From the production</span>
              <h2 id="movie-media-title">Media hub</h2>
            </div>
            <p>Trailers and poster artwork</p>
          </header>

          {!categories.length ? (
            <p className="movie-media__status" role="status">
              Loading movie media…
            </p>
          ) : (
            <>
              <div className="movie-media__tabs" role="tablist" aria-label="Media types">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    ref={(node) => {
                      tabRefs.current[category.id] = node;
                    }}
                    id={`movie-media-${category.id}-tab`}
                    type="button"
                    role="tab"
                    aria-selected={currentCategory.id === category.id}
                    aria-controls={`movie-media-${category.id}-panel`}
                    tabIndex={currentCategory.id === category.id ? 0 : -1}
                    onClick={() => selectTab(category.id)}
                    onKeyDown={(event) => handleTabKeyDown(event, category.id)}
                  >
                    {category.label}
                    <span>{category.items.length}</span>
                  </button>
                ))}
              </div>

              <div
                id={`movie-media-${currentCategory.id}-panel`}
                className={`movie-media__panel movie-media__panel--${currentCategory.id}`}
                role="tabpanel"
                aria-labelledby={`movie-media-${currentCategory.id}-tab`}
              >
                <div className="movie-media__grid">
                  {visibleItems.map((item, index) => (
                    <button
                      className="movie-media__card"
                      key={item.id || item.key || item.file_path}
                      type="button"
                      aria-label={`Open ${item.label} ${index + 1} of ${currentItems.length}`}
                      onClick={(event) => openViewer(event, index)}
                    >
                      <img
                        src={getImageUrl(item)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                      {item.kind === "video" && (
                        <>
                          <span className="movie-media__play" aria-hidden="true">
                            <i className="fa-solid fa-play"></i>
                          </span>
                          <span className="movie-media__video-copy">
                            <strong>{item.label}</strong>
                            <span>{item.type || "Video"}</span>
                          </span>
                        </>
                      )}
                    </button>
                  ))}
                </div>

                {currentItems.length > INITIAL_MEDIA_COUNT && (
                  <button
                    className="movie-media__expand"
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() =>
                      setExpandedCategories((current) => ({
                        ...current,
                        [currentCategory.id]: !isExpanded,
                      }))
                    }
                  >
                    {isExpanded ? "Show less" : `View all ${currentItems.length} ${categoryLabel.toLowerCase()}`}
                    <i
                      className={`fa-solid fa-chevron-${isExpanded ? "up" : "down"}`}
                      aria-hidden="true"
                    ></i>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {isPosterViewer ? (
        <FullscreenGallery
          activeIndex={activeIndex}
          getImageSrc={(item) => getImageUrl(item, true)}
          items={currentItems}
          label={`${title || "Movie"} fullscreen poster`}
          onClose={() => setActiveIndex(null)}
          onIndexChange={setActiveIndex}
          returnFocusRef={triggerRef}
        />
      ) : activeItem ? (
        <div
          className="movie-media-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={`${title || "Movie"} ${activeItem.label}`}
          onClick={closeViewer}
        >
          <div
            ref={dialogRef}
            className={`movie-media-viewer__content movie-media-viewer__content--${activeItem.kind}`}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="movie-media-viewer__toolbar">
              <div>
                <strong>{activeItem.label}</strong>
                <span>{activeIndex + 1} / {currentItems.length}</span>
              </div>
              <button type="button" aria-label="Close media viewer" onClick={closeViewer} autoFocus>
                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
            </header>

            <div className="movie-media-viewer__stage">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeItem.key}?autoplay=1`}
                title={activeItem.label}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            {currentItems.length > 1 && (
              <>
                <button
                  className="movie-media-viewer__arrow movie-media-viewer__arrow--previous"
                  type="button"
                  aria-label={`Previous ${categoryLabel.toLowerCase()}`}
                  onClick={() =>
                    setActiveIndex((index) =>
                      index === 0 ? currentItems.length - 1 : index - 1
                    )
                  }
                >
                  <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
                </button>
                <button
                  className="movie-media-viewer__arrow movie-media-viewer__arrow--next"
                  type="button"
                  aria-label={`Next ${categoryLabel.toLowerCase()}`}
                  onClick={() =>
                    setActiveIndex((index) => (index + 1) % currentItems.length)
                  }
                >
                  <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default MovieMedia;
