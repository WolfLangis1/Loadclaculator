/**
 * Realistic Electrical Component Symbols
 * 
 * Accurate SVG representations of real-world electrical components
 * Based on IEEE 315/ANSI Y32.2 standards and manufacturer specifications
 */

import React from 'react';

interface ElectricalSymbolProps {
  width?: number;
  height?: number;
  strokeWidth?: number;
  color?: string;
  fillColor?: string;
  className?: string;
  style?: React.CSSProperties;
  amperage?: number;
  voltage?: string;
  poles?: number;
  showRating?: boolean;
}

const defaultProps: Required<Pick<ElectricalSymbolProps, 'width' | 'height' | 'strokeWidth' | 'color' | 'fillColor'>> = {
  width: 80,
  height: 80,
  strokeWidth: 2,
  color: '#1f2937',
  fillColor: 'none'
};

// ============= MAIN ELECTRICAL PANELS =============

export const MainElectricalPanel: React.FC<ElectricalSymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style, amperage, showRating } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 80 80" className={className} style={style}>
      {/* Panel box */}
      <rect x="15" y="10" width="50" height="60" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      
      {/* Panel door lines */}
      <line x1="15" y1="40" x2="65" y2="40" stroke={color} strokeWidth={strokeWidth/2} />
      <line x1="40" y1="10" x2="40" y2="70" stroke={color} strokeWidth={strokeWidth/2} />
      
      {/* Breaker spaces (represented as small rectangles) */}
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i}>
          <rect x={20 + (i % 2) * 20} y={15 + Math.floor(i / 2) * 15} width="8" height="10" 
                fill="#e5e7eb" stroke={color} strokeWidth={strokeWidth/3} />
        </g>
      ))}
      
      {/* Main breaker at top */}
      <rect x="25" y="12" width="30" height="8" fill="#374151" stroke={color} strokeWidth={strokeWidth/2} />
      
      {/* Panel label */}
      <text x="40" y="77" textAnchor="middle" fontSize="8" fill={color} fontFamily="Arial, sans-serif">
        MAIN PANEL
      </text>
      
      {/* Rating display */}
      {showRating && amperage && (
        <text x="40" y="6" textAnchor="middle" fontSize="10" fill={color} fontFamily="Arial, sans-serif" fontWeight="bold">
          {amperage}A
        </text>
      )}
      
      {/* Connection points */}
      <circle cx="10" cy="25" r="2" fill={color} />
      <circle cx="10" cy="35" r="2" fill={color} />
      <circle cx="70" cy="40" r="2" fill={color} />
    </svg>
  );
};

export const SubPanel: React.FC<ElectricalSymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style, amperage, showRating } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 80 80" className={className} style={style}>
      {/* Sub-panel box (smaller than main) */}
      <rect x="20" y="15" width="40" height="50" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      
      {/* Panel door lines */}
      <line x1="20" y1="40" x2="60" y2="40" stroke={color} strokeWidth={strokeWidth/2} />
      <line x1="40" y1="15" x2="40" y2="65" stroke={color} strokeWidth={strokeWidth/2} />
      
      {/* Breaker spaces */}
      {Array.from({ length: 4 }, (_, i) => (
        <g key={i}>
          <rect x={25 + (i % 2) * 15} y={20 + Math.floor(i / 2) * 15} width="6" height="8" 
                fill="#e5e7eb" stroke={color} strokeWidth={strokeWidth/3} />
        </g>
      ))}
      
      {/* Sub-panel label */}
      <text x="40" y="72" textAnchor="middle" fontSize="8" fill={color} fontFamily="Arial, sans-serif">
        SUB PANEL
      </text>
      
      {/* Rating display */}
      {showRating && amperage && (
        <text x="40" y="10" textAnchor="middle" fontSize="10" fill={color} fontFamily="Arial, sans-serif" fontWeight="bold">
          {amperage}A
        </text>
      )}
      
      {/* Connection points */}
      <circle cx="15" cy="30" r="2" fill={color} />
      <circle cx="15" cy="40" r="2" fill={color} />
      <circle cx="65" cy="35" r="2" fill={color} />
    </svg>
  );
};

// ============= CIRCUIT BREAKERS =============

