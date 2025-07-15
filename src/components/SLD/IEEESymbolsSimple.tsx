/**
 * Simplified IEEE Symbol Library - Vercel Compatible
 * 
 * Professional electrical symbols based on IEEE 315/ANSI Y32.2 standards
 * Optimized for performance and Vercel deployment compatibility
 */

import React from 'react';

export interface IEEESymbol {
  id: string;
  name: string;
  category: string;
  necReference?: string;
  symbol: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  width: number;
  height: number;
  terminals: Array<{ x: number; y: number; type: 'input' | 'output' | 'ground' }>;
}

// SVG Symbol Components
const MainBreaker: React.FC<{ size?: number; color?: string; className?: string }> = ({ 
  size = 60, 
  color = '#1f2937', 
  className = '' 
}) => (
  <svg width={size} height={size} viewBox="0 0 60 40" className={className}>
    <rect x="5" y="5" width="50" height="30" fill="none" stroke={color} strokeWidth="2"/>
    <rect x="10" y="10" width="15" height="20" fill="none" stroke={color} strokeWidth="1.5"/>
    <rect x="35" y="10" width="15" height="20" fill="none" stroke={color} strokeWidth="1.5"/>
    <text x="30" y="25" textAnchor="middle" fontSize="8" fill={color}>MAIN</text>
  </svg>
);

const CircuitBreaker: React.FC<{ size?: number; color?: string; className?: string }> = ({ 
  size = 40, 
  color = '#1f2937', 
  className = '' 
}) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 40 24" className={className}>
    <rect x="5" y="5" width="30" height="14" fill="none" stroke={color} strokeWidth="2"/>
    <line x1="8" y1="8" x2="12" y2="16" stroke={color} strokeWidth="2"/>
    <line x1="28" y1="8" x2="32" y2="16" stroke={color} strokeWidth="2"/>
    <text x="20" y="13" textAnchor="middle" fontSize="6" fill={color}>CB</text>
  </svg>
);

const Meter: React.FC<{ size?: number; color?: string; className?: string }> = ({ 
  size = 50, 
  color = '#1f2937', 
  className = '' 
}) => (
  <svg width={size} height={size} viewBox="0 0 50 50" className={className}>
    <circle cx="25" cy="25" r="20" fill="none" stroke={color} strokeWidth="2"/>
    <text x="25" y="20" textAnchor="middle" fontSize="8" fill={color}>kWh</text>
    <text x="25" y="30" textAnchor="middle" fontSize="6" fill={color}>METER</text>
  </svg>
);

const Disconnect: React.FC<{ size?: number; color?: string; className?: string }> = ({ 
  size = 50, 
  color = '#1f2937', 
  className = '' 
}) => (
  <svg width={size} height={size * 0.8} viewBox="0 0 50 40" className={className}>
    <rect x="5" y="5" width="40" height="30" fill="none" stroke={color} strokeWidth="2"/>
    <line x1="15" y1="10" x2="35" y2="30" stroke={color} strokeWidth="3"/>
    <circle cx="37" cy="12" r="2" fill={color}/>
    <text x="25" y="25" textAnchor="middle" fontSize="6" fill={color}>DISC</text>
  </svg>
);

const SolarInverter: React.FC<{ size?: number; color?: string; className?: string }> = ({ 
  size = 60, 
  color = '#1f2937', 
  className = '' 
}) => (
  <svg width={size} height={size * 0.7} viewBox="0 0 60 42" className={className}>
    <rect x="5" y="5" width="50" height="32" fill="none" stroke={color} strokeWidth="2"/>
    <path d="M15 12 Q20 8 25 12 T35 12" fill="none" stroke={color} strokeWidth="2"/>
    <path d="M15 22 L20 22 L20 18 L25 18 L25 22 L30 22 L30 18 L35 18 L35 22 L40 22" 
          fill="none" stroke={color} strokeWidth="2"/>
    <text x="30" y="33" textAnchor="middle" fontSize="6" fill={color}>INVERTER</text>
  </svg>
);

