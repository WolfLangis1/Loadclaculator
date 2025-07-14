import React from 'react';
import { Tooltip } from './Tooltip';
import { TOOLTIP_DEFINITIONS, TooltipKey } from '../../constants/tooltipDefinitions';
import { getDefinition } from '../../services/definitionsService';

interface TooltipWrapperProps {
  term: TooltipKey | string;
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
  // Try legacy tooltip definitions first, then new definitions service
  const legacyDefinition = TOOLTIP_DEFINITIONS[term as TooltipKey];
  const newDefinition = getDefinition(term as string);
  
  let content: React.ReactNode = legacyDefinition;
  if (!content && newDefinition) {
    content = (
      <div className="max-w-sm">
        <div className="font-semibold text-sm mb-1">{newDefinition.term}</div>
        <div className="text-xs mb-2">{newDefinition.definition}</div>
        {newDefinition.details && (
          <div className="text-xs text-gray-300 mb-2">{newDefinition.details}</div>
        )}
        {newDefinition.necReference && (
          <div className="text-xs font-mono text-blue-300">{newDefinition.necReference}</div>
        )}
      </div>
    );
  }
  
  if (!content) {
    return <>{children}</>;
  }

  return (
    <Tooltip content={content} position={position} className={className}>
      <span className="border-b border-dashed border-gray-400 cursor-help">
        {children}
      </span>
    </Tooltip>
  );
};