export const CircuitBreakerSP: React.FC<ElectricalSymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style, amperage, showRating } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 80 80" className={className} style={style}>
      {/* Breaker body */}
      <rect x="25" y="20" width="30" height="40" rx="3" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      
      {/* Breaker switch */}
      <rect x="35" y="25" width="10" height="15" fill="#374151" stroke={color} strokeWidth={strokeWidth/2} />
      
      {/* Switch handle */}
      <rect x="37" y="22" width="6" height="8" fill="#6b7280" stroke={color} strokeWidth={strokeWidth/3} />
      
      {/* Terminal screws */}
      <circle cx="40" cy="15" r="3" fill="#e5e7eb" stroke={color} strokeWidth={strokeWidth/2} />
      <circle cx="40" cy="65" r="3" fill="#e5e7eb" stroke={color} strokeWidth={strokeWidth/2} />
      
      {/* Connection wires */}
      <line x1="40" y1="12" x2="40" y2="5" stroke={color} strokeWidth={strokeWidth} />
      <line x1="40" y1="68" x2="40" y2="75" stroke={color} strokeWidth={strokeWidth} />
      
      {/* Breaker label */}
      <text x="40" y="52" textAnchor="middle" fontSize="8" fill="white" fontFamily="Arial, sans-serif" fontWeight="bold">
        CB
      </text>
      
      {/* Rating display */}
      {showRating && amperage && (
        <text x="40" y="77" textAnchor="middle" fontSize="9" fill={color} fontFamily="Arial, sans-serif" fontWeight="bold">
          {amperage}A
        </text>
      )}
    </svg>
  );
};

export const CircuitBreakerDP: React.FC<ElectricalSymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style, amperage, showRating } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 80 80" className={className} style={style}>
      {/* Double breaker body */}
      <rect x="20" y="20" width="40" height="40" rx="3" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      
      {/* Breaker switches */}
      <rect x="25" y="25" width="12" height="15" fill="#374151" stroke={color} strokeWidth={strokeWidth/2} />
      <rect x="43" y="25" width="12" height="15" fill="#374151" stroke={color} strokeWidth={strokeWidth/2} />
      
      {/* Switch handles */}
      <rect x="27" y="22" width="8" height="8" fill="#6b7280" stroke={color} strokeWidth={strokeWidth/3} />
      <rect x="45" y="22" width="8" height="8" fill="#6b7280" stroke={color} strokeWidth={strokeWidth/3} />
      
      {/* Terminal screws */}
      <circle cx="31" cy="15" r="3" fill="#e5e7eb" stroke={color} strokeWidth={strokeWidth/2} />
      <circle cx="49" cy="15" r="3" fill="#e5e7eb" stroke={color} strokeWidth={strokeWidth/2} />
      <circle cx="31" cy="65" r="3" fill="#e5e7eb" stroke={color} strokeWidth={strokeWidth/2} />
      <circle cx="49" cy="65" r="3" fill="#e5e7eb" stroke={color} strokeWidth={strokeWidth/2} />
      
      {/* Connection wires */}
      <line x1="31" y1="12" x2="31" y2="5" stroke={color} strokeWidth={strokeWidth} />
      <line x1="49" y1="12" x2="49" y2="5" stroke={color} strokeWidth={strokeWidth} />
      <line x1="31" y1="68" x2="31" y2="75" stroke={color} strokeWidth={strokeWidth} />
      <line x1="49" y1="68" x2="49" y2="75" stroke={color} strokeWidth={strokeWidth} />
      
      {/* Tie bar (indicating linked breakers) */}
      <line x1="35" y1="45" x2="45" y2="45" stroke={color} strokeWidth={strokeWidth} strokeDasharray="2,2" />
      
      {/* Breaker label */}
      <text x="40" y="52" textAnchor="middle" fontSize="8" fill="white" fontFamily="Arial, sans-serif" fontWeight="bold">
        2P
      </text>
      
      {/* Rating display */}
      {showRating && amperage && (
        <text x="40" y="77" textAnchor="middle" fontSize="9" fill={color} fontFamily="Arial, sans-serif" fontWeight="bold">
          {amperage}A
        </text>
      )}
    </svg>
  );
};

