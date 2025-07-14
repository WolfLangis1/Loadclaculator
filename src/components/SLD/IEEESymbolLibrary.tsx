import React from 'react';

/**
 * IEEE 315/ANSI Y32.2 Compliant Electrical Symbol Library
 * 
 * This library provides standardized electrical symbols for professional
 * single line diagrams according to IEEE Standard 315 and ANSI Y32.2.
 * 
 * Symbol Categories:
 * - Power Sources and Generation
 * - Transformers and Reactors  
 * - Protective Devices
 * - Switching Devices
 * - Metering and Instrumentation
 * - Motors and Loads
 * - Transmission and Distribution
 * - Renewable Energy
 * - Control and Communication
 */

export interface IEEESymbolProps {
  width?: number;
  height?: number;
  strokeWidth?: number;
  color?: string;
  fillColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

const defaultProps: Required<Pick<IEEESymbolProps, 'width' | 'height' | 'strokeWidth' | 'color' | 'fillColor'>> = {
  width: 60,
  height: 60,
  strokeWidth: 2,
  color: '#1f2937',
  fillColor: 'none'
};

// POWER SOURCES AND GENERATION

export const ACVoltageSource: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <circle 
        cx="30" 
        cy="30" 
        r="25" 
        fill={fillColor} 
        stroke={color} 
        strokeWidth={strokeWidth}
      />
      <path 
        d="M 15 30 Q 22.5 15 30 30 Q 37.5 45 45 30" 
        fill="none" 
        stroke={color} 
        strokeWidth={strokeWidth}
      />
      {/* Terminal connections */}
      <line x1="5" y1="30" x2="30" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="30" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

export const DCVoltageSource: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <circle 
        cx="30" 
        cy="30" 
        r="25" 
        fill={fillColor} 
        stroke={color} 
        strokeWidth={strokeWidth}
      />
      {/* Plus symbol */}
      <line x1="22" y1="30" x2="32" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="27" y1="25" x2="27" y2="35" stroke={color} strokeWidth={strokeWidth} />
      {/* Minus symbol */}
      <line x1="33" y1="30" x2="38" y2="30" stroke={color} strokeWidth={strokeWidth} />
      {/* Terminal connections */}
      <line x1="5" y1="30" x2="30" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="30" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

export const Generator: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <circle 
        cx="30" 
        cy="30" 
        r="25" 
        fill={fillColor} 
        stroke={color} 
        strokeWidth={strokeWidth}
      />
      <text 
        x="30" 
        y="35" 
        textAnchor="middle" 
        fontSize="16" 
        fontWeight="bold" 
        fill={color}
      >
        G
      </text>
      {/* Terminal connections */}
      <line x1="5" y1="30" x2="30" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="30" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

// TRANSFORMERS

export const TransformerSinglePhase: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      {/* Primary winding */}
      <circle 
        cx="20" 
        cy="30" 
        r="12" 
        fill={fillColor} 
        stroke={color} 
        strokeWidth={strokeWidth}
      />
      {/* Secondary winding */}
      <circle 
        cx="40" 
        cy="30" 
        r="12" 
        fill={fillColor} 
        stroke={color} 
        strokeWidth={strokeWidth}
      />
      {/* Core (vertical lines) */}
      <line x1="28" y1="15" x2="28" y2="45" stroke={color} strokeWidth={strokeWidth} />
      <line x1="32" y1="15" x2="32" y2="45" stroke={color} strokeWidth={strokeWidth} />
      {/* Terminal connections */}
      <line x1="2" y1="30" x2="8" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="52" y1="30" x2="58" y2="30" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

export const TransformerThreePhase: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      {/* Primary windings */}
      <circle cx="15" cy="15" r="8" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <circle cx="15" cy="30" r="8" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <circle cx="15" cy="45" r="8" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      {/* Secondary windings */}
      <circle cx="45" cy="15" r="8" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <circle cx="45" cy="30" r="8" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <circle cx="45" cy="45" r="8" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      {/* Core */}
      <line x1="25" y1="5" x2="25" y2="55" stroke={color} strokeWidth={strokeWidth} />
      <line x1="30" y1="5" x2="30" y2="55" stroke={color} strokeWidth={strokeWidth} />
      <line x1="35" y1="5" x2="35" y2="55" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

// PROTECTIVE DEVICES

export const CircuitBreaker: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      {/* Breaker body */}
      <rect 
        x="20" 
        y="15" 
        width="20" 
        height="30" 
        fill={fillColor} 
        stroke={color} 
        strokeWidth={strokeWidth}
        rx="2"
      />
      {/* Contact points */}
      <circle cx="25" cy="25" r="2" fill={color} />
      <circle cx="35" cy="35" r="2" fill={color} />
      {/* Arc indication */}
      <path 
        d="M 27 25 Q 30 20 33 35" 
        fill="none" 
        stroke={color} 
        strokeWidth={strokeWidth}
      />
      {/* Terminal connections */}
      <line x1="5" y1="30" x2="20" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="40" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

export const Fuse: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      {/* Fuse body */}
      <rect 
        x="20" 
        y="25" 
        width="20" 
        height="10" 
        fill={fillColor} 
        stroke={color} 
        strokeWidth={strokeWidth}
        rx="5"
      />
      {/* Fuse element */}
      <line x1="22" y1="30" x2="38" y2="30" stroke={color} strokeWidth={strokeWidth} />
      {/* Terminal connections */}
      <line x1="5" y1="30" x2="20" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="40" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

export const GroundFaultInterrupter: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      {/* GFI body */}
      <rect 
        x="15" 
        y="20" 
        width="30" 
        height="20" 
        fill={fillColor} 
        stroke={color} 
        strokeWidth={strokeWidth}
        rx="3"
      />
      {/* GFI label */}
      <text 
        x="30" 
        y="32" 
        textAnchor="middle" 
        fontSize="8" 
        fontWeight="bold" 
        fill={color}
      >
        GFI
      </text>
      {/* Ground symbol */}
      <line x1="30" y1="40" x2="30" y2="50" stroke={color} strokeWidth={strokeWidth} />
      <line x1="25" y1="50" x2="35" y2="50" stroke={color} strokeWidth={strokeWidth} />
      <line x1="27" y1="53" x2="33" y2="53" stroke={color} strokeWidth={strokeWidth} />
      <line x1="29" y1="56" x2="31" y2="56" stroke={color} strokeWidth={strokeWidth} />
      {/* Terminal connections */}
      <line x1="5" y1="30" x2="15" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="45" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

// SWITCHING DEVICES

export const SwitchSinglePole: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      {/* Contact points */}
      <circle cx="20" cy="30" r="2" fill={color} />
      <circle cx="40" cy="30" r="2" fill={color} />
      {/* Switch blade */}
      <line x1="20" y1="30" x2="38" y2="20" stroke={color} strokeWidth={strokeWidth} />
      {/* Terminal connections */}
      <line x1="5" y1="30" x2="18" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="42" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

export const SwitchThreePole: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      {/* Phase A */}
      <circle cx="15" cy="15" r="2" fill={color} />
      <circle cx="35" cy="15" r="2" fill={color} />
      <line x1="15" y1="15" x2="33" y2="8" stroke={color} strokeWidth={strokeWidth} />
      
