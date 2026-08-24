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

    let hasRevealed = false;
    let observer;

    const reveal = () => {
      if (hasRevealed) return;

      hasRevealed = true;
      setIsVisible(true);
      observer?.disconnect();
    };

    const revealIfReached = () => {
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const { top } = element.getBoundingClientRect();

      // A large scroll step can move a section from below to above the
      // viewport without crossing an IntersectionObserver threshold.
      if (top <= viewportHeight - 48) reveal();
    };

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) reveal();
      },
      {
        rootMargin: "0px 0px -48px",
        threshold: 0.12,
      }
    );

    observer.observe(element);

    window.addEventListener("scroll", revealIfReached, { passive: true });
    window.addEventListener("resize", revealIfReached);
    revealIfReached();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", revealIfReached);
      window.removeEventListener("resize", revealIfReached);
    };
  }, [isVisible]);

  return { elementRef, isVisible };
};

export default useReveal;
