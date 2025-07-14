/**
 * Wire Sizing Chart Component
 * 
 * Comprehensive NEC Table 310.15(B)(16) wire sizing reference with interactive features
 */

import React, { useState, useMemo } from 'react';
import { 
  Cable, 
  Search, 
  Filter, 
  Download, 
  Calculator,
  AlertTriangle,
  Info,
  CheckCircle,
  Thermometer,
  Settings
} from 'lucide-react';

interface WireData {
  awg: string;
  area: number; // kcmil or circular mils
  copperAmpacity: {
    '60C': number;
    '75C': number;
    '90C': number;
  };
  aluminumAmpacity: {
    '60C': number;
    '75C': number;
    '90C': number;
  };
  resistance: {
    copper: number; // ohms per 1000 ft
    aluminum: number;
  };
  weight: {
    copper: number; // lbs per 1000 ft
    aluminum: number;
  };
  outsideDiameter: number; // inches
  applications: string[];
}

interface DerateFactor {
  conduitFill: number; // percentage
  factor: number;
}

interface TemperatureCorrection {
  ambientTemp: number; // Celsius
  correction60C: number;
  correction75C: number;
  correction90C: number;
}

const WIRE_DATA: WireData[] = [
  {
    awg: '14',
    area: 4107,
    copperAmpacity: { '60C': 15, '75C': 20, '90C': 25 },
    aluminumAmpacity: { '60C': 0, '75C': 0, '90C': 0 },
    resistance: { copper: 3.07, aluminum: 0 },
    weight: { copper: 12.4, aluminum: 0 },
    outsideDiameter: 0.064,
    applications: ['Lighting circuits', 'Small appliances', 'Receptacles']
  },
  {
    awg: '12',
    area: 6530,
    copperAmpacity: { '60C': 20, '75C': 25, '90C': 30 },
    aluminumAmpacity: { '60C': 15, '75C': 20, '90C': 25 },
    resistance: { copper: 1.93, aluminum: 3.18 },
    weight: { copper: 19.8, aluminum: 6.2 },
    outsideDiameter: 0.081,
    applications: ['General lighting', 'Appliance circuits', 'HVAC control']
  },
  {
    awg: '10',
    area: 10380,
    copperAmpacity: { '60C': 30, '75C': 35, '90C': 40 },
    aluminumAmpacity: { '60C': 25, '75C': 30, '90C': 35 },
    resistance: { copper: 1.21, aluminum: 2.00 },
    weight: { copper: 31.4, aluminum: 9.9 },
    outsideDiameter: 0.102,
    applications: ['Electric water heaters', 'Air conditioners', 'Dryers']
  },
  {
    awg: '8',
    area: 16510,
    copperAmpacity: { '60C': 40, '75C': 50, '90C': 55 },
    aluminumAmpacity: { '60C': 30, '75C': 40, '90C': 45 },
    resistance: { copper: 0.764, aluminum: 1.26 },
    weight: { copper: 49.9, aluminum: 15.7 },
    outsideDiameter: 0.129,
    applications: ['Electric ranges', 'Large AC units', 'Sub-panels']
  },
  {
    awg: '6',
    area: 26240,
    copperAmpacity: { '60C': 55, '75C': 65, '90C': 75 },
    aluminumAmpacity: { '60C': 40, '75C': 50, '90C': 60 },
    resistance: { copper: 0.491, aluminum: 0.808 },
    weight: { copper: 79.5, aluminum: 25.0 },
    outsideDiameter: 0.162,
    applications: ['Electric furnaces', 'Hot tubs', 'Large motors']
  },
  {
    awg: '4',
    area: 41740,
    copperAmpacity: { '60C': 70, '75C': 85, '90C': 95 },
    aluminumAmpacity: { '60C': 55, '75C': 65, '90C': 75 },
    resistance: { copper: 0.308, aluminum: 0.508 },
    weight: { copper: 126, aluminum: 39.6 },
    outsideDiameter: 0.204,
    applications: ['Service entrances', 'Heavy appliances', 'Industrial motors']
  },
  {
    awg: '2',
    area: 66360,
    copperAmpacity: { '60C': 95, '75C': 115, '90C': 130 },
    aluminumAmpacity: { '60C': 75, '75C': 90, '90C': 100 },
    resistance: { copper: 0.194, aluminum: 0.319 },
    weight: { copper: 201, aluminum: 63.0 },
    outsideDiameter: 0.258,
    applications: ['Service panels', 'Sub-feeders', 'Large equipment']
  },
  {
    awg: '1',
    area: 83690,
    copperAmpacity: { '60C': 110, '75C': 130, '90C': 150 },
    aluminumAmpacity: { '60C': 85, '75C': 100, '90C': 115 },
    resistance: { copper: 0.154, aluminum: 0.253 },
    weight: { copper: 253, aluminum: 79.5 },
    outsideDiameter: 0.289,
    applications: ['Main service conductors', 'Large feeders']
  },
  {
    awg: '1/0',
    area: 105600,
    copperAmpacity: { '60C': 125, '75C': 150, '90C': 170 },
    aluminumAmpacity: { '60C': 100, '75C': 120, '90C': 135 },
    resistance: { copper: 0.122, aluminum: 0.201 },
    weight: { copper: 319, aluminum: 100 },
    outsideDiameter: 0.325,
    applications: ['200A service entrance', 'Main feeders']
  },
  {
    awg: '2/0',
    area: 133100,
    copperAmpacity: { '60C': 145, '75C': 175, '90C': 195 },
    aluminumAmpacity: { '60C': 115, '75C': 135, '90C': 150 },
    resistance: { copper: 0.097, aluminum: 0.159 },
    weight: { copper: 403, aluminum: 126 },
    outsideDiameter: 0.365,
    applications: ['225A service entrance', 'Large sub-panels']
  },
  {
    awg: '3/0',
    area: 167800,
    copperAmpacity: { '60C': 165, '75C': 200, '90C': 225 },
    aluminumAmpacity: { '60C': 130, '75C': 155, '90C': 175 },
    resistance: { copper: 0.077, aluminum: 0.126 },
    weight: { copper: 508, aluminum: 159 },
    outsideDiameter: 0.410,
    applications: ['300A service entrance', 'Industrial feeders']
  },
  {
    awg: '4/0',
    area: 211600,
    copperAmpacity: { '60C': 195, '75C': 230, '90C': 260 },
    aluminumAmpacity: { '60C': 150, '75C': 180, '90C': 205 },
    resistance: { copper: 0.061, aluminum: 0.100 },
    weight: { copper: 641, aluminum: 201 },
    outsideDiameter: 0.460,
    applications: ['400A service entrance', 'Large commercial feeders']
  }
];