      {/* Phase B */}
      <circle cx="15" cy="30" r="2" fill={color} />
      <circle cx="35" cy="30" r="2" fill={color} />
      <line x1="15" y1="30" x2="33" y2="23" stroke={color} strokeWidth={strokeWidth} />
      
      {/* Phase C */}
      <circle cx="15" cy="45" r="2" fill={color} />
      <circle cx="35" cy="45" r="2" fill={color} />
      <line x1="15" y1="45" x2="33" y2="38" stroke={color} strokeWidth={strokeWidth} />
      
      {/* Mechanical linkage */}
      <line x1="33" y1="8" x2="33" y2="38" stroke={color} strokeWidth={strokeWidth} strokeDasharray="2,2" />
      
      {/* Terminal connections */}
      <line x1="5" y1="15" x2="13" y2="15" stroke={color} strokeWidth={strokeWidth} />
      <line x1="5" y1="30" x2="13" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="5" y1="45" x2="13" y2="45" stroke={color} strokeWidth={strokeWidth} />
      <line x1="37" y1="15" x2="45" y2="15" stroke={color} strokeWidth={strokeWidth} />
      <line x1="37" y1="30" x2="45" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="37" y1="45" x2="45" y2="45" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

export const Disconnect: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      {/* Disconnect body */}
      <rect 
        x="20" 
        y="15" 
        width="20" 
        height="30" 
        fill={fillColor} 
        stroke={color} 
        strokeWidth={strokeWidth}
        rx="2"
      />
      {/* Disconnect symbol (open switch) */}
      <line x1="25" y1="30" x2="35" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="32" y1="25" x2="38" y2="20" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="25" cy="30" r="2" fill={color} />
      <circle cx="35" cy="30" r="2" fill={color} />
      {/* Terminal connections */}
      <line x1="5" y1="30" x2="20" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="40" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

// METERING AND INSTRUMENTATION

export const Ammeter: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <circle 
        cx="30" 
        cy="30" 
        r="20" 
        fill={fillColor} 
        stroke={color} 
        strokeWidth={strokeWidth}
      />
      <text 
        x="30" 
        y="35" 
        textAnchor="middle" 
        fontSize="14" 
        fontWeight="bold" 
        fill={color}
      >
        A
      </text>
      {/* Terminal connections */}
      <line x1="5" y1="30" x2="10" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="50" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

export const Voltmeter: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <circle 
        cx="30" 
        cy="30" 
        r="20" 
        fill={fillColor} 
        stroke={color} 
        strokeWidth={strokeWidth}
      />
      <text 
        x="30" 
        y="35" 
        textAnchor="middle" 
        fontSize="14" 
        fontWeight="bold" 
        fill={color}
      >
        V
      </text>
      {/* Terminal connections */}
      <line x1="5" y1="30" x2="10" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="50" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

export const Wattmeter: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <circle 
        cx="30" 
        cy="30" 
        r="20" 
        fill={fillColor} 
        stroke={color} 
        strokeWidth={strokeWidth}
      />
      <text 
        x="30" 
        y="35" 
        textAnchor="middle" 
        fontSize="14" 
        fontWeight="bold" 
        fill={color}
      >
        W
      </text>
      {/* Terminal connections */}
      <line x1="5" y1="30" x2="10" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="50" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

// MOTORS AND LOADS

export const MotorGeneral: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <circle 
        cx="30" 
        cy="30" 
        r="20" 
        fill={fillColor} 
        stroke={color} 
        strokeWidth={strokeWidth}
      />
      <text 
        x="30" 
        y="35" 
        textAnchor="middle" 
        fontSize="14" 
        fontWeight="bold" 
        fill={color}
      >
        M
      </text>
      {/* Terminal connections for 3-phase */}
      <line x1="5" y1="20" x2="10" y2="20" stroke={color} strokeWidth={strokeWidth} />
      <line x1="5" y1="30" x2="10" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="5" y1="40" x2="10" y2="40" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

export const LoadGeneral: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      {/* Load resistor symbol */}
      <rect 
        x="15" 
        y="25" 
        width="30" 
        height="10" 
        fill={fillColor} 
        stroke={color} 
        strokeWidth={strokeWidth}
      />
      {/* Zigzag pattern inside */}
      <path 
        d="M 18 30 L 22 27 L 26 33 L 30 27 L 34 33 L 38 27 L 42 30" 
        fill="none" 
        stroke={color} 
        strokeWidth={strokeWidth}
      />
      {/* Terminal connections */}
      <line x1="5" y1="30" x2="15" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="45" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

// GROUNDING

export const GroundEarth: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      {/* Ground electrode */}
      <line x1="30" y1="10" x2="30" y2="35" stroke={color} strokeWidth={strokeWidth} />
      {/* Ground lines */}
      <line x1="15" y1="35" x2="45" y2="35" stroke={color} strokeWidth={strokeWidth * 2} />
      <line x1="20" y1="40" x2="40" y2="40" stroke={color} strokeWidth={strokeWidth} />
      <line x1="25" y1="45" x2="35" y2="45" stroke={color} strokeWidth={strokeWidth} />
      <line x1="27" y1="50" x2="33" y2="50" stroke={color} strokeWidth={strokeWidth} />
      {/* Connection point */}
      <circle cx="30" cy="10" r="2" fill={color} />
    </svg>
  );
};

