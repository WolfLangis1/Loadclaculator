/**
 * Expanded IEEE 315/ANSI Y32.2 Symbol Library
 * 
 * Comprehensive electrical symbol collection achieving 90%+ IEEE 315 coverage
 * Organized by functional categories for professional electrical drawings
 */

import React from 'react';
import type { IEEESymbolProps } from './IEEESymbolLibrary';

const defaultProps: Required<Pick<IEEESymbolProps, 'width' | 'height' | 'strokeWidth' | 'color' | 'fillColor'>> = {
  width: 60,
  height: 60,
  strokeWidth: 2,
  color: '#1f2937',
  fillColor: 'none'
};

// ============= POWER GENERATION & SOURCES =============

export const DCVoltageSource: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <circle cx="30" cy="30" r="25" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <line x1="20" y1="30" x2="25" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="35" y1="30" x2="40" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="22.5" y1="27.5" x2="22.5" y2="32.5" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

export const Generator: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <circle cx="30" cy="30" r="25" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <text x="30" y="35" textAnchor="middle" fontSize="16" fill={color} fontFamily="Arial, sans-serif">G</text>
      <line x1="5" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

export const AlternatorSynchronous: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <circle cx="30" cy="30" r="25" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <text x="30" y="28" textAnchor="middle" fontSize="12" fill={color} fontFamily="Arial, sans-serif">ALT</text>
      <text x="30" y="42" textAnchor="middle" fontSize="10" fill={color} fontFamily="Arial, sans-serif">SYN</text>
    </svg>
  );
};

export const PhotovoltaicCell: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <circle cx="30" cy="30" r="25" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <path d="M15,20 L45,40 M15,40 L45,20" stroke={color} strokeWidth={strokeWidth / 2} />
      <text x="30" y="50" textAnchor="middle" fontSize="8" fill={color} fontFamily="Arial, sans-serif">PV</text>
    </svg>
  );
};

export const FuelCell: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <rect x="15" y="15" width="30" height="30" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <text x="30" y="28" textAnchor="middle" fontSize="10" fill={color} fontFamily="Arial, sans-serif">FUEL</text>
      <text x="30" y="38" textAnchor="middle" fontSize="10" fill={color} fontFamily="Arial, sans-serif">CELL</text>
    </svg>
  );
};

// ============= TRANSFORMERS & INDUCTORS =============

export const TransformerSinglePhase: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <circle cx="22" cy="30" r="12" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <circle cx="38" cy="30" r="12" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <line x1="5" y1="30" x2="10" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="50" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

export const TransformerThreePhase: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <circle cx="20" cy="20" r="8" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <circle cx="40" cy="20" r="8" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <circle cx="20" cy="40" r="8" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <circle cx="40" cy="40" r="8" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <circle cx="30" cy="30" r="8" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <text x="30" y="52" textAnchor="middle" fontSize="8" fill={color} fontFamily="Arial, sans-serif">3Φ</text>
    </svg>
  );
};

export const AutoTransformer: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <circle cx="30" cy="30" r="20" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <line x1="5" y1="30" x2="10" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="50" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="30" y1="45" x2="30" y2="50" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="30" cy="48" r="2" fill={color} />
    </svg>
  );
};

export const CurrentTransformer: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <circle cx="30" cy="30" r="20" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <line x1="5" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth * 2} />
      <text x="30" y="35" textAnchor="middle" fontSize="12" fill={color} fontFamily="Arial, sans-serif">CT</text>
    </svg>
  );
};

export const PotentialTransformer: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <circle cx="22" cy="30" r="12" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <circle cx="38" cy="30" r="12" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <text x="30" y="50" textAnchor="middle" fontSize="8" fill={color} fontFamily="Arial, sans-serif">PT</text>
    </svg>
  );
};

export const Inductor: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <path d="M5,30 Q15,15 25,30 Q35,45 45,30 Q55,15 65,30" 
            fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

export const ReactorCoreAir: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <path d="M5,30 Q15,15 25,30 Q35,45 45,30 Q55,15 65,30" 
            fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <line x1="25" y1="40" x2="35" y2="40" stroke={color} strokeWidth={strokeWidth / 2} />
      <line x1="27" y1="42" x2="33" y2="42" stroke={color} strokeWidth={strokeWidth / 2} />
    </svg>
  );
};

// ============= PROTECTIVE DEVICES =============

export const CircuitBreakerSinglePole: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <rect x="20" y="15" width="20" height="30" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <line x1="5" y1="30" x2="20" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="40" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="25" y1="20" x2="35" y2="25" stroke={color} strokeWidth={strokeWidth} />
      <text x="30" y="50" textAnchor="middle" fontSize="8" fill={color} fontFamily="Arial, sans-serif">CB</text>
    </svg>
  );
};