const DERATE_FACTORS: DerateFactor[] = [
  { conduitFill: 40, factor: 0.80 },
  { conduitFill: 50, factor: 0.70 },
  { conduitFill: 60, factor: 0.60 },
  { conduitFill: 70, factor: 0.50 },
  { conduitFill: 80, factor: 0.45 },
  { conduitFill: 90, factor: 0.40 },
  { conduitFill: 100, factor: 0.35 }
];

const TEMPERATURE_CORRECTIONS: TemperatureCorrection[] = [
  { ambientTemp: 10, correction60C: 1.15, correction75C: 1.05, correction90C: 1.04 },
  { ambientTemp: 15, correction60C: 1.12, correction75C: 1.04, correction90C: 1.03 },
  { ambientTemp: 20, correction60C: 1.08, correction75C: 1.02, correction90C: 1.02 },
  { ambientTemp: 25, correction60C: 1.04, correction75C: 1.01, correction90C: 1.01 },
  { ambientTemp: 30, correction60C: 1.00, correction75C: 1.00, correction90C: 1.00 },
  { ambientTemp: 35, correction60C: 0.96, correction75C: 0.99, correction90C: 0.99 },
  { ambientTemp: 40, correction60C: 0.91, correction75C: 0.97, correction90C: 0.98 },
  { ambientTemp: 45, correction60C: 0.87, correction75C: 0.95, correction90C: 0.97 },
  { ambientTemp: 50, correction60C: 0.82, correction75C: 0.94, correction90C: 0.95 },
  { ambientTemp: 55, correction60C: 0.76, correction75C: 0.92, correction90C: 0.94 },
  { ambientTemp: 60, correction60C: 0.71, correction75C: 0.90, correction90C: 0.92 }
];