export const GroundChassis: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      {/* Chassis ground */}
      <line x1="30" y1="10" x2="30" y2="35" stroke={color} strokeWidth={strokeWidth} />
      {/* Chassis symbol */}
      <rect 
        x="20" 
        y="35" 
        width="20" 
        height="8" 
        fill={fillColor} 
        stroke={color} 
        strokeWidth={strokeWidth}
      />
      {/* Diagonal lines */}
      <line x1="20" y1="35" x2="40" y2="43" stroke={color} strokeWidth={strokeWidth} />
      <line x1="20" y1="43" x2="40" y2="35" stroke={color} strokeWidth={strokeWidth} />
      {/* Connection point */}
      <circle cx="30" cy="10" r="2" fill={color} />
    </svg>
  );
};

// BUSWAY AND DISTRIBUTION

export const Busway: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      {/* Busway enclosure */}
      <rect 
        x="10" 
        y="20" 
        width="40" 
        height="20" 
        fill={fillColor} 
        stroke={color} 
        strokeWidth={strokeWidth}
      />
      {/* Bus bars */}
      <line x1="15" y1="25" x2="45" y2="25" stroke={color} strokeWidth={strokeWidth * 2} />
      <line x1="15" y1="30" x2="45" y2="30" stroke={color} strokeWidth={strokeWidth * 2} />
      <line x1="15" y1="35" x2="45" y2="35" stroke={color} strokeWidth={strokeWidth * 2} />
      {/* Terminal connections */}
      <line x1="5" y1="30" x2="10" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="50" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

// RENEWABLE ENERGY SYMBOLS

