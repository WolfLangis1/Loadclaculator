import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  id?: string;
}

export const Tooltip: React.FC<TooltipProps> = React.memo(({ 
  content, 
  children, 
  position = 'top',
  className = '',
  id
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Generate unique ID for accessibility
  const tooltipId = id || `tooltip-${Math.random().toString(36).substr(2, 9)}`;

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        y = triggerRect.top - tooltipRect.height - 8;
        break;
      case 'bottom':
        x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        y = triggerRect.bottom + 8;
        break;
      case 'left':
        x = triggerRect.left - tooltipRect.width - 8;
        y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        break;
      case 'right':
        x = triggerRect.right + 8;
        y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        break;
    }

    // Keep tooltip within viewport
    x = Math.max(8, Math.min(x, viewport.width - tooltipRect.width - 8));
    y = Math.max(8, Math.min(y, viewport.height - tooltipRect.height - 8));

    setTooltipPosition({ x, y });
  }, [position]);

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible]);

  const handleMouseEnter = React.useCallback(() => {
    setIsVisible(true);
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleFocus = React.useCallback(() => {
    setIsVisible(true);
  }, []);

  const handleBlur = React.useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsVisible(false);
    }
  }, []);

  const tooltipElement = isVisible && (
    <div
      ref={tooltipRef}
      className={`fixed z-50 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg max-w-xs pointer-events-none ${className}`}
      style={{
        left: tooltipPosition.x,
        top: tooltipPosition.y,
      }}
    >
      {content}
      <div
        className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
          position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' :
          position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' :
          position === 'left' ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2' :
          'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2'
        }`}
      />
    </div>
  );

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
      {typeof document !== 'undefined' && createPortal(tooltipElement, document.body)}
    </>
  );
};