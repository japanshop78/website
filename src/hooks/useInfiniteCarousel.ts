"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseInfiniteCarouselOptions<T> {
  items: T[];
  autoPlayIntervalMs?: number;
  minLoopLength?: number;
}

export function useInfiniteCarousel<T>({
  items,
  autoPlayIntervalMs = 3000,
  minLoopLength = 5,
}: UseInfiniteCarouselOptions<T>) {
  const [itemsPerView, setItemsPerView] = useState(5);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // Responsive items per view: 5 on xl/2xl, 4 on lg, 3 on md, 2 on sm/mobile
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w >= 1280) setItemsPerView(5);
      else if (w >= 1024) setItemsPerView(4);
      else if (w >= 768) setItemsPerView(3);
      else setItemsPerView(2);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Replicate array so infinite loop scrolls seamlessly
  const baseList =
    items.length > 0 && items.length < minLoopLength
      ? [...items, ...items]
      : items;
  const listLen = baseList.length;
  const extendedItems = [...baseList, ...baseList, ...baseList];

  const [currentIndex, setCurrentIndex] = useState(listLen);

  // Keep currentIndex aligned if listLen changes
  useEffect(() => {
    if (listLen > 0) {
      setCurrentIndex((prev) => {
        if (prev < listLen || prev >= listLen * 2) {
          setIsTransitioning(false);
          return listLen;
        }
        return prev;
      });
    }
  }, [listLen]);

  // Pause when tab is inactive/minimized, and safely re-align when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
        setIsTransitioning(false);
        setCurrentIndex((prev) => (listLen > 0 ? listLen + (prev % listLen) : 0));
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [listLen]);

  const handleNext = useCallback(() => {
    if (listLen === 0) return;
    setCurrentIndex((prev) => {
      if (prev >= listLen * 2) {
        setIsTransitioning(false);
        return listLen + 1;
      }
      setIsTransitioning(true);
      return prev + 1;
    });
  }, [listLen]);

  const handlePrev = useCallback(() => {
    if (listLen === 0) return;
    setCurrentIndex((prev) => {
      if (prev <= listLen - 1) {
        setIsTransitioning(false);
        return listLen * 2 - 2;
      }
      setIsTransitioning(true);
      return prev - 1;
    });
  }, [listLen]);

  // Auto-play animation running from right to left (pauses when hovered or tab hidden)
  useEffect(() => {
    if (isPaused || listLen === 0 || autoPlayIntervalMs <= 0) return;
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      handleNext();
    }, autoPlayIntervalMs);
    return () => clearInterval(interval);
  }, [isPaused, listLen, autoPlayIntervalMs, handleNext]);

  // Seamless jump when reaching boundaries
  const handleTransitionEnd = useCallback(() => {
    if (listLen === 0) return;
    if (currentIndex >= listLen * 2 || currentIndex < listLen) {
      setIsTransitioning(false);
      setCurrentIndex((prev) => listLen + (prev % listLen));
    }
  }, [currentIndex, listLen]);

  // Touch swipe support
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current !== null) {
        const diff = e.changedTouches[0].clientX - touchStartX.current;
        if (diff < -40) handleNext();
        else if (diff > 40) handlePrev();
      }
      touchStartX.current = null;
      setIsPaused(false);
    },
    [handleNext, handlePrev]
  );

  const selectSlide = useCallback(
    (index: number) => {
      setIsTransitioning(true);
      setCurrentIndex(listLen + index);
    },
    [listLen]
  );

  const activeDotIndex = listLen > 0 ? ((currentIndex % listLen) + listLen) % listLen : 0;

  return {
    itemsPerView,
    baseList,
    listLen,
    extendedItems,
    currentIndex,
    activeDotIndex,
    isPaused,
    setIsPaused,
    isTransitioning,
    handleNext,
    handlePrev,
    handleTransitionEnd,
    handleTouchStart,
    handleTouchEnd,
    selectSlide,
  };
}