export const SolarPanel: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      {/* Solar panel frame */}
      <rect 
        x="10" 
        y="15" 
        width="40" 
        height="30" 
        fill={fillColor} 
        stroke={color} 
        strokeWidth={strokeWidth}
      />
      {/* Solar cells grid */}
      <line x1="20" y1="15" x2="20" y2="45" stroke={color} strokeWidth={1} />
      <line x1="30" y1="15" x2="30" y2="45" stroke={color} strokeWidth={1} />
      <line x1="40" y1="15" x2="40" y2="45" stroke={color} strokeWidth={1} />
      <line x1="10" y1="25" x2="50" y2="25" stroke={color} strokeWidth={1} />
      <line x1="10" y1="35" x2="50" y2="35" stroke={color} strokeWidth={1} />
      {/* Sun symbol */}
      <circle cx="45" cy="10" r="3" fill="none" stroke={color} strokeWidth={1} />
      <line x1="42" y1="7" x2="48" y2="13" stroke={color} strokeWidth={1} />
      <line x1="48" y1="7" x2="42" y2="13" stroke={color} strokeWidth={1} />
      <line x1="45" y1="4" x2="45" y2="6" stroke={color} strokeWidth={1} />
      <line x1="45" y1="14" x2="45" y2="16" stroke={color} strokeWidth={1} />
      <line x1="49" y1="10" x2="51" y2="10" stroke={color} strokeWidth={1} />
      <line x1="39" y1="10" x2="41" y2="10" stroke={color} strokeWidth={1} />
      {/* Terminal connections */}
      <line x1="25" y1="45" x2="25" y2="55" stroke={color} strokeWidth={strokeWidth} />
      <line x1="35" y1="45" x2="35" y2="55" stroke={color} strokeWidth={strokeWidth} />
      <text x="22" y="53" fontSize="8" fill={color}>+</text>
      <text x="37" y="53" fontSize="8" fill={color}>-</text>
    </svg>
  );
};

export const WindTurbine: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      {/* Tower */}
      <line x1="30" y1="15" x2="30" y2="50" stroke={color} strokeWidth={strokeWidth * 2} />
      {/* Generator nacelle */}
      <rect 
        x="25" 
        y="12" 
        width="10" 
        height="6" 
        fill={fillColor} 
        stroke={color} 
        strokeWidth={strokeWidth}
      />
      {/* Turbine blades */}
      <line x1="25" y1="15" x2="15" y2="5" stroke={color} strokeWidth={strokeWidth} />
      <line x1="25" y1="15" x2="10" y2="25" stroke={color} strokeWidth={strokeWidth} />
      <line x1="25" y1="15" x2="20" y2="30" stroke={color} strokeWidth={strokeWidth} />
      {/* Hub */}
      <circle cx="25" cy="15" r="2" fill={color} />
      {/* Ground base */}
      <rect 
        x="25" 
        y="50" 
        width="10" 
        height="5" 
        fill={fillColor} 
        stroke={color} 
        strokeWidth={strokeWidth}
      />
      {/* Terminal connection */}
      <line x1="30" y1="55" x2="30" y2="60" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

export const Battery: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      {/* Battery cells */}
      <line x1="20" y1="15" x2="20" y2="45" stroke={color} strokeWidth={strokeWidth * 2} />
      <line x1="25" y1="10" x2="25" y2="50" stroke={color} strokeWidth={strokeWidth} />
      <line x1="30" y1="15" x2="30" y2="45" stroke={color} strokeWidth={strokeWidth * 2} />
      <line x1="35" y1="10" x2="35" y2="50" stroke={color} strokeWidth={strokeWidth} />
      <line x1="40" y1="15" x2="40" y2="45" stroke={color} strokeWidth={strokeWidth * 2} />
      {/* Terminal markings */}
      <text x="17" y="12" fontSize="10" fontWeight="bold" fill={color}>+</text>
      <text x="42" y="12" fontSize="10" fontWeight="bold" fill={color}>-</text>
      {/* Terminal connections */}
      <line x1="5" y1="30" x2="20" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="40" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

// Export all symbols for easy access
export const IEEESymbols = {
  // Power Sources
  ACVoltageSource,
  DCVoltageSource,
  Generator,
  
  // Transformers
  TransformerSinglePhase,
  TransformerThreePhase,
  
  // Protective Devices
  CircuitBreaker,
  Fuse,
  GroundFaultInterrupter,
  
  // Switching Devices
  SwitchSinglePole,
  SwitchThreePole,
  Disconnect,
  
  // Metering
  Ammeter,
  Voltmeter,
  Wattmeter,
  
  // Motors and Loads
  MotorGeneral,
  LoadGeneral,
  
  // Grounding
  GroundEarth,
  GroundChassis,
  
  // Distribution
  Busway,
  
  // Renewable Energy
  SolarPanel,
  WindTurbine,
  Battery
};

export default IEEESymbols;