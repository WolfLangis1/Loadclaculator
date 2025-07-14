import React from 'react';
import type { SLDComponent } from '../../types/sld';

interface RealisticComponentRendererProps {
  component: SLDComponent;
  size: { width: number; height: number };
  isSelected?: boolean;
  isHovered?: boolean;
  baseProps?: any;
  accessibilityMode?: boolean;
}

export const RealisticComponentRenderer: React.FC<RealisticComponentRendererProps> = ({
  component,
  size,
  isSelected = false,
  isHovered = false,
  baseProps = {},
  accessibilityMode = false
}) => {
  // Extract key from baseProps to avoid JSX warning
  const { key: componentKey, ...safeBaseProps } = baseProps;
  const getComponentLabel = (comp: SLDComponent): string => {
    const specs = comp.specifications || {};
    const manufacturer = specs.manufacturer || comp.manufacturer || '';
    const model = specs.model || comp.model || '';
    const rating = specs.rating || specs.powerKW || specs.capacityKWh || '';
    
    switch (comp.type) {
      case 'main_panel':
        const panelType = specs.mainBreakerType === 'dual' ? 'Dual Main' : 
                         specs.mainBreakerType === 'single' ? 'Single Main' : 
                         specs.fusedPullout ? 'Fused Pullout' : 
                         specs.solarSidecar ? 'w/Solar Sidecar' : '';
        const spaces = specs.spaces ? `${specs.spaces}SP` : '';
        return `${manufacturer} ${model}\n${rating}A ${panelType}\n${spaces}`.trim();
      
      case 'battery':
        const capacity = specs.capacityKWh ? `${specs.capacityKWh}kWh` : '';
        const power = specs.powerKW ? `${specs.powerKW}kW` : specs.powerKVA ? `${specs.powerKVA}kVA` : '';
        return `${manufacturer} ${model}\n${capacity} ${power}`.trim();
      
      case 'inverter':
        const invPower = specs.acOutputKW ? `${specs.acOutputKW}kW` : '';
        const efficiency = specs.efficiency ? `${(specs.efficiency * 100).toFixed(1)}%` : '';
        return `${manufacturer} ${model}\n${invPower} ${efficiency}`.trim();
      
      default:
        return `${manufacturer} ${model}\n${rating}`.trim();
    }
  };

  const renderMainPanel = () => {
    const specs = component.specifications || {};
    const rating = specs.rating || 200;
    const spaces = specs.spaces || 40;
    const manufacturer = specs.manufacturer || component.manufacturer || 'Square D';
    const model = specs.model || 'QO140M200PC';
    const hasMainBreaker = !specs.fusedPullout;
    const hasMeterSocket = specs.meterSocket;
    const hasSolarSidecar = specs.solarSidecar;
    
    const width = size.width || 120;
    const height = size.height || 160;
    const meterHeight = hasMeterSocket ? 40 : 0;
    const panelHeight = height - meterHeight;
    
    return (
      <g {...safeBaseProps}>
        {/* Meter Socket (if present) */}
        {hasMeterSocket && (
          <g>
            <rect 
              x="0" 
              y="0" 
              width={width} 
              height={meterHeight} 
              fill="#e5e7eb" 
              stroke="#6b7280" 
              strokeWidth="2"
            />
            <circle 
              cx={width * 0.25} 
              cy={meterHeight / 2} 
              r="8" 
              fill="#374151" 
              stroke="#1f2937" 
              strokeWidth="1"
            />
            <circle 
              cx={width * 0.75} 
              cy={meterHeight / 2} 
              r="8" 
              fill="#374151" 
              stroke="#1f2937" 
              strokeWidth="1"
            />
            <text 
              x={width / 2} 
              y={meterHeight / 2 + 3} 
              textAnchor="middle" 
              fontSize="8" 
              fill="#1f2937"
              className="select-none"
            >
              METER
            </text>
          </g>
        )}
        
        {/* Main Panel Body */}
        <rect 
          x="0" 
          y={meterHeight} 
          width={width} 
          height={panelHeight} 
          fill="#f9fafb" 
          stroke="#374151" 
          strokeWidth="3"
          filter={isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' : undefined}
        />
        
        {/* Panel Door */}
        <rect 
          x="5" 
          y={meterHeight + 5} 
          width={width - 10} 
          height={panelHeight - 10} 
          fill="#ffffff" 
          stroke="#9ca3af" 
          strokeWidth="1"
        />
        
        {/* Main Breaker (if present) */}
        {hasMainBreaker && (
          <g>
            <rect 
              x={width * 0.15} 
              y={meterHeight + 15} 
              width={width * 0.7} 
              height="25" 
              fill="#ef4444" 
              stroke="#dc2626" 
              strokeWidth="1"
              rx="2"
            />
            <text 
              x={width / 2} 
              y={meterHeight + 27} 
              textAnchor="middle" 
              fontSize="10" 
              fontWeight="bold" 
              fill="white"
              className="select-none"
            >
              {rating}A MAIN
            </text>
          </g>
        )}
        
        {/* Branch Circuit Breakers */}
        {Array.from({ length: Math.min(Math.floor(spaces / 2), 8) }, (_, i) => (
          <g key={i}>
            {/* Left side breakers */}
            <rect 
              x="8" 
              y={meterHeight + 50 + (i * 12)} 
              width="15" 
              height="10" 
              fill="#3b82f6" 
              stroke="#1d4ed8" 
              strokeWidth="0.5"
              rx="1"
            />
            {/* Right side breakers */}
            <rect 
              x={width - 23} 
              y={meterHeight + 50 + (i * 12)} 
              width="15" 
              height="10" 
              fill="#3b82f6" 
              stroke="#1d4ed8" 
              strokeWidth="0.5"
              rx="1"
            />
          </g>
        ))}
        
        {/* Bus Bars */}
        <line 
          x1={width * 0.35} 
          y1={meterHeight + 45} 
          x2={width * 0.35} 
          y2={height - 10} 
          stroke="#fbbf24" 
          strokeWidth="3"
        />
        <line 
          x1={width * 0.65} 
          y1={meterHeight + 45} 
          x2={width * 0.65} 
          y2={height - 10} 
          stroke="#fbbf24" 
          strokeWidth="3"
        />
        
        {/* Solar Sidecar (if present) */}
        {hasSolarSidecar && (
          <g>
            <rect 
              x={width} 
              y={meterHeight + 20} 
              width="30" 
              height="40" 
              fill="#fef3c7" 
              stroke="#f59e0b" 
              strokeWidth="2"
            />
            <text 
              x={width + 15} 
              y={meterHeight + 40} 
              textAnchor="middle" 
              fontSize="8" 
              fill="#92400e"
              className="select-none"
            >
              SOLAR
            </text>
            <text 
              x={width + 15} 
              y={meterHeight + 50} 
              textAnchor="middle" 
              fontSize="6" 
              fill="#92400e"
              className="select-none"
            >
              SIDECAR
            </text>
          </g>
        )}
        
        {/* Component Label */}
        <text 
          x={width / 2} 
          y={height + 15} 
          textAnchor="middle" 
          fontSize="9" 
          fontWeight="bold" 
          fill="#1f2937"
          className="select-none"
        >
          {manufacturer}
        </text>
        <text 
          x={width / 2} 
          y={height + 27} 
          textAnchor="middle" 
          fontSize="8" 
          fill="#374151"
          className="select-none"
        >
          {model}
        </text>
        <text 
          x={width / 2} 
          y={height + 39} 
          textAnchor="middle" 
          fontSize="8" 
          fill="#6b7280"
          className="select-none"
        >
          {rating}A • {spaces}SP
        </text>
        
        {/* Selection outline */}
        {isSelected && (
          <rect 
            x="-2" 
            y="-2" 
            width={width + (hasSolarSidecar ? 34 : 4)} 
            height={height + 4} 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="3" 
            strokeDasharray="5,5"
          />
        )}
        
        {accessibilityMode && (
          <desc id={`component-${component.id}-desc`}>
            {manufacturer} {model} main electrical panel, {rating} amp rating, {spaces} spaces
            {hasMainBreaker ? ' with main breaker' : ''}
            {hasMeterSocket ? ', includes meter socket' : ''}
            {hasSolarSidecar ? ', with solar sidecar' : ''}
          </desc>
        )}
      </g>
    );
  };

  const renderBattery = () => {
    const specs = component.specifications || {};
    const manufacturer = specs.manufacturer || component.manufacturer || 'Tesla';
    const model = specs.model || component.model || 'Powerwall 3';
    const capacity = specs.capacityKWh || specs.capacity || 13.5;
    const power = specs.powerKW || specs.powerKVA || 11.5;
    const chemistry = specs.chemistry || 'Li-ion';
    
    const width = size.width || 100;
    const height = size.height || 120;
    
    // Different designs for different manufacturers
    if (manufacturer.toLowerCase().includes('tesla')) {
      return (
        <g {...safeBaseProps}>
          {/* Tesla Powerwall design */}
          <rect 
            x="0" 
            y="0" 
            width={width} 
            height={height} 
            fill="#f8fafc" 
            stroke="#1e293b" 
            strokeWidth="3"
            rx="8"
            filter={isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' : undefined}
          />
          
          {/* Tesla logo area */}
          <rect 
            x="5" 
            y="5" 
            width={width - 10} 
            height="20" 
            fill="#e11d48" 
            rx="4"
          />
          <text 
            x={width / 2} 
            y="17" 
            textAnchor="middle" 
            fontSize="10" 
            fontWeight="bold" 
            fill="white"
            className="select-none"
          >
            TESLA
          </text>
          
          {/* Battery cell representation */}
          <rect 
            x="10" 
            y="35" 
            width={width - 20} 
            height={height - 55} 
            fill="#10b981" 
            stroke="#059669" 
            strokeWidth="2"
            rx="4"
          />
          
          {/* Power level indicator */}
          {Array.from({ length: 5 }, (_, i) => (
            <rect 
              key={i}
              x="15" 
              y={40 + (i * 12)} 
              width={width - 30} 
              height="8" 
              fill={i < 4 ? "#22c55e" : "#dcfce7"} 
              rx="2"
            />
          ))}
          
          {/* Labels */}
          <text 
            x={width / 2} 
            y={height + 15} 
            textAnchor="middle" 
            fontSize="9" 
            fontWeight="bold" 
            fill="#1f2937"
            className="select-none"
          >
            {model}
          </text>
          <text 
            x={width / 2} 
            y={height + 27} 
            textAnchor="middle" 
            fontSize="8" 
            fill="#374151"
            className="select-none"
          >
            {capacity}kWh • {power}kW
          </text>
        </g>
      );
    } else if (manufacturer.toLowerCase().includes('enphase')) {
      return (
        <g {...safeBaseProps}>
          {/* Enphase IQ Battery design */}
          <rect 
            x="0" 
            y="0" 
            width={width} 
            height={height} 
            fill="#ffffff" 
            stroke="#6366f1" 
            strokeWidth="3"
            rx="6"
            filter={isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' : undefined}
          />
          
          {/* Enphase branding */}
          <rect 
            x="5" 
            y="5" 
            width={width - 10} 
            height="18" 
            fill="#6366f1" 
            rx="3"
          />
          <text 
            x={width / 2} 
            y="16" 
            textAnchor="middle" 
            fontSize="9" 
            fontWeight="bold" 
            fill="white"
            className="select-none"
          >
            ENPHASE
          </text>
          
          {/* IQ Battery modules */}
          <rect 
            x="8" 
            y="30" 
            width={width - 16} 
            height={(height - 45) / 2} 
            fill="#ddd6fe" 
            stroke="#7c3aed" 
            strokeWidth="1"
            rx="3"
          />
          <rect 
            x="8" 
            y={35 + (height - 45) / 2} 
            width={width - 16} 
            height={(height - 45) / 2} 
            fill="#ddd6fe" 
            stroke="#7c3aed" 
            strokeWidth="1"
            rx="3"
          />
          
          {/* Microinverter indicators */}
          <circle cx={width * 0.25} cy="35" r="3" fill="#10b981" />
          <circle cx={width * 0.75} cy="35" r="3" fill="#10b981" />
          <circle cx={width * 0.25} cy={height - 15} r="3" fill="#10b981" />
          <circle cx={width * 0.75} cy={height - 15} r="3" fill="#10b981" />
          
          {/* Labels */}
          <text 
            x={width / 2} 
            y={height + 15} 
            textAnchor="middle" 
            fontSize="9" 
            fontWeight="bold" 
            fill="#1f2937"
            className="select-none"
          >
            {model}
          </text>
          <text 
            x={width / 2} 
            y={height + 27} 
            textAnchor="middle" 
            fontSize="8" 
            fill="#374151"
            className="select-none"
          >
            {capacity}kWh • {power}kVA
          </text>
        </g>
      );
    }
    
    // Generic battery design
    return (
      <g {...safeBaseProps}>
        <rect 
          x="0" 
          y="0" 
          width={width} 
          height={height} 
          fill="#dcfce7" 
          stroke="#16a34a" 
          strokeWidth="2"
          rx="4"
        />
        {/* Battery cells */}
        {Array.from({ length: 3 }, (_, i) => (
          <rect
            key={i}
            x="5"
            y={5 + (i * (height - 10) / 3)}
            width={width - 10}
            height={(height - 10) / 3 - 2}
            fill="#22c55e"
            stroke="#16a34a"
            strokeWidth="1"
            rx="2"
          />
        ))}
        <text 
          x={width / 2} 
          y={height + 15} 
          textAnchor="middle" 
          fontSize="9" 
          fontWeight="bold" 
          fill="#1f2937"
          className="select-none"
        >
          {manufacturer} {model}
        </text>
        <text 
          x={width / 2} 
          y={height + 27} 
          textAnchor="middle" 
          fontSize="8" 
          fill="#374151"
          className="select-none"
        >
          {capacity}kWh • {power}kW
        </text>
      </g>
    );
  };

  const renderInverter = () => {
    const specs = component.specifications || {};
    const manufacturer = specs.manufacturer || component.manufacturer || 'Generic';
    const model = specs.model || component.model || 'String Inverter';
    const power = specs.acOutputKW || specs.powerKW || 7.6;
    const efficiency = specs.efficiency || 0.97;
    const type = specs.inverterType || 'string';
    
    const width = size.width || 80;
    const height = size.height || 60;
    
    if (type === 'micro') {
      // Microinverter design
      return (
        <g {...safeBaseProps}>
          <rect 
            x="0" 
            y="0" 
            width={width} 
            height={height} 
            fill="#dbeafe" 
            stroke="#2563eb" 
            strokeWidth="2"
            rx="4"
            filter={isHovered ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' : undefined}
          />
          
          {/* DC input terminals */}
          <circle cx="10" cy="15" r="3" fill="#dc2626" />
          <circle cx="10" cy="25" r="3" fill="#000000" />
          
          {/* AC output terminals */}
          <circle cx={width - 10} cy="15" r="3" fill="#16a34a" />
          <circle cx={width - 10} cy="25" r="3" fill="#000000" />
          <circle cx={width - 10} cy="35" r="3" fill="#ffffff" stroke="#000000" strokeWidth="1" />
          
          {/* Power conversion indicator */}
          <text 
            x={width / 2} 
            y={height / 2} 
            textAnchor="middle" 
            fontSize="8" 
            fontWeight="bold" 
            fill="#1e40af"
            className="select-none"
          >
            ∿
          </text>
          
          <text 
            x={width / 2} 
            y={height + 12} 
            textAnchor="middle" 
            fontSize="8" 
            fontWeight="bold" 
            fill="#1f2937"
            className="select-none"
          >
            {manufacturer}
          </text>
          <text 
            x={width / 2} 
            y={height + 22} 
            textAnchor="middle" 
            fontSize="7" 
            fill="#374151"
            className="select-none"
          >
            {model}
          </text>
          <text 
            x={width / 2} 
            y={height + 32} 
            textAnchor="middle" 
            fontSize="7" 
            fill="#6b7280"
            className="select-none"
          >
            {(power * 1000)}W
          </text>
        </g>
      );
    }
    
    // String inverter design
    return (
      <g {...safeBaseProps}>
        <rect 
          x="0" 
          y="0" 
          width={width} 
          height={height} 
          fill="#f8fafc" 
          stroke="#334155" 
          strokeWidth="2"
          rx="4"
          filter={isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' : undefined}
        />
        
        {/* Display screen */}
        <rect 
          x="5" 
          y="5" 
          width={width - 10} 
          height="15" 
          fill="#000000" 
          rx="2"
        />
        <text 
          x={width / 2} 
          y="15" 
          textAnchor="middle" 
          fontSize="8" 
          fill="#00ff00"
          className="select-none"
        >
          {power}kW
        </text>
        
        {/* DC input section */}
        <rect 
          x="5" 
          y="25" 
          width={(width - 15) / 2} 
          height={height - 30} 
          fill="#fee2e2" 
          stroke="#dc2626" 
          strokeWidth="1"
          rx="2"
        />
        <text 
          x={(width - 15) / 4 + 5} 
          y={height - 10} 
          textAnchor="middle" 
          fontSize="6" 
          fill="#991b1b"
          className="select-none"
        >
          DC
        </text>
        
        {/* AC output section */}
        <rect 
          x={(width - 15) / 2 + 10} 
          y="25" 
          width={(width - 15) / 2} 
          height={height - 30} 
          fill="#dcfce7" 
          stroke="#16a34a" 
          strokeWidth="1"
          rx="2"
        />
        <text 
          x={width - (width - 15) / 4 - 5} 
          y={height - 10} 
          textAnchor="middle" 
          fontSize="6" 
          fill="#166534"
          className="select-none"
        >
          AC
        </text>
        
        <text 
          x={width / 2} 
          y={height + 12} 
          textAnchor="middle" 
          fontSize="8" 
          fontWeight="bold" 
          fill="#1f2937"
          className="select-none"
        >
          {manufacturer}
        </text>
        <text 
          x={width / 2} 
          y={height + 22} 
          textAnchor="middle" 
          fontSize="7" 
          fill="#374151"
          className="select-none"
        >
          {model}
        </text>
        <text 
          x={width / 2} 
          y={height + 32} 
          textAnchor="middle" 
          fontSize="7" 
          fill="#6b7280"
          className="select-none"
        >
          {power}kW • {(efficiency * 100).toFixed(1)}%
        </text>
      </g>
    );
  };

  // Main render switch
  switch (component.type) {
    case 'main_panel':
      return renderMainPanel();
    case 'battery':
      return renderBattery();
    case 'inverter':
      return renderInverter();
    default:
      // Return a simple placeholder for unhandled types
      return (
        <g {...safeBaseProps}>
          <rect 
            width={size.width || 60} 
            height={size.height || 40} 
            fill="#f3f4f6" 
            stroke="#6b7280" 
            strokeWidth="2"
          />
          <text 
            x={(size.width || 60) / 2} 
            y={(size.height || 40) / 2} 
            textAnchor="middle" 
            fontSize="10" 
            fill="#374151"
            className="select-none"
          >
            {component.type}
          </text>
        </g>
      );
  }
};

export default RealisticComponentRenderer;