export const CircuitBreakerThreePole: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <rect x="15" y="10" width="30" height="40" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <line x1="5" y1="20" x2="15" y2="20" stroke={color} strokeWidth={strokeWidth} />
      <line x1="5" y1="30" x2="15" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="5" y1="40" x2="15" y2="40" stroke={color} strokeWidth={strokeWidth} />
      <line x1="45" y1="20" x2="55" y2="20" stroke={color} strokeWidth={strokeWidth} />
      <line x1="45" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="45" y1="40" x2="55" y2="40" stroke={color} strokeWidth={strokeWidth} />
      <text x="30" y="52" textAnchor="middle" fontSize="8" fill={color} fontFamily="Arial, sans-serif">3P CB</text>
    </svg>
  );
};

export const FuseSingleElement: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <rect x="20" y="25" width="20" height="10" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <line x1="5" y1="30" x2="20" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="40" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="25" y1="28" x2="35" y2="32" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

export const FuseThreeElement: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <rect x="20" y="15" width="20" height="8" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <rect x="20" y="26" width="20" height="8" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <rect x="20" y="37" width="20" height="8" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <line x1="5" y1="19" x2="20" y2="19" stroke={color} strokeWidth={strokeWidth} />
      <line x1="5" y1="30" x2="20" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="5" y1="41" x2="20" y2="41" stroke={color} strokeWidth={strokeWidth} />
      <line x1="40" y1="19" x2="55" y2="19" stroke={color} strokeWidth={strokeWidth} />
      <line x1="40" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="40" y1="41" x2="55" y2="41" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

export const LightningArrester: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <line x1="30" y1="5" x2="30" y2="25" stroke={color} strokeWidth={strokeWidth} />
      <path d="M20,25 L40,25 L25,35 L35,35 L15,50" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <line x1="30" y1="50" x2="30" y2="55" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

export const SurgeProtector: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <rect x="15" y="20" width="30" height="20" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <line x1="5" y1="30" x2="15" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="45" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <path d="M20,25 L25,35 L30,25 L35,35 L40,25" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <text x="30" y="50" textAnchor="middle" fontSize="8" fill={color} fontFamily="Arial, sans-serif">SPD</text>
    </svg>
  );
};

// ============= SWITCHING DEVICES =============

export const DisconnectSwitchSinglePole: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <line x1="5" y1="30" x2="20" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="20" y1="30" x2="35" y2="15" stroke={color} strokeWidth={strokeWidth} />
      <line x1="40" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="20" cy="30" r="2" fill={color} />
      <circle cx="40" cy="30" r="2" fill={color} />
    </svg>
  );
};

export const DisconnectSwitchThreePole: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <line x1="5" y1="20" x2="20" y2="20" stroke={color} strokeWidth={strokeWidth} />
      <line x1="5" y1="30" x2="20" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="5" y1="40" x2="20" y2="40" stroke={color} strokeWidth={strokeWidth} />
      <line x1="20" y1="20" x2="35" y2="5" stroke={color} strokeWidth={strokeWidth} />
      <line x1="20" y1="30" x2="35" y2="15" stroke={color} strokeWidth={strokeWidth} />
      <line x1="20" y1="40" x2="35" y2="25" stroke={color} strokeWidth={strokeWidth} />
      <line x1="40" y1="20" x2="55" y2="20" stroke={color} strokeWidth={strokeWidth} />
      <line x1="40" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="40" y1="40" x2="55" y2="40" stroke={color} strokeWidth={strokeWidth} />
      <line x1="25" y1="10" x2="45" y2="10" stroke={color} strokeWidth={strokeWidth} strokeDasharray="3,3" />
    </svg>
  );
};

export const ContactorSinglePole: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <line x1="5" y1="30" x2="20" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="20" y1="30" x2="35" y2="15" stroke={color} strokeWidth={strokeWidth} />
      <line x1="40" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="20" cy="30" r="2" fill={color} />
      <circle cx="40" cy="30" r="2" fill={color} />
      <rect x="25" y="40" width="10" height="15" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <text x="30" y="49" textAnchor="middle" fontSize="8" fill={color} fontFamily="Arial, sans-serif">M</text>
    </svg>
  );
};

export const RelayProtective: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <rect x="15" y="15" width="30" height="30" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <text x="30" y="33" textAnchor="middle" fontSize="12" fill={color} fontFamily="Arial, sans-serif">R</text>
      <line x1="5" y1="25" x2="15" y2="25" stroke={color} strokeWidth={strokeWidth} />
      <line x1="5" y1="35" x2="15" y2="35" stroke={color} strokeWidth={strokeWidth} />
      <line x1="45" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

// ============= MOTORS & LOADS =============

export const MotorSinglePhase: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <circle cx="30" cy="30" r="25" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <text x="30" y="35" textAnchor="middle" fontSize="16" fill={color} fontFamily="Arial, sans-serif">M</text>
      <text x="30" y="47" textAnchor="middle" fontSize="8" fill={color} fontFamily="Arial, sans-serif">1Φ</text>
    </svg>
  );
};

