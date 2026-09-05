import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./FullscreenGallery.scss";

const FullscreenGallery = ({
  activeIndex,
  getImageSrc,
  items,
  label,
  onClose,
  onIndexChange,
  returnFocusRef,
}) => {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const activeItem = items[activeIndex];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const returnFocusTarget = returnFocusRef?.current;

    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      returnFocusTarget?.focus();
    };
  }, [returnFocusRef]);

  if (!activeItem) return null;

  const changeImage = (direction) => {
    onIndexChange(
      (activeIndex + direction + items.length) % items.length
    );
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (
      items.length > 1 &&
      (event.key === "ArrowLeft" || event.key === "ArrowRight")
    ) {
      event.preventDefault();
      changeImage(event.key === "ArrowLeft" ? -1 : 1);
      return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll("button:not([disabled])") || []
    );

    if (!focusableElements.length) return;

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

  return createPortal(
    <div className="fullscreen-gallery" onClick={onClose}>
      <div
        className="fullscreen-gallery__dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-describedby="fullscreen-gallery-status"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <button
          className="fullscreen-gallery__close"
          ref={closeRef}
          type="button"
          aria-label="Close fullscreen gallery"
          onClick={onClose}
        >
          <i className="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>

        {items.length > 1 && (
          <button
            className="fullscreen-gallery__arrow fullscreen-gallery__arrow--previous"
            type="button"
            aria-label="Previous image"
            onClick={() => changeImage(-1)}
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
          </button>
        )}

        <div className="fullscreen-gallery__stage">
          <img
            className="fullscreen-gallery__image"
            src={getImageSrc(activeItem)}
            alt={label}
            decoding="async"
          />
        </div>

        {items.length > 1 && (
          <button
            className="fullscreen-gallery__arrow fullscreen-gallery__arrow--next"
            type="button"
            aria-label="Next image"
            onClick={() => changeImage(1)}
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
          </button>
        )}

        <span
          className="sr-only"
          id="fullscreen-gallery-status"
          aria-live="polite"
        >
          Image {activeIndex + 1} of {items.length}
        </span>
      </div>
    </div>,
    document.body
  );
};

export default FullscreenGallery;
