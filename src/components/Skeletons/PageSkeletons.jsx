import React from "react";
import "./PageSkeletons.scss";

const SkeletonBlock = ({ className = "", ...props }) => (
  <span
    {...props}
    className={`skeleton-block ${className}`}
    aria-hidden="true"
  ></span>
);

export const CardGridSkeleton = ({ count = 8, className = "" }) => (
  <div
    className={`skeleton-card-grid ${className}`.trim()}
    role="status"
    aria-label="Loading titles"
  >
    {Array.from({ length: count }, (_, index) => (
      <div
        className="skeleton-card"
        key={index}
        aria-hidden="true"
        data-testid="skeleton-card"
      >
        <SkeletonBlock className="skeleton-card__poster" />
        <div className="skeleton-card__copy">
          <SkeletonBlock />
          <SkeletonBlock />
        </div>
      </div>
    ))}
  </div>
);

export const HomeSkeleton = () => (
  <div className="home-skeleton" role="status" aria-label="Loading home page">
    <div className="page-container home-skeleton__content">
      <SkeletonBlock className="home-skeleton__eyebrow" />
      <SkeletonBlock className="home-skeleton__title" />
      <SkeletonBlock className="home-skeleton__copy" />
      <SkeletonBlock className="home-skeleton__action" />
    </div>
  </div>
);

export const MoviePageSkeleton = ({ transitionName = "detail-poster" }) => (
  <main className="movie-page-skeleton" role="status" aria-label="Loading title details">
    <div className="page-container movie-page-skeleton__layout">
      <SkeletonBlock
        className="movie-page-skeleton__poster"
        data-testid="movie-skeleton-poster"
        style={{ viewTransitionName: transitionName }}
      />
      <div className="movie-page-skeleton__content">
        <SkeletonBlock className="movie-page-skeleton__eyebrow" />
        <SkeletonBlock className="movie-page-skeleton__title" />
        <SkeletonBlock className="movie-page-skeleton__meta" />
        <SkeletonBlock className="movie-page-skeleton__copy" />
        <div className="movie-page-skeleton__actions">
          <SkeletonBlock />
          <SkeletonBlock />
        </div>
      </div>
    </div>
  </main>
);

export const PersonPageSkeleton = () => (
  <main className="person-page-skeleton" role="status" aria-label="Loading person profile">
    <div className="page-container person-page-skeleton__layout">
      <SkeletonBlock className="person-page-skeleton__portrait" />
      <div className="person-page-skeleton__content">
        <SkeletonBlock className="person-page-skeleton__eyebrow" />
        <SkeletonBlock className="person-page-skeleton__title" />
        <SkeletonBlock className="person-page-skeleton__alias" />
        <SkeletonBlock className="person-page-skeleton__copy" />
        <SkeletonBlock className="person-page-skeleton__copy person-page-skeleton__copy--short" />
      </div>
      <div className="person-page-skeleton__facts">
        <SkeletonBlock />
        <SkeletonBlock />
        <SkeletonBlock />
      </div>
    </div>
  </main>
);

export const GallerySkeleton = ({
  className = "",
  count = 4,
  label = "Loading gallery",
}) => (
  <div
    className={`gallery-skeleton ${className}`.trim()}
    role="status"
    aria-label={label}
  >
    <span className="sr-only">{label}</span>
    {Array.from({ length: count }, (_, index) => (
      <SkeletonBlock key={index} data-testid="gallery-skeleton-block" />
    ))}
  </div>
);
