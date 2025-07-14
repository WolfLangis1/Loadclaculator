import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';

interface VirtualScrollTableProps<T> {
  data: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualScrollTable<T,>({
  data,
  itemHeight,
  containerHeight,
  renderItem,
  renderHeader,
  overscan = 5,
  className = ''
}: VirtualScrollTableProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const { startIndex, endIndex, totalHeight, offsetY } = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + visibleCount + overscan, data.length);
    const adjustedStart = Math.max(0, start - overscan);

    return {
      startIndex: adjustedStart,
      endIndex: end,
      totalHeight: data.length * itemHeight,
      offsetY: adjustedStart * itemHeight
    };
  }, [scrollTop, itemHeight, containerHeight, data.length, overscan]);

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  // Render visible items
  const visibleItems = useMemo(() => {
    const items = [];
    for (let i = startIndex; i < endIndex; i++) {
      const item = data[i];
      if (item) {
        const style: React.CSSProperties = {
          position: 'absolute',
          top: i * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight
        };
        items.push(renderItem(item, i, style));
      }
    }
    return items;
  }, [data, startIndex, endIndex, itemHeight, renderItem]);

  // Performance monitoring
  useEffect(() => {
    console.log(`VirtualScrollTable: Rendering ${endIndex - startIndex} of ${data.length} items`);
  }, [startIndex, endIndex, data.length]);

  return (
    <div className={`virtual-scroll-table ${className}`}>
      {renderHeader && (
        <div className="virtual-scroll-header sticky top-0 z-10">
          {renderHeader()}
        </div>
      )}
      
      <div
        ref={scrollElementRef}
        className="virtual-scroll-container overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div
          className="virtual-scroll-inner relative"
          style={{ height: totalHeight }}
        >
          <div
            className="virtual-scroll-items"
            style={{ transform: `translateY(${offsetY}px)` }}
          >
            {visibleItems}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for virtual scrolling with automatic sizing
export const useVirtualScroll = <T,>(
  data: T[],
  containerRef: React.RefObject<HTMLElement>,
  estimatedItemHeight = 50
) => {
  const [containerHeight, setContainerHeight] = useState(600);
  const [itemHeight, setItemHeight] = useState(estimatedItemHeight);

  // Observe container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  // Measure actual item height from first rendered item
  const measureItemHeight = useCallback((element: HTMLElement) => {
    if (element) {
      const height = element.getBoundingClientRect().height;
      if (height !== itemHeight) {
        setItemHeight(height);
      }
    }
  }, [itemHeight]);

  return {
    containerHeight,
    itemHeight,
    measureItemHeight,
    visibleItemCount: Math.ceil(containerHeight / itemHeight)
  };
};

// Virtual load table component
interface VirtualLoadTableProps<T> {
  loads: T[];
  renderLoadRow: (load: T, index: number) => React.ReactNode;
  headers: string[];
  className?: string;
  emptyMessage?: string;
}

export function VirtualLoadTable<T extends { id: number },>({
  loads,
  renderLoadRow,
  headers,
  className = '',
  emptyMessage = 'No loads to display'
}: VirtualLoadTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { containerHeight, itemHeight, measureItemHeight } = useVirtualScroll(loads, containerRef);

  const renderHeader = useCallback(() => (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="grid grid-cols-7 gap-4 px-4 py-3">
        {headers.map((header, index) => (
          <div key={index} className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {header}
          </div>
        ))}
      </div>
    </div>
  ), [headers]);

  const renderItem = useCallback((load: T, index: number, style: React.CSSProperties) => (
    <div
      key={load.id}
      style={style}
      className="border-b border-gray-200"
      ref={index === 0 ? (el: HTMLDivElement | null) => el && measureItemHeight(el) : undefined}
    >
      {renderLoadRow(load, index)}
    </div>
  ), [renderLoadRow, measureItemHeight]);

  if (loads.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`virtual-load-table ${className}`}>
      <VirtualScrollTable
        data={loads}
        itemHeight={itemHeight}
        containerHeight={Math.min(containerHeight, 800)} // Max height increased to 800px
        renderItem={renderItem}
        renderHeader={renderHeader}
        overscan={3}
      />
    </div>
  );
}

// Performance optimized list item component
export const VirtualListItem = React.memo<{
  children: React.ReactNode;
  style: React.CSSProperties;
  className?: string;
}>(({ children, style, className = '' }) => (
  <div className={`virtual-list-item ${className}`} style={style}>
    {children}
  </div>
));

VirtualListItem.displayName = 'VirtualListItem';