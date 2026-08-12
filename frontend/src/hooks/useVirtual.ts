/**
 * useVirtual — a zero-dependency virtual-scroll engine.
 *
 * Strategy:
 *  • The scroll container has a fixed CSS height and overflow-y: scroll.
 *  • A single <tbody> receives two spacer <tr>s (top + bottom) whose
 *    combined height equals (totalItems × ROW_HEIGHT) minus the rendered slice.
 *  • Only startIndex..stopIndex rows are rendered to the DOM at any time.
 *  • ResizeObserver keeps containerHeight in sync as the viewport changes.
 *  • Scroll events are read via onScroll on the container ref; no rAF
 *    throttle needed because React batches state updates.
 *
 * Usage:
 *   const { containerRef, onScroll, virtualItems, topPad, bottomPad } =
 *     useVirtual({ count: allRows.length, rowHeight: ROW_HEIGHT, overscan: 8 });
 */

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

export interface VirtualItem {
  index: number;
  start: number; // px offset from top of list
}

interface UseVirtualOptions {
  /** Total number of rows in the full dataset */
  count: number;
  /** Fixed height (px) of every row — must match CSS */
  rowHeight: number;
  /** Number of extra rows rendered above and below the visible window */
  overscan?: number;
}

interface UseVirtualReturn {
  /** Attach this ref to the scrollable container div */
  containerRef: RefObject<HTMLDivElement | null>;
  /** Attach this handler to the container's onScroll */
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  /** The slice of virtual items currently rendered */
  virtualItems: VirtualItem[];
  /** Height of the top spacer <tr> in px */
  topPad: number;
  /** Height of the bottom spacer <tr> in px */
  bottomPad: number;
  /** Total scrollable height = count × rowHeight */
  totalHeight: number;
  /** Index of first rendered row */
  startIndex: number;
  /** Index of last rendered row */
  stopIndex: number;
  /** Scroll to a specific row index */
  scrollToIndex: (index: number) => void;
}

export function useVirtual({
  count,
  rowHeight,
  overscan = 8,
}: UseVirtualOptions): UseVirtualReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  // Keep containerHeight synced with actual rendered size via ResizeObserver
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    setContainerHeight(el.clientHeight);

    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Derived values
  const totalHeight = count * rowHeight;

  const rawStart = Math.floor(scrollTop / rowHeight);
  const rawStop  = Math.ceil((scrollTop + containerHeight) / rowHeight);

  const startIndex = Math.max(0, rawStart - overscan);
  const stopIndex  = Math.min(count - 1, rawStop + overscan);

  // Build the virtual items list (only the rendered slice)
  const virtualItems: VirtualItem[] = [];
  for (let i = startIndex; i <= stopIndex; i++) {
    virtualItems.push({ index: i, start: i * rowHeight });
  }

  // Spacer heights maintain correct scroll dimensions
  const topPad    = startIndex * rowHeight;
  const bottomPad = Math.max(0, (count - 1 - stopIndex) * rowHeight);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop((e.currentTarget as HTMLDivElement).scrollTop);
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = containerRef.current;
      if (!el) return;
      el.scrollTop = index * rowHeight;
    },
    [rowHeight]
  );

  return {
    containerRef,
    onScroll,
    virtualItems,
    topPad,
    bottomPad,
    totalHeight,
    startIndex,
    stopIndex,
    scrollToIndex,
  };
}
