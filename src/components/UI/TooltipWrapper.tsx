import React from 'react';
import { Tooltip } from './Tooltip';
import { TOOLTIP_DEFINITIONS, TooltipKey } from '../../constants/tooltipDefinitions';

interface TooltipWrapperProps {
  term: TooltipKey;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const TooltipWrapper: React.FC<TooltipWrapperProps> = ({ 
  term, 
  children, 
  position = 'top',
  className = ''
}) => {
  const definition = TOOLTIP_DEFINITIONS[term];
  
  if (!definition) {
    return <>{children}</>;
  }

  return (
    <Tooltip content={definition} position={position} className={className}>
      <span className="border-b border-dashed border-gray-400 cursor-help">
        {children}
      </span>
    </Tooltip>
  );
};