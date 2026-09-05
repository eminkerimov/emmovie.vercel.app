import React, { useEffect, useMemo, useRef, useState } from "react";
import { IMG_API } from "../../helpers/baseURL";
import FullscreenGallery from "../FullscreenGallery/FullscreenGallery";
import "./MovieBackdrops.scss";

const MAX_BACKDROPS = 16;
const ORIGINAL_IMAGE_API = "https://image.tmdb.org/t/p/original";

const getBackdrops = (images) => {
  const seenPaths = new Set();
  const availableImages = Array.isArray(images) ? images : [];

  return availableImages
    .filter((image) => {
      if (!image?.file_path || seenPaths.has(image.file_path)) return false;

      seenPaths.add(image.file_path);
      return true;
    })
    .slice(0, MAX_BACKDROPS);
};

const MovieBackdrops = ({ imagesRequest, title }) => {
  const backdrops = useMemo(
    () => getBackdrops(imagesRequest?.data?.backdrops),
    [imagesRequest?.data?.backdrops]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState(null);
  const trackRef = useRef(null);
  const slideRefs = useRef([]);
  const viewerTriggerRef = useRef(null);
  const activeViewerBackdrop =
    viewerIndex === null ? null : backdrops[viewerIndex];

  useEffect(() => {
    setActiveIndex(0);
    setViewerIndex(null);
    slideRefs.current = slideRefs.current.slice(0, backdrops.length);
  }, [backdrops]);

  if (imagesRequest?.loading && !backdrops.length) {
    return (
      <section className="movie-backdrops" aria-labelledby="movie-backdrops-title">
        <div className="page-container">
          <header className="movie-backdrops__heading">
            <div>
              <span>Production stills</span>
              <h2 id="movie-backdrops-title">Backdrops</h2>
            </div>
          </header>
          <div className="movie-backdrops__loading" role="status">
            Loading backdrops…
          </div>
        </div>
      </section>
    );
  }

  if (imagesRequest?.error || !backdrops.length) return null;

  const goToSlide = (nextIndex) => {
    const safeIndex = Math.min(Math.max(nextIndex, 0), backdrops.length - 1);
    const track = trackRef.current;
    const slide = slideRefs.current[safeIndex];

    setActiveIndex(safeIndex);

    if (track && slide) {
      track.scrollTo?.({
        left: Math.max(0, slide.offsetLeft - track.offsetLeft),
        behavior: "smooth",
      });
    }
  };

  const handleScroll = () => {
    const track = trackRef.current;

    if (!track || !slideRefs.current.length) return;

    const nearestIndex = slideRefs.current.reduce(
      (closestIndex, slide, index) => {
        if (!slide) return closestIndex;

        const currentDistance = Math.abs(
          slide.offsetLeft - track.offsetLeft - track.scrollLeft
        );
        const closestSlide = slideRefs.current[closestIndex];
        const closestDistance = closestSlide
          ? Math.abs(
              closestSlide.offsetLeft - track.offsetLeft - track.scrollLeft
            )
          : Number.POSITIVE_INFINITY;

        return currentDistance < closestDistance ? index : closestIndex;
      },
      0
    );

    setActiveIndex(nearestIndex);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToSlide(activeIndex - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToSlide(activeIndex + 1);
    }
  };

  const openViewer = (event, index) => {
    viewerTriggerRef.current = event.currentTarget;
    setActiveIndex(index);
    setViewerIndex(index);
  };

  return (
    <section className="movie-backdrops" aria-labelledby="movie-backdrops-title">
      <div className="page-container">
        <header className="movie-backdrops__heading">
          <div>
            <span>Production stills</span>
            <h2 id="movie-backdrops-title">Backdrops</h2>
          </div>

          <div className="movie-backdrops__controls">
            <button
              type="button"
              aria-label="Previous backdrop"
              aria-controls="movie-backdrops-track"
              disabled={activeIndex === 0}
              onClick={() => goToSlide(activeIndex - 1)}
            >
              <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              aria-label="Next backdrop"
              aria-controls="movie-backdrops-track"
              disabled={activeIndex === backdrops.length - 1}
              onClick={() => goToSlide(activeIndex + 1)}
            >
              <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </button>
          </div>
        </header>

        <div
          ref={trackRef}
          id="movie-backdrops-track"
          className="movie-backdrops__track"
          role="region"
          aria-roledescription="carousel"
          aria-label={`${title || "Movie"} backdrops`}
          tabIndex="0"
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
        >
          {backdrops.map((backdrop, index) => (
            <figure
              ref={(node) => {
                slideRefs.current[index] = node;
              }}
              className={`movie-backdrops__slide ${
                index === activeIndex ? "is-active" : ""
              }`}
              key={backdrop.file_path}
              role="group"
              aria-roledescription="slide"
              aria-label={`Backdrop ${index + 1} of ${backdrops.length}`}
            >
              <button
                type="button"
                aria-label={`Open backdrop ${index + 1} fullscreen`}
                onClick={(event) => openViewer(event, index)}
              >
                <img
                  src={IMG_API + backdrop.file_path}
                  alt={`${title || "Movie"} backdrop ${index + 1}`}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              </button>
            </figure>
          ))}
        </div>

        <div className="movie-backdrops__progress" aria-hidden="true">
          <span
            style={{
              "--movie-backdrops-progress": `${
                ((activeIndex + 1) / backdrops.length) * 100
              }%`,
            }}
          ></span>
        </div>
      </div>

      {activeViewerBackdrop &&
        <FullscreenGallery
          activeIndex={viewerIndex}
          getImageSrc={(backdrop) =>
            ORIGINAL_IMAGE_API + backdrop.file_path
          }
          items={backdrops}
          label={`${title || "Movie"} fullscreen backdrop`}
          onClose={() => setViewerIndex(null)}
          onIndexChange={setViewerIndex}
          returnFocusRef={viewerTriggerRef}
        />}
    </section>
  );
};

export default MovieBackdrops;
