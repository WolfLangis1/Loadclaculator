import React from 'react';
import type { SLDComponent } from '../../types/sld';

interface SLDComponentRendererProps {
  component: SLDComponent;
  isSelected: boolean;
  isDragged: boolean;
  onComponentClick: (componentId: string, event: React.MouseEvent) => void;
  onMouseDown: (componentId: string, event: React.MouseEvent) => void;
}

export const SLDComponentRenderer: React.FC<SLDComponentRendererProps> = React.memo(
  ({
    component,
    isSelected,
    isDragged,
    onComponentClick,
    onMouseDown,
  }) => {
    const renderComponentContent = (comp: SLDComponent) => {
      const commonClasses = "w-full h-full flex items-center justify-center text-xs font-medium";
      
      switch (comp.type) {
        case 'pv_array':
          return (
            <div className={`${commonClasses} bg-yellow-200 border border-yellow-400`}>
              <div className="text-center">
                <div>PV Array</div>
                <div className="text-xs">{(comp as any).numStrings}S × {(comp as any).modulesPerString}M</div>
              </div>
            </div>
          );
          
        case 'inverter':
          return (
            <div className={`${commonClasses} bg-blue-200 border border-blue-400 rounded-full`}>
              <div className="text-center">
                <div>INV</div>
                <div className="text-xs">{(comp as any).acOutputKW}kW</div>
              </div>
            </div>
          );
          
        case 'dc_disconnect':
        case 'ac_disconnect':
          return (
            <div className={`${commonClasses} bg-red-200 border border-red-400`}>
              <div className="text-center">
                <div>DISC</div>
                <div className="text-xs">{(comp as any).rating}</div>
              </div>
            </div>
          );
          
        case 'main_panel':
          return (
            <div className={`${commonClasses} bg-gray-200 border border-gray-400`}>
              <div className="text-center">
                <div>Main Panel</div>
                <div className="text-xs">{(comp as any).rating}A</div>
              </div>
            </div>
          );
          
        case 'battery':
          return (
            <div className={`${commonClasses} bg-green-200 border border-green-400`}>
              <div className="text-center">
                <div>Battery</div>
                <div className="text-xs">{(comp as any).capacityKWh}kWh</div>
              </div>
            </div>
          );
          
        case 'evse_charger':
          return (
            <div className={`${commonClasses} bg-purple-200 border border-purple-400`}>
              <div className="text-center">
                <div>EVSE</div>
                <div className="text-xs">{(comp as any).powerKW}kW</div>
              </div>
            </div>
          );
          
        case 'grid':
          return (
            <div className={`${commonClasses} bg-orange-200 border border-orange-400`}>
              <div className="text-center">
                <div>GRID</div>
                <div className="text-xs">{(comp as any).serviceVoltage}V</div>
              </div>
            </div>
          );
          
        case 'grounding_electrode':
          return (
            <div className={`${commonClasses} bg-brown-200 border border-brown-400 rounded-full`}>
              <div className="text-center">
                <div>⏚</div>
                <div className="text-xs">GND</div>
              </div>
            </div>
          );
          
        default:
          return (
            <div className={`${commonClasses} bg-gray-100 border border-gray-300`}>
              <div className="text-center">
                <div>{comp.type}</div>
                <div className="text-xs">{comp.name}</div>
              </div>
            </div>
          );
      }
    };

    return (
      <div
        key={component.id}
        className={`absolute border-2 rounded cursor-move transition-all ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-400 bg-white'
        } ${isDragged ? 'opacity-70' : ''}`}
        style={{
          left: component.position.x,
          top: component.position.y,
          width: component.size.width,
          height: component.size.height,
          transform: `rotate(${component.rotation}deg)`,
          zIndex: isSelected ? 10 : 1
        }}
        onClick={(e) => onComponentClick(component.id, e)}
        onMouseDown={(e) => onMouseDown(component.id, e)}
      >
        {renderComponentContent(component)}
        
        {component.necLabels.map((label, index) => (
          <div
            key={index}
            className="absolute text-xs font-bold text-red-600 whitespace-nowrap"
            style={{
              top: -20 - (index * 12),
              left: 0,
              fontSize: '10px'
            }}
          >
            {label}
          </div>
        ))}
      </div>
    );
  }
);