// ============= METERS =============

export const ElectricMeter: React.FC<ElectricalSymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style, showRating } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 80 80" className={className} style={style}>
      {/* Meter housing */}
      <circle cx="40" cy="40" r="30" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      
      {/* Meter face */}
      <circle cx="40" cy="40" r="25" fill="#f9fafb" stroke={color} strokeWidth={strokeWidth/2} />
      
      {/* Digital display */}
      <rect x="30" y="32" width="20" height="8" fill="#1f2937" stroke={color} strokeWidth={strokeWidth/3} />
      <text x="40" y="38" textAnchor="middle" fontSize="6" fill="#10b981" fontFamily="monospace">
        12345.67
      </text>
      
      {/* Meter dials (4 small circles) */}
      <circle cx="30" cy="50" r="4" fill="#f3f4f6" stroke={color} strokeWidth={strokeWidth/3} />
      <circle cx="40" cy="50" r="4" fill="#f3f4f6" stroke={color} strokeWidth={strokeWidth/3} />
      <circle cx="50" cy="50" r="4" fill="#f3f4f6" stroke={color} strokeWidth={strokeWidth/3} />
      
      {/* Dial pointers */}
      <line x1="30" y1="50" x2="32" y2="47" stroke={color} strokeWidth={strokeWidth/4} />
      <line x1="40" y1="50" x2="38" y2="52" stroke={color} strokeWidth={strokeWidth/4} />
      <line x1="50" y1="50" x2="52" y2="48" stroke={color} strokeWidth={strokeWidth/4} />
      
      {/* Service connections */}
      <line x1="25" y1="25" x2="15" y2="15" stroke={color} strokeWidth={strokeWidth} />
      <line x1="55" y1="25" x2="65" y2="15" stroke={color} strokeWidth={strokeWidth} />
      <line x1="25" y1="55" x2="15" y2="65" stroke={color} strokeWidth={strokeWidth} />
      <line x1="55" y1="55" x2="65" y2="65" stroke={color} strokeWidth={strokeWidth} />
      
      {/* Meter label */}
      <text x="40" y="75" textAnchor="middle" fontSize="8" fill={color} fontFamily="Arial, sans-serif">
        kWh METER
      </text>
      
      {/* Connection points */}
      <circle cx="15" cy="15" r="2" fill={color} />
      <circle cx="65" cy="15" r="2" fill={color} />
      <circle cx="15" cy="65" r="2" fill={color} />
      <circle cx="65" cy="65" r="2" fill={color} />
    </svg>
  );
};

// ============= TRANSFORMERS =============

