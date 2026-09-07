import React, { useEffect, useRef, useState } from "react";
import "./ProgressiveImage.scss";

const ProgressiveImage = ({
  alt = "",
  className = "",
  onError,
  onLoad,
  src,
  ...props
}) => {
  const imageRef = useRef(null);
  const sourceRef = useRef(src);
  const [readySource, setReadySource] = useState(null);
  const isReady = readySource === src;

  useEffect(() => {
    sourceRef.current = src;

    const image = imageRef.current;

    if (image?.complete && image.naturalWidth > 0) {
      const frameId = window.requestAnimationFrame(() => setReadySource(src));
      return () => window.cancelAnimationFrame(frameId);
    }

    return undefined;
  }, [src]);

  const revealImage = async (event) => {
    const image = event.currentTarget;
    const loadedSource = src;

    onLoad?.(event);

    try {
      await image.decode?.();
    } catch {
      // The loaded image can still be displayed when decode is unavailable.
    }

    if (sourceRef.current === loadedSource) {
      setReadySource(loadedSource);
    }
  };

  const revealBrokenImage = (event) => {
    setReadySource(src);
    onError?.(event);
  };

  return (
    <img
      {...props}
      alt={alt}
      ref={imageRef}
      src={src}
      className={`progressive-image ${isReady ? "is-ready" : ""} ${className}`.trim()}
      onLoad={revealImage}
      onError={revealBrokenImage}
    />
  );
};

export default ProgressiveImage;