const EVSECharger: React.FC<{ size?: number; color?: string; className?: string }> = ({ 
  size = 50, 
  color = '#1f2937', 
  className = '' 
}) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 50 60" className={className}>
    <rect x="10" y="5" width="30" height="45" fill="none" stroke={color} strokeWidth="2"/>
    <circle cx="25" cy="20" r="6" fill="none" stroke={color} strokeWidth="2"/>
    <rect x="20" y="30" width="10" height="8" fill="none" stroke={color} strokeWidth="1.5"/>
    <line x1="22" y1="40" x2="28" y2="40" stroke={color} strokeWidth="2"/>
    <text x="25" y="55" textAnchor="middle" fontSize="6" fill={color}>EVSE</text>
  </svg>
);

const Transformer: React.FC<{ size?: number; color?: string; className?: string }> = ({ 
  size = 60, 
  color = '#1f2937', 
  className = '' 
}) => (
  <svg width={size} height={size * 0.8} viewBox="0 0 60 48" className={className}>
    <circle cx="20" cy="24" r="15" fill="none" stroke={color} strokeWidth="2"/>
    <circle cx="40" cy="24" r="15" fill="none" stroke={color} strokeWidth="2"/>
    <text x="30" y="42" textAnchor="middle" fontSize="6" fill={color}>XFMR</text>
  </svg>
);

const GroundSymbol: React.FC<{ size?: number; color?: string; className?: string }> = ({ 
  size = 30, 
  color = '#1f2937', 
  className = '' 
}) => (
  <svg width={size} height={size} viewBox="0 0 30 30" className={className}>
    <line x1="15" y1="5" x2="15" y2="15" stroke={color} strokeWidth="2"/>
    <line x1="8" y1="15" x2="22" y2="15" stroke={color} strokeWidth="3"/>
    <line x1="10" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2"/>
    <line x1="12" y1="21" x2="18" y2="21" stroke={color} strokeWidth="1.5"/>
    <line x1="14" y1="24" x2="16" y2="24" stroke={color} strokeWidth="1"/>
  </svg>
);