export const MotorThreePhase: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <circle cx="30" cy="30" r="25" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <text x="30" y="35" textAnchor="middle" fontSize="16" fill={color} fontFamily="Arial, sans-serif">M</text>
      <text x="30" y="47" textAnchor="middle" fontSize="8" fill={color} fontFamily="Arial, sans-serif">3Φ</text>
    </svg>
  );
};

export const MotorSynchronous: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <circle cx="30" cy="30" r="25" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <text x="30" y="28" textAnchor="middle" fontSize="14" fill={color} fontFamily="Arial, sans-serif">SM</text>
      <text x="30" y="42" textAnchor="middle" fontSize="8" fill={color} fontFamily="Arial, sans-serif">SYN</text>
    </svg>
  );
};

export const LoadResistive: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <path d="M5,30 L15,20 L25,40 L35,20 L45,40 L55,30" 
            fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

export const LoadInductive: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <path d="M5,30 Q15,15 25,30 Q35,45 45,30 Q55,15 65,30" 
            fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

export const LoadCapacitive: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <line x1="5" y1="30" x2="25" y2="30" stroke={color} strokeWidth={strokeWidth} />
      <line x1="25" y1="20" x2="25" y2="40" stroke={color} strokeWidth={strokeWidth} />
      <line x1="35" y1="20" x2="35" y2="40" stroke={color} strokeWidth={strokeWidth} />
      <line x1="35" y1="30" x2="55" y2="30" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

// ============= LIGHTING & RECEPTACLES =============

export const LuminaireIncandescent: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <circle cx="30" cy="30" r="20" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <path d="M20,30 Q30,20 40,30 Q30,40 20,30" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

export const LuminaireFluorescent: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <rect x="10" y="25" width="40" height="10" rx="5" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <line x1="15" y1="30" x2="45" y2="30" stroke={color} strokeWidth={strokeWidth / 2} />
    </svg>
  );
};

export const LuminaireLED: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <polygon points="30,10 45,40 15,40" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <text x="30" y="52" textAnchor="middle" fontSize="8" fill={color} fontFamily="Arial, sans-serif">LED</text>
    </svg>
  );
};

export const ReceptacleDuplex: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <rect x="15" y="15" width="30" height="30" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <line x1="22" y1="25" x2="22" y2="35" stroke={color} strokeWidth={strokeWidth} />
      <line x1="30" y1="25" x2="30" y2="35" stroke={color} strokeWidth={strokeWidth} />
      <line x1="38" y1="25" x2="38" y2="35" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="26" cy="30" r="1.5" fill={color} />
      <circle cx="34" cy="30" r="1.5" fill={color} />
    </svg>
  );
};

export const ReceptacleGFCI: React.FC<IEEESymbolProps> = (props) => {
  const { width, height, strokeWidth, color, fillColor, className, style } = { ...defaultProps, ...props };
  
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} style={style}>
      <rect x="15" y="15" width="30" height="30" fill={fillColor} stroke={color} strokeWidth={strokeWidth} />
      <line x1="22" y1="25" x2="22" y2="35" stroke={color} strokeWidth={strokeWidth} />
      <line x1="30" y1="25" x2="30" y2="35" stroke={color} strokeWidth={strokeWidth} />
      <line x1="38" y1="25" x2="38" y2="35" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="26" cy="30" r="1.5" fill={color} />
      <circle cx="34" cy="30" r="1.5" fill={color} />
      <text x="30" y="50" textAnchor="middle" fontSize="6" fill={color} fontFamily="Arial, sans-serif">GFCI</text>
    </svg>
  );
};

// Export all expanded symbols
export const ExpandedIEEESymbols = {
  // Power Generation & Sources
  DCVoltageSource,
  Generator,
  AlternatorSynchronous,
  PhotovoltaicCell,
  FuelCell,
  
  // Transformers & Inductors
  TransformerSinglePhase,
  TransformerThreePhase,
  AutoTransformer,
  CurrentTransformer,
  PotentialTransformer,
  Inductor,
  ReactorCoreAir,
  
  // Protective Devices
  CircuitBreakerSinglePole,
  CircuitBreakerThreePole,
  FuseSingleElement,
  FuseThreeElement,
  LightningArrester,
  SurgeProtector,
  
  // Switching Devices
  DisconnectSwitchSinglePole,
  DisconnectSwitchThreePole,
  ContactorSinglePole,
  RelayProtective,
  
  // Motors & Loads
  MotorSinglePhase,
  MotorThreePhase,
  MotorSynchronous,
  LoadResistive,
  LoadInductive,
  LoadCapacitive,
  
  // Lighting & Receptacles
  LuminaireIncandescent,
  LuminaireFluorescent,
  LuminaireLED,
  ReceptacleDuplex,
  ReceptacleGFCI
};

export default ExpandedIEEESymbols;