export const TransformerPadMount: React.FC<ElectricalSymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style, amperage, voltage, showRating } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 80 80" className={className} style={style}>
      {/* Transformer tank */}
      <rect x="15" y="15" width="50" height="35" rx="3" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      
      {/* Cooling fins */}
      <line x1="15" y1="20" x2="10" y2="20" stroke={color} strokeWidth={strokeWidth/2} />
      <line x1="15" y1="25" x2="10" y2="25" stroke={color} strokeWidth={strokeWidth/2} />
      <line x1="15" y1="30" x2="10" y2="30" stroke={color} strokeWidth={strokeWidth/2} />
      <line x1="15" y1="35" x2="10" y2="35" stroke={color} strokeWidth={strokeWidth/2} />
      <line x1="15" y1="40" x2="10" y2="40" stroke={color} strokeWidth={strokeWidth/2} />
      <line x1="15" y1="45" x2="10" y2="45" stroke={color} strokeWidth={strokeWidth/2} />
      
      <line x1="65" y1="20" x2="70" y2="20" stroke={color} strokeWidth={strokeWidth/2} />
      <line x1="65" y1="25" x2="70" y2="25" stroke={color} strokeWidth={strokeWidth/2} />
      <line x1="65" y1="30" x2="70" y2="30" stroke={color} strokeWidth={strokeWidth/2} />
      <line x1="65" y1="35" x2="70" y2="35" stroke={color} strokeWidth={strokeWidth/2} />
      <line x1="65" y1="40" x2="70" y2="40" stroke={color} strokeWidth={strokeWidth/2} />
      <line x1="65" y1="45" x2="70" y2="45" stroke={color} strokeWidth={strokeWidth/2} />
      
      {/* High voltage bushings */}
      <circle cx="25" cy="10" r="3" fill="#e5e7eb" stroke={color} strokeWidth={strokeWidth/2} />
      <circle cx="35" cy="10" r="3" fill="#e5e7eb" stroke={color} strokeWidth={strokeWidth/2} />
      <circle cx="45" cy="10" r="3" fill="#e5e7eb" stroke={color} strokeWidth={strokeWidth/2} />
      
      {/* Low voltage bushings */}
      <circle cx="25" cy="55" r="3" fill="#e5e7eb" stroke={color} strokeWidth={strokeWidth/2} />
      <circle cx="35" cy="55" r="3" fill="#e5e7eb" stroke={color} strokeWidth={strokeWidth/2} />
      <circle cx="45" cy="55" r="3" fill="#e5e7eb" stroke={color} strokeWidth={strokeWidth/2} />
      
      {/* Transformer symbol inside */}
      <circle cx="30" cy="32" r="8" fill="none" stroke={color} strokeWidth={strokeWidth/2} />
      <circle cx="50" cy="32" r="8" fill="none" stroke={color} strokeWidth={strokeWidth/2} />
      
      {/* Connection lines */}
      <line x1="25" y1="7" x2="25" y2="24" stroke={color} strokeWidth={strokeWidth} />
      <line x1="35" y1="7" x2="35" y2="24" stroke={color} strokeWidth={strokeWidth} />
      <line x1="45" y1="7" x2="45" y2="24" stroke={color} strokeWidth={strokeWidth} />
      
      <line x1="25" y1="58" x2="25" y2="40" stroke={color} strokeWidth={strokeWidth} />
      <line x1="35" y1="58" x2="35" y2="40" stroke={color} strokeWidth={strokeWidth} />
      <line x1="45" y1="58" x2="45" y2="40" stroke={color} strokeWidth={strokeWidth} />
      
      {/* Voltage ratings */}
      {showRating && voltage && (
        <>
          <text x="40" y="70" textAnchor="middle" fontSize="8" fill={color} fontFamily="Arial, sans-serif">
            {voltage}
          </text>
          {amperage && (
            <text x="40" y="78" textAnchor="middle" fontSize="8" fill={color} fontFamily="Arial, sans-serif">
              {amperage} kVA
            </text>
          )}
        </>
      )}
    </svg>
  );
};

// ============= MOTORS =============

export const MotorThreePhaseHeavyDuty: React.FC<ElectricalSymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style, amperage, showRating } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 80 80" className={className} style={style}>
      {/* Motor housing */}
      <circle cx="40" cy="40" r="28" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      
      {/* Motor mounting feet */}
      <rect x="15" y="60" width="50" height="6" fill="#9ca3af" stroke={color} strokeWidth={strokeWidth/2} />
      <rect x="18" y="66" width="8" height="4" fill="#9ca3af" stroke={color} strokeWidth={strokeWidth/3} />
      <rect x="54" y="66" width="8" height="4" fill="#9ca3af" stroke={color} strokeWidth={strokeWidth/3} />
      
      {/* Motor shaft */}
      <circle cx="40" cy="40" r="4" fill="#374151" stroke={color} strokeWidth={strokeWidth/2} />
      <line x1="44" y1="40" x2="65" y2="40" stroke="#374151" strokeWidth={strokeWidth} />
      
      {/* Terminal box */}
      <rect x="45" y="15" width="15" height="10" fill="#e5e7eb" stroke={color} strokeWidth={strokeWidth/2} />
      
      {/* Conduit connection */}
      <circle cx="60" cy="20" r="2" fill="#6b7280" stroke={color} strokeWidth={strokeWidth/3} />
      <line x1="62" y1="20" x2="70" y2="12" stroke={color} strokeWidth={strokeWidth} />
      
      {/* Motor winding representation */}
      <text x="40" y="35" textAnchor="middle" fontSize="14" fill={color} fontFamily="Arial, sans-serif" fontWeight="bold">
        M
      </text>
      <text x="40" y="48" textAnchor="middle" fontSize="8" fill={color} fontFamily="Arial, sans-serif">
        3Φ
      </text>
      
      {/* Connection points */}
      <circle cx="70" cy="12" r="2" fill={color} />
      
      {/* Rating display */}
      {showRating && amperage && (
        <text x="40" y="78" textAnchor="middle" fontSize="9" fill={color} fontFamily="Arial, sans-serif" fontWeight="bold">
          {amperage}A
        </text>
      )}
    </svg>
  );
};