export const WireSizingChart: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [materialFilter, setMaterialFilter] = useState<'all' | 'copper' | 'aluminum'>('all');
  const [temperatureRating, setTemperatureRating] = useState<'60C' | '75C' | '90C'>('75C');
  const [showCalculator, setShowCalculator] = useState(false);
  
  // Calculator state
  const [requiredAmps, setRequiredAmps] = useState<number>(0);
  const [ambientTemp, setAmbientTemp] = useState<number>(30);
  const [conduitFill, setConduitFill] = useState<number>(40);
  const [conductorCount, setConductorCount] = useState<number>(3);
  const [wireLength, setWireLength] = useState<number>(100);
  const [maxVoltageDrop, setMaxVoltageDrop] = useState<number>(3);

  // Filter wire data based on search and filters
  const filteredWireData = useMemo(() => {
    return WIRE_DATA.filter(wire => {
      const matchesSearch = wire.awg.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           wire.applications.some(app => app.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesMaterial = materialFilter === 'all' || 
                             (materialFilter === 'copper' && wire.copperAmpacity[temperatureRating] > 0) ||
                             (materialFilter === 'aluminum' && wire.aluminumAmpacity[temperatureRating] > 0);
      
      return matchesSearch && matchesMaterial;
    });
  }, [searchTerm, materialFilter, temperatureRating]);

  // Calculate recommended wire size
  const calculateWireSize = useMemo(() => {
    if (requiredAmps === 0) return null;

    // Apply derating factors
    const tempCorrection = TEMPERATURE_CORRECTIONS.find(tc => tc.ambientTemp === ambientTemp);
    const fillDerate = DERATE_FACTORS.find(df => df.conduitFill >= conduitFill)?.factor || 0.35;
    const countDerate = conductorCount <= 3 ? 1.0 : conductorCount <= 6 ? 0.8 : conductorCount <= 9 ? 0.7 : 0.5;
    
    const tempCorrectionFactor = tempCorrection ? 
      tempCorrection[`correction${temperatureRating}` as keyof TemperatureCorrection] as number : 1.0;
    
    const totalDeratingFactor = tempCorrectionFactor * fillDerate * countDerate;
    const adjustedAmps = requiredAmps / totalDeratingFactor;

    // Find minimum wire size for ampacity
    const copperWire = WIRE_DATA.find(wire => 
      wire.copperAmpacity[temperatureRating] >= adjustedAmps
    );
    
    const aluminumWire = WIRE_DATA.find(wire => 
      wire.aluminumAmpacity[temperatureRating] >= adjustedAmps
    );

    // Calculate voltage drop
    const calculateVoltageDrop = (wire: WireData, material: 'copper' | 'aluminum') => {
      const resistance = material === 'copper' ? wire.resistance.copper : wire.resistance.aluminum;
      const wireResistance = (resistance * wireLength) / 1000; // Convert to actual length
      const voltageDrop = (2 * wireResistance * requiredAmps); // 2-way circuit
      return voltageDrop;
    };

    const copperVD = copperWire ? calculateVoltageDrop(copperWire, 'copper') : 0;
    const aluminumVD = aluminumWire ? calculateVoltageDrop(aluminumWire, 'aluminum') : 0;

    return {
      adjustedAmps,
      deratingFactor: totalDeratingFactor,
      copper: copperWire ? {
        wire: copperWire,
        voltageDrop: copperVD,
        voltageDropPercent: (copperVD / 240) * 100, // Assuming 240V
        meetsVDRequirement: (copperVD / 240) * 100 <= maxVoltageDrop
      } : null,
      aluminum: aluminumWire ? {
        wire: aluminumWire,
        voltageDrop: aluminumVD,
        voltageDropPercent: (aluminumVD / 240) * 100,
        meetsVDRequirement: (aluminumVD / 240) * 100 <= maxVoltageDrop
      } : null
    };
  }, [requiredAmps, ambientTemp, conduitFill, conductorCount, wireLength, maxVoltageDrop, temperatureRating]);

  /**
   * Export wire sizing data to CSV
   */
  const exportToCSV = () => {
    const headers = [
      'AWG',
      'Area (kcmil)',
      'Cu 60°C (A)',
      'Cu 75°C (A)', 
      'Cu 90°C (A)',
      'Al 60°C (A)',
      'Al 75°C (A)',
      'Al 90°C (A)',
      'Cu Resistance (Ω/1000ft)',
      'Al Resistance (Ω/1000ft)',
      'Applications'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredWireData.map(wire => [
        wire.awg,
        wire.area,
        wire.copperAmpacity['60C'],
        wire.copperAmpacity['75C'],
        wire.copperAmpacity['90C'],
        wire.aluminumAmpacity['60C'] || 'N/A',
        wire.aluminumAmpacity['75C'] || 'N/A',
        wire.aluminumAmpacity['90C'] || 'N/A',
        wire.resistance.copper,
        wire.resistance.aluminum || 'N/A',
        `"${wire.applications.join('; ')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nec-wire-sizing-chart.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cable className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">NEC Wire Sizing Chart</h2>
              <p className="text-orange-100 text-sm">
                Table 310.15(B)(16) - Allowable Ampacities
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className="flex items-center gap-2 px-3 py-1 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
            >
              <Calculator className="h-4 w-4" />
              Calculator
            </button>
            
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-3 py-1 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Wire Sizing Calculator */}
      {showCalculator && (
        <div className="border-b border-gray-200 p-4 bg-orange-50">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-orange-600" />
            Wire Sizing Calculator
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required Amps
              </label>
              <input
                type="number"
                value={requiredAmps || ''}
                onChange={(e) => setRequiredAmps(Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ambient Temp (°C)
              </label>
              <select
                value={ambientTemp}
                onChange={(e) => setAmbientTemp(Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                {TEMPERATURE_CORRECTIONS.map(tc => (
                  <option key={tc.ambientTemp} value={tc.ambientTemp}>
                    {tc.ambientTemp}°C
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conduit Fill (%)
              </label>
              <select
                value={conduitFill}
                onChange={(e) => setConduitFill(Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                {DERATE_FACTORS.map(df => (
                  <option key={df.conduitFill} value={df.conduitFill}>
                    {df.conduitFill}%
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wire Length (ft)
              </label>
              <input
                type="number"
                value={wireLength || ''}
                onChange={(e) => setWireLength(Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="100"
              />
            </div>
          </div>

          {/* Calculation Results */}
          {calculateWireSize && requiredAmps > 0 && (
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <h4 className="font-medium text-gray-900 mb-3">Recommended Wire Sizes</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Copper Recommendation */}
                {calculateWireSize.copper && (
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                      <span className="font-medium text-orange-900">Copper</span>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>AWG Size:</span>
                        <span className="font-bold">{calculateWireSize.copper.wire.awg} AWG</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ampacity:</span>
                        <span>{calculateWireSize.copper.wire.copperAmpacity[temperatureRating]}A</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Voltage Drop:</span>
                        <span className={calculateWireSize.copper.meetsVDRequirement ? 'text-green-600' : 'text-red-600'}>
                          {calculateWireSize.copper.voltageDropPercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Aluminum Recommendation */}
                {calculateWireSize.aluminum && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                      <span className="font-medium text-gray-900">Aluminum</span>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>AWG Size:</span>
                        <span className="font-bold">{calculateWireSize.aluminum.wire.awg} AWG</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ampacity:</span>
                        <span>{calculateWireSize.aluminum.wire.aluminumAmpacity[temperatureRating]}A</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Voltage Drop:</span>
                        <span className={calculateWireSize.aluminum.meetsVDRequirement ? 'text-green-600' : 'text-red-600'}>
                          {calculateWireSize.aluminum.voltageDropPercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Calculation Notes</span>
                </div>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>• Adjusted ampacity: {calculateWireSize.adjustedAmps.toFixed(1)}A (after derating)</p>
                  <p>• Combined derating factor: {(calculateWireSize.deratingFactor * 100).toFixed(1)}%</p>
                  <p>• Voltage drop calculated for 240V circuit</p>
                  <p>• Max recommended voltage drop: {maxVoltageDrop}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by AWG size or application..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Materials</option>
              <option value="copper">Copper Only</option>
              <option value="aluminum">Aluminum Only</option>
            </select>
            
            <select
              value={temperatureRating}
              onChange={(e) => setTemperatureRating(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="60C">60°C Rating</option>
              <option value="75C">75°C Rating</option>
              <option value="90C">90°C Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Wire Sizing Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                AWG
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Area
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-center gap-1">
                  <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                  Copper ({temperatureRating})
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-center gap-1">
                  <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                  Aluminum ({temperatureRating})
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Resistance (Ω/1000ft)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Common Applications
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredWireData.map((wire, index) => (
              <tr key={wire.awg} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">
                  {wire.awg} AWG
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {wire.area.toLocaleString()} kcmil
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-sm font-medium ${
                    wire.copperAmpacity[temperatureRating] > 0 ? 'text-orange-600' : 'text-gray-400'
                  }`}>
                    {wire.copperAmpacity[temperatureRating] || 'N/A'}A
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-sm font-medium ${
                    wire.aluminumAmpacity[temperatureRating] > 0 ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {wire.aluminumAmpacity[temperatureRating] || 'N/A'}A
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <div className="space-y-1">
                    <div>Cu: {wire.resistance.copper}</div>
                    {wire.resistance.aluminum > 0 && (
                      <div>Al: {wire.resistance.aluminum}</div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <div className="flex flex-wrap gap-1">
                    {wire.applications.slice(0, 2).map((app, appIndex) => (
                      <span
                        key={appIndex}
                        className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                      >
                        {app}
                      </span>
                    ))}
                    {wire.applications.length > 2 && (
                      <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        +{wire.applications.length - 2} more
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span>Based on NEC 2023 Table 310.15(B)(16)</span>
            </div>
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-blue-500" />
              <span>30°C ambient, 3 conductors or less</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="font-medium">Showing {filteredWireData.length} wire sizes</div>
            <div className="text-xs text-gray-500">Temperature rating: {temperatureRating}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WireSizingChart;