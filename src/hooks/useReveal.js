import { useEffect, useRef, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const useReveal = () => {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(
    () =>
      typeof window === "undefined" ||
      !("IntersectionObserver" in window) ||
      prefersReducedMotion()
  );

  useEffect(() => {
    const element = elementRef.current;

    if (!element || isVisible) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setIsVisible(true);
        observer.disconnect();
      },
      {
        rootMargin: "0px 0px -48px",
        threshold: 0.12,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [isVisible]);

  return { elementRef, isVisible };
};

export default useReveal;