const Load: React.FC<{ size?: number; color?: string; className?: string }> = ({ 
  size = 40, 
  color = '#1f2937', 
  className = '' 
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
    <path d="M8 20 L12 8 L20 32 L28 8 L32 20" fill="none" stroke={color} strokeWidth="2"/>
    <text x="20" y="37" textAnchor="middle" fontSize="6" fill={color}>LOAD</text>
  </svg>
);

const Motor: React.FC<{ size?: number; color?: string; className?: string }> = ({ 
  size = 50, 
  color = '#1f2937', 
  className = '' 
}) => (
  <svg width={size} height={size} viewBox="0 0 50 50" className={className}>
    <circle cx="25" cy="25" r="18" fill="none" stroke={color} strokeWidth="2"/>
    <text x="25" y="28" textAnchor="middle" fontSize="8" fill={color}>M</text>
    <text x="25" y="45" textAnchor="middle" fontSize="6" fill={color}>MOTOR</text>
  </svg>
);

// IEEE Symbol Library
export const IEEE_SYMBOLS: IEEESymbol[] = [
  {
    id: 'main_breaker',
    name: 'Main Service Panel',
    category: 'Distribution',
    necReference: 'NEC 408.3',
    symbol: MainBreaker,
    width: 80,
    height: 60,
    terminals: [
      { x: 0, y: 30, type: 'input' },
      { x: 80, y: 30, type: 'output' }
    ]
  },
  {
    id: 'circuit_breaker',
    name: 'Circuit Breaker',
    category: 'Protection',
    necReference: 'NEC 240.6',
    symbol: CircuitBreaker,
    width: 50,
    height: 30,
    terminals: [
      { x: 0, y: 15, type: 'input' },
      { x: 50, y: 15, type: 'output' }
    ]
  },
  {
    id: 'electric_meter',
    name: 'Electric Meter',
    category: 'Metering',
    necReference: 'NEC 230.66',
    symbol: Meter,
    width: 60,
    height: 60,
    terminals: [
      { x: 0, y: 30, type: 'input' },
      { x: 60, y: 30, type: 'output' }
    ]
  },
  {
    id: 'disconnect_switch',
    name: 'Disconnect Switch',
    category: 'Switching',
    necReference: 'NEC 690.13',
    symbol: Disconnect,
    width: 60,
    height: 50,
    terminals: [
      { x: 0, y: 25, type: 'input' },
      { x: 60, y: 25, type: 'output' }
    ]
  },
  {
    id: 'solar_inverter',
    name: 'Solar Inverter',
    category: 'Renewable',
    necReference: 'NEC 690.8',
    symbol: SolarInverter,
    width: 80,
    height: 60,
    terminals: [
      { x: 0, y: 30, type: 'input' },
      { x: 80, y: 30, type: 'output' }
    ]
  },
  {
    id: 'evse_charger',
    name: 'EVSE Charger',
    category: 'EVSE',
    necReference: 'NEC 625.17',
    symbol: EVSECharger,
    width: 60,
    height: 80,
    terminals: [
      { x: 30, y: 0, type: 'input' }
    ]
  },
  {
    id: 'transformer',
    name: 'Transformer',
    category: 'Power',
    necReference: 'NEC 450.3',
    symbol: Transformer,
    width: 80,
    height: 60,
    terminals: [
      { x: 0, y: 30, type: 'input' },
      { x: 80, y: 30, type: 'output' }
    ]
  },
  {
    id: 'ground',
    name: 'Ground Symbol',
    category: 'Grounding',
    necReference: 'NEC 250.8',
    symbol: GroundSymbol,
    width: 40,
    height: 40,
    terminals: [
      { x: 20, y: 0, type: 'ground' }
    ]
  },
  {
    id: 'load_symbol',
    name: 'General Load',
    category: 'Loads',
    necReference: 'NEC 220.12',
    symbol: Load,
    width: 50,
    height: 50,
    terminals: [
      { x: 25, y: 0, type: 'input' }
    ]
  },
  {
    id: 'motor',
    name: 'Motor',
    category: 'Motors',
    necReference: 'NEC 430.6',
    symbol: Motor,
    width: 60,
    height: 60,
    terminals: [
      { x: 30, y: 0, type: 'input' }
    ]
  }
];

// Helper functions
export const getSymbolByCategory = (category: string): IEEESymbol[] => {
  return IEEE_SYMBOLS.filter(symbol => symbol.category === category);
};

export const getSymbolById = (id: string): IEEESymbol | undefined => {
  return IEEE_SYMBOLS.find(symbol => symbol.id === id);
};

export const getSymbolCategories = (): string[] => {
  return [...new Set(IEEE_SYMBOLS.map(symbol => symbol.category))];
};

// Component for rendering individual symbols
export const IEEESymbolRenderer: React.FC<{
  symbolId: string;
  size?: number;
  color?: string;
  className?: string;
  showLabel?: boolean;
}> = ({ symbolId, size = 50, color = '#1f2937', className = '', showLabel = false }) => {
  const symbol = getSymbolById(symbolId);
  
  if (!symbol) {
    return (
      <div className="text-red-500 text-xs">
        Symbol not found: {symbolId}
      </div>
    );
  }

  const SymbolComponent = symbol.symbol;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <SymbolComponent size={size} color={color} />
      {showLabel && (
        <div className="text-xs text-gray-600 mt-1 text-center">
          <div className="font-medium">{symbol.name}</div>
          {symbol.necReference && (
            <div className="text-gray-500">{symbol.necReference}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default IEEE_SYMBOLS;