// ============= DISCONNECT SWITCHES =============

export const DisconnectSwitch: React.FC<ElectricalSymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style, amperage, showRating } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 80 80" className={className} style={style}>
      {/* Disconnect enclosure */}
      <rect x="20" y="15" width="40" height="50" rx="3" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      
      {/* Switch handle */}
      <rect x="35" y="8" width="10" height="12" rx="2" fill="#6b7280" stroke={color} strokeWidth={strokeWidth/2} />
      
      {/* Handle position indicator */}
      <text x="40" y="6" textAnchor="middle" fontSize="6" fill={color} fontFamily="Arial, sans-serif">
        ON
      </text>
      
      {/* Switch contacts inside */}
      <circle cx="30" cy="35" r="3" fill="#e5e7eb" stroke={color} strokeWidth={strokeWidth/2} />
      <circle cx="50" cy="35" r="3" fill="#e5e7eb" stroke={color} strokeWidth={strokeWidth/2} />
      <line x1="33" y1="32" x2="47" y2="32" stroke={color} strokeWidth={strokeWidth} />
      
      {/* Connection terminals */}
      <rect x="25" y="68" width="6" height="6" fill="#e5e7eb" stroke={color} strokeWidth={strokeWidth/3} />
      <rect x="35" y="68" width="6" height="6" fill="#e5e7eb" stroke={color} strokeWidth={strokeWidth/3} />
      <rect x="45" y="68" width="6" height="6" fill="#e5e7eb" stroke={color} strokeWidth={strokeWidth/3} />
      
      {/* Connection wires */}
      <line x1="28" y1="74" x2="28" y2="78" stroke={color} strokeWidth={strokeWidth} />
      <line x1="38" y1="74" x2="38" y2="78" stroke={color} strokeWidth={strokeWidth} />
      <line x1="48" y1="74" x2="48" y2="78" stroke={color} strokeWidth={strokeWidth} />
      
      {/* Input connections */}
      <line x1="28" y1="15" x2="28" y2="5" stroke={color} strokeWidth={strokeWidth} />
      <line x1="38" y1="15" x2="38" y2="5" stroke={color} strokeWidth={strokeWidth} />
      <line x1="48" y1="15" x2="48" y2="5" stroke={color} strokeWidth={strokeWidth} />
      
      {/* Fuse indication (if fused disconnect) */}
      <rect x="26" y="45" width="4" height="8" fill="none" stroke={color} strokeWidth={strokeWidth/3} />
      <rect x="36" y="45" width="4" height="8" fill="none" stroke={color} strokeWidth={strokeWidth/3} />
      <rect x="46" y="45" width="4" height="8" fill="none" stroke={color} strokeWidth={strokeWidth/3} />
      
      {/* Connection points */}
      <circle cx="28" cy="5" r="2" fill={color} />
      <circle cx="38" cy="5" r="2" fill={color} />
      <circle cx="48" cy="5" r="2" fill={color} />
      <circle cx="28" cy="78" r="2" fill={color} />
      <circle cx="38" cy="78" r="2" fill={color} />
      <circle cx="48" cy="78" r="2" fill={color} />
      
      {/* Rating display */}
      {showRating && amperage && (
        <text x="65" y="40" textAnchor="middle" fontSize="9" fill={color} fontFamily="Arial, sans-serif" fontWeight="bold">
          {amperage}A
        </text>
      )}
    </svg>
  );
};

// Export collection
export const RealisticElectricalSymbols = {
  MainElectricalPanel,
  SubPanel,
  CircuitBreakerSP,
  CircuitBreakerDP,
  ElectricMeter,
  TransformerPadMount,
  MotorThreePhaseHeavyDuty,
  DisconnectSwitch
};

export default RealisticElectricalSymbols;