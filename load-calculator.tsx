SOLAR & BATTERY SYSTEMS:
${solarBatteryLoads.map(load => 
  `${load.name}: ${load.kw}kW, Inverter=${load.inverterAmps.toFixed(1)}A, Breaker=${load.breaker}A, Connection=${load.location}`
).join('\n')}

ENERGY MANAGEMENT SYSTEM
------------------------
EMS Enabled: ${useEMS ? 'YES' : 'NO'}
${useEMS ? `EMS Maximum Load Setting: ${emsMaxLoad}A` : ''}

COMPLIANCE NOTES
----------------
${memoizedCalculations.warnings.map(w => `• ${w.message} (${w.code})`).join('\n')}
${memoizedCalculations.errors.map(e => `• ERROR: ${e.message} (${e.code})`).join('\n')}

WIRE SIZING SUMMARY
-------------------
Service Conductors: ${calculateWireSize(calculations.totalAmps || 0, 240)} AWG Copper THWN-2
Grounding Electrode Conductor: ${calculations.totalAmps > 100 ? '4' : '6'} AWG Copper
Main Bonding Jumper: ${calculateWireSize((calculations.totalAmps || 0) * 0.125, 240)} AWG

RECOMMENDATIONS
---------------
${calculations.spareCapacity < 25 ? '• Consider upgrading service for future expansion capacity\n' : ''}
${calculations.solarCapacityKW > 0 && !calculations.interconnectionCompliant ? 
  '• Solar interconnection exceeds 120% rule - consider alternative connection methods\n' : ''}
${calculations.totalAmps > mainBreaker ? '• Load exceeds service capacity - service upgrade required\n' : ''}
${evseLoads.filter(l => l.quantity > 0).length > 1 && !useEMS ? 
  '• Multiple EVSEs without EMS - consider installing energy management system per NEC 750.30\n' : ''}
${hasRenewableEnergy && actualDemandData.enabled ? 
  '• NEC 220.87 cannot be used with renewable energy present - calculation method adjusted\n' : ''}

INSPECTOR NOTES
---------------
This calculation is performed in accordance with NEC ${codeYear} requirements.
All continuous loads have been calculated at 125% per NEC requirements.
${hasRenewableEnergy ? 'Renewable energy interconnection must comply with NEC Article 705.' : ''}
${evseLoads.some(l => l.quantity > 0) ? 'EVSE installation must comply with NEC Article 625.' : ''}

Prepared by: ${projectInfo.calculatedBy || '_____________________'}
Date: ${projectInfo.date}
License #: _____________________

This report is generated for permit submission and field verification purposes.
All calculations should be verified by a licensed electrical professional.
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Load_Calculation_${projectInfo.propertyAddress || 'Report'}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // Wire size calculator component
  const WireSizeCalculator = ({ load }) => {
    if (!load || load.amps === 0) return null;
    
    const [distance, setDistance] = useState(50);
    const [tempRating, setTempRating] = useState('75C');
    const [conduitFill, setConduitFill] = useState(3);
    
    const wireSize = calculateWireSize(load.amps, load.volts, distance, tempRating, conduitFill);
    const vDrop = calculateVoltageDrop(load.amps, load.volts, wireSize, distance);
    
    return (
      <div className="text-xs mt-1 p-2 bg-gray-50 rounded">
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div>
            <label className="block text-xs">Distance (ft)</label>
            <input
              type="number"
              value={distance}
              onChange={(e) => setDistance(parseInt(e.target.value) || 0)}
              className="w-full px-1 border rounded text-xs"
            />
          </div>
          <div>
            <label className="block text-xs">Temp Rating</label>
            <select
              value={tempRating}
              onChange={(e) => setTempRating(e.target.value)}
              className="w-full px-1 border rounded text-xs"
            >
              <option value="60C">60°C</option>
              <option value="75C">75°C</option>
              <option value="90C">90°C</option>
            </select>
          </div>
          <div>
            <label className="block text-xs">Conductors</label>
            <input
              type="number"
              value={conduitFill}
              onChange={(e) => setConduitFill(parseInt(e.target.value) || 3)}
              className="w-full px-1 border rounded text-xs"
            />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Wire Size:</span>
            <span className="font-mono font-bold">{wireSize} AWG</span>
          </div>
          <div className="flex justify-between">
            <span>Voltage Drop:</span>
            <span className={`font-mono ${vDrop.acceptable ? 'text-green-600' : 'text-red-600'}`}>
              {vDrop.percentDrop}% ({vDrop.voltageDrop}V)
            </span>
          </div>
          {!vDrop.acceptable && (
            <div className="text-red-600 text-xs mt-1">{vDrop.recommendation}</div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-full mx-auto p-2 bg-gray-50 min-h-screen text-xs">
      {/* Enhanced Header */}
      <div className="bg-white rounded shadow p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold">Professional Load Calculator - NEC {codeYear}</h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={codeYear}
              onChange={(e) => setCodeYear(e.target.value)}
              className="px-2 py-1 border rounded text-xs"
            >
              <option value="2017">NEC 2017</option>
              <option value="2020">NEC 2020</option>
              <option value="2023">NEC 2023</option>
            </select>
            <button
              onClick={saveProject}
              className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 text-xs"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={generateReport}
              className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-xs"
            >
              <Download className="w-3 h-3" />
              Report
            </button>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700 text-xs"
            >
              <FileText className="w-3 h-3" />
              {showAdvanced ? 'Simple' : 'Advanced'}
            </button>
          </div>
        </div>

        {/* Project Information */}
        <div className="grid grid-cols-5 gap-2 p-2 border border-black text-xs">
          <div>
            <strong>Project:</strong>
            <input
              type="text"
              value={projectInfo.projectName}
              onChange={(e) => setProjectInfo(prev => ({ ...prev, projectName: e.target.value }))}
              className="ml-1 border-b border-gray-400 bg-transparent outline-none w-full text-xs"
              placeholder="Project name"
            />
          </div>
          <div>
            <strong>Owner:</strong>
            <input
              type="text"
              value={projectInfo.propertyOwner}
              onChange={(e) => setProjectInfo(prev => ({ ...prev, propertyOwner: e.target.value }))}
              className="ml-1 border-b border-gray-400 bg-transparent outline-none w-full text-xs"
              placeholder="Enter name"
            />
          </div>
          <div>
            <strong>Address:</strong>
            <input
              type="text"
              value={projectInfo.propertyAddress}
              onChange={(e) => setProjectInfo(prev => ({ ...prev, propertyAddress: e.target.value }))}
              className="ml-1 border-b border-gray-400 bg-transparent outline-none w-full text-xs"
              placeholder="Enter address"
            />
          </div>
          <div>
            <strong>Permit #:</strong>
            <input
              type="text"
              value={projectInfo.permitNumber}
              onChange={(e) => setProjectInfo(prev => ({ ...prev, permitNumber: e.target.value }))}
              className="ml-1 border-b border-gray-400 bg-transparent outline-none w-full text-xs"
              placeholder="Permit number"
            />
          </div>
          <div>
            <strong>Sq Ft:</strong>
            <input
              type="number"
              min="0"
              value={squareFootage}
              onChange={(e) => updateSquareFootage(e.target.value)}
              className="ml-1 border-b border-gray-400 bg-transparent outline-none w-16 text-xs"
            />
          </div>
        </div>
        
        {/* Calculation Method Selection */}
        <div className="flex items-center gap-4 mt-2 p-2 bg-gray-100 rounded">
          <span className="font-bold text-xs">Calculation Method:</span>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              value="optional"
              checked={calculationMethod === 'optional'}
              onChange={(e) => setCalculationMethod(e.target.value)}
            />
            <span className="text-xs">Optional (220.82)</span>
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              value="standard"
              checked={calculationMethod === 'standard'}
              onChange={(e) => setCalculationMethod(e.target.value)}
            />
            <span className="text-xs">Standard (220.42-55)</span>
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              value="existing"
              checked={calculationMethod === 'existing'}
              onChange={(e) => setCalculationMethod(e.target.value)}
              disabled={hasRenewableEnergy}
            />
            <span className="text-xs">Existing (220.83)</span>
          </label>
          {hasRenewableEnergy && (
            <span className="text-red-600 text-xs ml-2">
              (Disabled - renewable energy present)
            </span>
          )}
        </div>

        {/* Tabs for different views */}
        {showAdvanced && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setActiveTab('loads')}
              className={`px-3 py-1 rounded text-xs ${activeTab === 'loads' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Load Calculation
            </button>
            <button
              onClick={() => setActiveTab('distribution')}
              className={`px-3 py-1 rounded text-xs ${activeTab === 'distribution' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Distribution
            </button>
            <button
              onClick={() => setActiveTab('panel')}
              className={`px-3 py-1 rounded text-xs ${activeTab === 'panel' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Panel Schedule
            </button>
            <button
              onClick={() => setActiveTab('validation')}
              className={`px-3 py-1 rounded text-xs ${activeTab === 'validation' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Validation
            </button>
          </div>
        )}
      </div>

      {/* Load Distribution Visualization */}
      {showAdvanced && activeTab === 'distribution' && <LoadDistribution />}
      
      {/* Panel Schedule */}
      {showAdvanced && activeTab === 'panel' && <PanelSchedule />}

      {/* Validation Results */}
      {showAdvanced && activeTab === 'validation' && (
        <div className="bg-white rounded shadow p-3 mb-3">
          <h3 className="text-sm font-bold mb-2">Code Compliance & Validation</h3>
          <div className="space-y-2">
            {memoizedCalculations.errors.map((error, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs font-bold text-red-800">{error.message}</div>
                  <div className="text-xs text-red-700">Code: {error.code}</div>
                  {error.solution && (
                    <div className="text-xs text-red-600 mt-1">Solution: {error.solution}</div>
                  )}
                </div>
              </div>
            ))}
            {memoizedCalculations.warnings.map((warning, index) => (
              <div key={index} className={`flex items-start gap-2 p-2 rounded border ${
                warning.type === 'success' ? 'bg-green-50 border-green-200' :
                warning.type === 'info' ? 'bg-blue-50 border-blue-200' :
                'bg-yellow-50 border-yellow-200'
              }`}>
                <CheckCircle className={`w-4 h-4 mt-0.5 ${
                  warning.type === 'success' ? 'text-green-600' :
                  warning.type === 'info' ? 'text-blue-600' :
                  'text-yellow-600'
                }`} />
                <div className="flex-1">
                  <div className={`text-xs ${
                    warning.type === 'success' ? 'text-green-800' :
                    warning.type === 'info' ? 'text-blue-800' :
                    'text-yellow-800'
                  }`}>{warning.message}</div>
                  <div className={`text-xs ${
                    warning.type === 'success' ? 'text-green-700' :
                    warning.type === 'info' ? 'text-blue-700' :
                    'text-yellow-700'
                  }`}>Code: {warning.code}</div>
                  {warning.solution && (
                    <div className="text-xs mt-1">{warning.solution}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content area */}
      {(activeTab === 'loads' || !showAdvanced) && (
        <div className="grid grid-cols-3 gap-2">
          {/* Load Calculation Tables */}
          <div className="col-span-2 space-y-3">
            {/* General Loads */}
            <div className="bg-white rounded shadow p-3">
              <div className="flex items-center gap-2 mb-2">
                <Home className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold">GENERAL LOADS</h2>
              </div>
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1 text-left text-xs">Load Type</th>
                    <th className="border border-black p-1 text-center text-xs">Qty</th>
                    <th className="border border-black p-1 text-center text-xs">A</th>
                    <th className="border border-black p-1 text-center text-xs">V</th>
                    <th className="border border-black p-1 text-center text-xs">VA</th>
                    <th className="border border-black p-1 text-center text-xs">Total</th>
                    {showAdvanced && <th className="border border-black p-1 text-center text-xs">Critical</th>}
                  </tr>
                </thead>
                <tbody>
                  {generalLoads.map((load) => (
                    <tr key={load.id}>
                      <td className="border border-black p-1 text-xs">{load.name}</td>
                      <td className="border border-black p-1 text-center">
                        <input
                          type="number"
                          min="0"
                          value={load.quantity}
                          onChange={(e) => updateGeneralLoad(load.id, 'quantity', e.target.value)}
                          className="w-12 text-center border border-gray-300 rounded px-1 bg-white text-xs"
                          placeholder={load.name === 'General Lighting & Receptacles' ? 'sq ft' : ''}
                        />
                      </td>
                      <td className="border border-black p-1 text-center">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={load.amps}
                          onChange={(e) => updateGeneralLoad(load.id, 'amps', e.target.value)}
                          className="w-12 text-center border border-gray-300 rounded px-1 bg-white text-xs"
                          disabled={load.name === 'General Lighting & Receptacles' || 
                                   load.name.includes('Small Appliance') ||
                                   load.name === 'Laundry Circuit' ||
                                   load.name === 'Bathroom Circuit'}
                        />
                      </td>
                      <td className="border border-black p-1 text-center">
                        <select
                          value={load.volts}
                          onChange={(e) => updateGeneralLoad(load.id, 'volts', e.target.value)}
                          className="w-12 text-center border border-gray-300 rounded px-1 bg-white text-xs"
                          disabled={load.name === 'General Lighting & Receptacles' ||
                                   load.name.includes('Small Appliance') ||
                                   load.name === 'Laundry Circuit' ||
                                   load.name === 'Bathroom Circuit'}
                        >
                          <option value={120}>120</option>
                          <option value={240}>240</option>
                          <option value={208}>208</option>
                        </select>
                      </td>
                      <td className="border border-black p-1 text-center">
                        <input
                          type="number"
                          min="0"
                          value={load.va}
                          onChange={(e) => updateGeneralLoad(load.id, 'va', e.target.value)}
                          className="w-14 text-center border border-gray-300 rounded px-1 bg-white text-xs"
                          disabled={load.name === 'General Lighting & Receptacles'}
                        />
                      </td>
                      <td className="border border-black p-1 text-center">
                        <div className="w-16 text-center px-1 bg-gray-100 border border-gray-300 rounded font-mono text-xs">
                          {load.total.toLocaleString()}
                        </div>
                      </td>
                      {showAdvanced && (
                        <td className="border border-black p-1 text-center">
                          <input
                            type="checkbox"
                            checked={load.critical || false}
                            onChange={(e) => updateGeneralLoad(load.id, 'critical', e.target.checked)}
                            className="w-3 h-3"
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* HVAC Loads */}
            <div className="bg-white rounded shadow p-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-600" />
                <h2 className="text-sm font-bold">HVAC & MOTOR LOADS</h2>
              </div>
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1 text-left text-xs">Load Type</th>
                    <th className="border border-black p-1 text-center text-xs">Qty</th>
                    <th className="border border-black p-1 text-center text-xs">A</th>
                    <th className="border border-black p-1 text-center text-xs">V</th>
                    <th className="border border-black p-1 text-center text-xs">VA</th>
                    <th className="border border-black p-1 text-center text-xs">Total</th>
                    {showAdvanced && <th className="border border-black p-1 text-center text-xs">Wire</th>}
                  </tr>
                </thead>
                <tbody>
                  {hvacLoads.map((load) => (
                    <Fragment key={load.id}>
                      <tr>
                        <td className="border border-black p-1 text-xs">{load.name}</td>
                        <td className="border border-black p-1 text-center">
                          <input
                            type="number"
                            min="0"
                            value={load.quantity}
                            onChange={(e) => updateHvacLoad(load.id, 'quantity', e.target.value)}
                            className="w-12 text-center border border-gray-300 rounded px-1 bg-white text-xs"
                          />
                        </td>
                        <td className="border border-black p-1 text-center">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={load.amps}
                            onChange={(e) => updateHvacLoad(load.id, 'amps', e.target.value)}
                            className="w-12 text-center border border-gray-300 rounded px-1 bg-white text-xs"
                          />
                        </td>
                        <td className="border border-black p-1 text-center">
                          <select
                            value={load.volts}
                            onChange={(e) => updateHvacLoad(load.id, 'volts', e.target.value)}
                            className="w-12 text-center border border-gray-300 rounded px-1 bg-white text-xs"
                          >
                            <option value={120}>120</option>
                            <option value={240}>240</option>
                            <option value={208}>208</option>
                            <option value={480}>480</option>
                          </select>
                        </td>
                        <td className="border border-black p-1 text-center">
                          <input
                            type="number"
                            min="0"
                            value={load.va}
                            onChange={(e) => updateHvacLoad(load.id, 'va', e.target.value)}
                            className="w-14 text-center border border-gray-300 rounded px-1 bg-white text-xs"
                          />
                        </td>
                        <td className="border border-black p-1 text-center">
                          <div className="w-16 text-center px-1 bg-gray-100 border border-gray-300 rounded font-mono text-xs">
                            {load.total.toLocaleString()}
                          </div>
                        </td>
                        {showAdvanced && (
                          <td className="border border-black p-1 text-center">
                            <span className="font-mono text-xs">
                              {load.amps > 0 ? calculateWireSize(load.amps, load.volts) : '-'}
                            </span>
                          </td>
                        )}
                      </tr>
                      {showAdvanced && load.amps > 0 && (
                        <tr>
                          <td colSpan="7" className="border border-black p-0">
                            <WireSizeCalculator load={load} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* EV Charging Loads */}
            <div className="bg-white rounded shadow p-3">
              <div className="flex items-center gap-2 mb-2">
                <Car className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-bold">ELECTRIC VEHICLE CHARGING (NEC 625)</h2>
              </div>
              
              {/* EMS Controls */}
              <div className="mb-2 p-2 bg-blue-50 rounded flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={useEMS}
                    onChange={(e) => setUseEMS(e.target.checked)}
                  />
                  <span>Energy Management System (NEC 750.30)</span>
                </label>
                {useEMS && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs">Max Load:</span>
                    <input
                      type="number"
                      value={emsMaxLoad}
                      onChange={(e) => setEmsMaxLoad(parseFloat(e.target.value) || 0)}
                      className="w-16 px-1 border rounded text-xs"
                    />
                    <span className="text-xs">A</span>
                  </div>
                )}
              </div>
              
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1 text-left text-xs">Charger Type</th>
                    <th className="border border-black p-1 text-center text-xs">Qty</th>
                    <th className="border border-black p-1 text-center text-xs">A</th>
                    <th className="border border-black p-1 text-center text-xs">V</th>
                    <th className="border border-black p-1 text-center text-xs">VA</th>
                    <th className="border border-black p-1 text-center text-xs">Total (125%)</th>
                    <th className="border border-black p-1 text-center text-xs">Breaker</th>
                  </tr>
                </thead>
                <tbody>
                  {evseLoads.map((load) => (
                    <tr key={load.id}>
                      <td className="border border-black p-1 text-xs">{load.name}</td>
                      <td className="border border-black p-1 text-center">
                        <input
                          type="number"
                          min="0"
                          value={load.quantity}
                          onChange={(e) => updateEvseLoad(load.id, 'quantity', e.target.value)}
                          className="w-12 text-center border border-gray-300 rounded px-1 bg-white text-xs"
                        />
                      </td>
                      <td className="border border-black p-1 text-center">
                        <select
                          value={load.amps}
                          onChange={(e) => updateEvseLoad(load.id, 'amps', e.target.value)}
                          className="w-12 text-center border border-gray-300 rounded px-1 bg-white text-xs"
                        >
                          <option value={0}>0</option>
                          <option value={12}>12</option>
                          <option value={16}>16</option>
                          <option value={24}>24</option>
                          <option value={32}>32</option>
                          <option value={40}>40</option>
                          <option value={48}>48</option>
                          <option value={64}>64</option>
                          <option value={80}>80</option>
                        </select>
                      </td>
                      <td className="border border-black p-1 text-center">
                        <select
                          value={load.volts}
                          onChange={(e) => updateEvseLoad(load.id, 'volts', e.target.value)}
                          className="w-12 text-center border border-gray-300 rounded px-1 bg-white text-xs"
                        >
                          <option value={120}>120</option>
                          <option value={240}>240</option>
                          <option value={208}>208</option>
                        </select>
                      </td>
                      <td className="border border-black p-1 text-center">
                        <div className="w-14 text-center px-1 bg-gray-100 border border-gray-300 rounded font-mono text-xs">
                          {load.va.toLocaleString()}
                        </div>
                      </td>
                      <td className="border border-black p-1 text-center">
                        <div className="w-16 text-center px-1 bg-yellow-100 border border-yellow-300 rounded font-mono text-xs">
                          {load.total.toLocaleString()}
                        </div>
                      </td>
                      <td className="border border-black p-1 text-center">
                        <div className="font-mono text-xs">
                          {load.quantity > 0 ? Math.ceil(load.amps * 1.25 / 5) * 5 : 0}A
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {evseLoads.filter(l => l.quantity > 0).length > 1 && !useEMS && (
                <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                  <strong>Warning:</strong> Multiple EVSEs without EMS require full capacity calculation per NEC 625.42
                </div>
              )}
            </div>

            {/* Solar and Battery Storage Table */}
            <div className="bg-white rounded shadow p-3">
              <div className="flex items-center gap-2 mb-2">
                <Battery className="w-4 h-4 text-green-600" />
                <h2 className="text-sm font-bold">SOLAR & BATTERY STORAGE (NEC 705.12)</h2>
              </div>
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1 text-left text-xs">System Type</th>
                    <th className="border border-black p-1 text-center text-xs">kW</th>
                    <th className="border border-black p-1 text-center text-xs">Inverter A</th>
                    <th className="border border-black p-1 text-center text-xs">V</th>
                    <th className="border border-black p-1 text-center text-xs">Breaker A</th>
                    <th className="border border-black p-1 text-center text-xs">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {solarBatteryLoads.map((load) => (
                    <tr key={load.id}>
                      <td className="border border-black p-1 text-xs">{load.name}</td>
                      <td className="border border-black p-1 text-center">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={load.kw}
                          onChange={(e) => updateSolarBatteryLoad(load.id, 'kw', e.target.value)}
                          className="w-12 text-center border border-gray-300 rounded px-1 bg-white text-xs"
                          placeholder="0.0"
                        />
                      </td>
                      <td className="border border-black p-1 text-center">
                        <div className="w-12 text-center px-1 bg-gray-100 border border-gray-300 rounded font-mono text-xs">
                          {load.inverterAmps.toFixed(1)}
                        </div>
                      </td>
                      <td className="border border-black p-1 text-center">
                        <select
                          value={load.volts}
                          onChange={(e) => updateSolarBatteryLoad(load.id, 'volts', e.target.value)}
                          className="w-12 text-center border border-gray-300 rounded px-1 bg-white text-xs"
                        >
                          <option value={240}>240</option>
                          <option value={208}>208</option>
                          <option value={480}>480</option>
                        </select>
                      </td>
                      <td className="border border-black p-1 text-center">
                        <select
                          value={load.breaker}
                          onChange={(e) => updateSolarBatteryLoad(load.id, 'breaker', e.target.value)}
                          className="w-14 text-center border border-gray-300 rounded px-1 bg-white text-xs"
                        >
                          <option value={0}>0</option>
                          <option value={15}>15</option>
                          <option value={20}>20</option>
                          <option value={25}>25</option>
                          <option value={30}>30</option>
                          <option value={35}>35</option>
                          <option value={40}>40</option>
                          <option value={50}>50</option>
                          <option value={60}>60</option>
                          <option value={70}>70</option>
                          <option value={80}>80</option>
                          <option value={100}>100</option>
                        </select>
                      </td>
                      <td className="border border-black p-1 text-center">
                        <select 
                          value={load.location}
                          onChange={(e) => updateSolarBatteryLoad(load.id, 'location', e.target.value)}
                          className="w-20 text-center border border-gray-300 rounded px-1 bg-white text-xs"
                        >
                          <option value="backfeed">Backfeed</option>
                          <option value="load-side">Load Side</option>
                          <option value="supply-side">Supply Side</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary and Service Info */}
          <div className="space-y-2">
            {/* Calculation Summary */}
            <div className="bg-white rounded shadow p-3">
              <h3 className="text-sm font-bold mb-2">CALCULATION SUMMARY</h3>
              
              {/* Warnings and Code Compliance */}
              {(memoizedCalculations.errors.length > 0 || memoizedCalculations.warnings.length > 0) && (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded max-h-32 overflow-y-auto">
                  <div className="text-xs font-bold text-yellow-800 mb-1">Code Compliance:</div>
                  {memoizedCalculations.errors.map((error, index) => (
                    <div key={index} className="text-xs text-red-700 flex items-start gap-1 mb-1">
                      <span>•</span>
                      <span>{error.message} ({error.code})</span>
                    </div>
                  ))}
                  {memoizedCalculations.warnings.slice(0, 3).map((warning, index) => (
                    <div key={index} className="text-xs text-yellow-700 flex items-start gap-1">
                      <span>•</span>
                      <span>{warning.message}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Total General Load:</span>
                  <span className="font-mono">{calculations.generalLoadVA?.toLocaleString() || 0}</span>
                </div>
                
                <div className="bg-gray-50 p-2 rounded">
                  {calculationMethod === 'optional' ? (
                    <>
                      <div className="flex justify-between">
                        <span>First 10kVA @ 100%:</span>
                        <span className="font-mono">
                          {Math.min(calculations.generalLoadVA || 0, 10000).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remainder @ 40%:</span>
                        <span className="font-mono">
                          {Math.round(Math.max(((calculations.generalLoadVA || 0) - 10000) * 0.4, 0))}
                        </span>
                      </div>
                    </>
                  ) : calculationMethod === 'standard' ? (
                    <>
                      <div className="flex justify-between">
                        <span>First 3kVA @ 100%:</span>
                        <span className="font-mono">
                          {Math.min(calculations.generalLoadVA || 0, 3000).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Next 117kVA @ 35%:</span>
                        <span className="font-mono">
                          {Math.round(Math.min(Math.max((calculations.generalLoadVA || 0) - 3000, 0), 117000) * 0.35)}
                        </span>
                      </div>
                      {(calculations.generalLoadVA || 0) > 120000 && (
                        <div className="flex justify-between">
                          <span>Above 120kVA @ 25%:</span>
                          <span className="font-mono">
                            {Math.round(Math.max((calculations.generalLoadVA || 0) - 120000, 0) * 0.25)}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>First 8kVA @ 100%:</span>
                        <span className="font-mono">
                          {Math.min(calculations.generalLoadVA || 0, 8000).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remainder @ 40%:</span>
                        <span className="font-mono">
                          {Math.round(Math.max(((calculations.generalLoadVA || 0) - 8000) * 0.4, 0))}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between border-t pt-1 font-bold">
                    <span>General Demand:</span>
                    <span className="font-mono">{calculations.generalDemand?.toLocaleString() || 0}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Fixed Appliances:</span>
                    <span className="font-mono">{calculations.applianceDemand?.toLocaleString() || 0}</span>
                  </div>
                  {calculations.motorDemand > 0 && (
                    <div className="flex justify-between">
                      <span>Motor Loads (125%):</span>
                      <span className="font-mono">{calculations.motorDemand?.toLocaleString() || 0}</span>
                    </div>
                  )}
                  {calculations.evseVA > 0 && (
                    <div className="flex justify-between">
                      <span>EV Charging{useEMS ? ' (EMS)' : ''}:</span>
                      <span className="font-mono">{calculations.evseVA?.toLocaleString() || 0}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>HVAC Load:</span>
                    <span className="font-mono">{calculations.hvacVA?.toLocaleString() || 0}</span>
                  </div>
                  {calculationMethod !== 'optional' && (
                    <div className="flex justify-between">
                      <span>Cooking Demand:</span>
                      <span className="font-mono">{calculations.cookingDemand?.toLocaleString() || 0}</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total VA:</span>
                    <span className="font-mono">{calculations.totalVA?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between font-bold text-blue-600">
                    <span>Total Amps:</span>
                    <span className="font-mono">{calculations.totalAmps?.toFixed(1) || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Spare Capacity:</span>
                    <span className={`font-mono ${
                      calculations.spareCapacity < 15 ? 'text-red-600' :
                      calculations.spareCapacity < 25 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>{calculations.spareCapacity?.toFixed(1) || 0}%</span>
                  </div>
                  {showAdvanced && (
                    <div className="flex justify-between text-xs mt-1">
                      <span>Critical Loads:</span>
                      <span className="font-mono">{calculations.criticalLoadsAmps?.toFixed(1) || 0}A</span>
                    </div>
                  )}
                </div>
                
                {/* Solar/Battery Summary */}
                {(calculations.solarCapacityKW > 0 || calculations.batteryCapacityKW > 0) && (
                  <div className="border-t pt-2 mt-2">
                    <div className="font-bold text-xs mb-1">Solar & Storage:</div>
                    <div className="flex justify-between text-xs">
                      <span>Solar:</span>
                      <span className="font-mono">{calculations.solarCapacityKW?.toFixed(1) || 0} kW</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Battery:</span>
                      <span className="font-mono">{calculations.batteryCapacityKW?.toFixed(1) || 0} kW</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Interconnection:</span>
                      <span className="font-mono">{calculations.totalInterconnectionAmps || 0}A</span>
                    </div>
                    <div className={`flex justify-between text-xs font-bold ${
                      calculations.interconnectionCompliant ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span>120% Rule:</span>
                      <span>{calculations.interconnectionCompliant ? 'PASS' : 'FAIL'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Service Information */}
            <div className="bg-white rounded shadow p-3">
              <h3 className="text-sm font-bold mb-2">SERVICE PANEL</h3>
              
              {/* Panel Details */}
              {showAdvanced && (
                <div className="mb-2 p-2 bg-gray-50 rounded text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs">Manufacturer</label>
                      <input
                        type="text"
                        value={panelDetails.manufacturer}
                        onChange={(e) => setPanelDetails(prev => ({ ...prev, manufacturer: e.target.value }))}
                        className="w-full px-1 border rounded text-xs"
                        placeholder="Square D"
                      />
                    </div>
                    <div>
                      <label className="block text-xs">Model</label>
                      <input
                        type="text"
                        value={panelDetails.model}
                        onChange={(e) => setPanelDetails(prev => ({ ...prev, model: e.target.value }))}
                        className="w-full px-1 border rounded text-xs"
                        placeholder="QO140M200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs">Bus Rating</label>
                      <input
                        type="number"
                        value={panelDetails.busRating}
                        onChange={(e) => setPanelDetails(prev => ({ ...prev, busRating: parseInt(e.target.value) || 200 }))}
                        className="w-full px-1 border rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs">Total Spaces</label>
                      <input
                        type="number"
                        value={panelDetails.spaces}
                        onChange={(e) => setPanelDetails(prev => ({ ...prev, spaces: parseInt(e.target.value) || 40 }))}
                        className="w-full px-1 border rounded text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-2 bg-red-50 border border-red-200 rounded">
                <div className="text-sm font-bold text-red-800 mb-1">Main Breaker</div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="range"
                    min="100"
                    max="400"
                    step="25"
                    value={mainBreaker}
                    onChange={(e) => setMainBreaker(parseInt(e.target.value))}
                    className="w-20"
                  />
                  <select
                    value={mainBreaker}
                    onChange={(e) => setMainBreaker(parseInt(e.target.value))}
                    className="px-1 border rounded text-xs"
                  >
                    {NEC_CONSTANTS.SERVICE_SIZES.filter(size => size <= 400).map(size => (
                      <option key={size} value={size}>{size}A</option>
                    ))}
                  </select>
                </div>
                
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <strong>Service Rating:</strong>
                    <span>{mainBreaker}A</span>
                  </div>
                  <div className="flex justify-between">
                    <strong>Calculated Load:</strong>
                    <span>{calculations.totalAmps?.toFixed(1) || 0}A</span>
                  </div>
                  <div className="flex justify-between">
                    <strong>80% Rating:</strong>
                    <span>{(mainBreaker * 0.8).toFixed(0)}A</span>
                  </div>
                  <div className="flex justify-between">
                    <strong>Available Capacity:</strong>
                    <span>{Math.max(mainBreaker - (calculations.totalAmps || 0), 0).toFixed(1)}A</span>
                  </div>
                  {calculations.recommendedService && calculations.recommendedService > mainBreaker && (
                    <div className="text-red-600 font-bold">
                      Recommend: {calculations.recommendedService}A
                    </div>
                  )}
                  <div className={`font-bold text-center mt-2 p-1 rounded ${
                    calculations.serviceAdequate ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {calculations.serviceAdequate ? 'SERVICE ADEQUATE' : 'SERVICE INADEQUATE'}
                  </div>
                </div>
              </div>

              <div className={`p-2 rounded mt-2 text-xs ${
                calculations.serviceAdequate ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className="font-bold">Professional Assessment:</div>
                <div>
                  {calculations.serviceAdequate 
                    ? `${calculations.serviceSize}A Service is adequate for calculated loads`
                    : `${calculations.serviceSize}A Service is inadequate - upgrade to ${calculations.recommendedService}A recommended`}
                </div>
                <div className="mt-1 text-xs">
                  <strong>Method:</strong> {calculationMethod === 'optional' ? 'NEC 220.82 Optional' : 
                                          calculationMethod === 'standard' ? 'NEC 220.42-55 Standard' :
                                          'NEC 220.83 Existing'}
                </div>
              </div>
              
              {/* NEC 705.12 Interconnection Analysis */}
              {(calculations.solarCapacityKW > 0 || calculations.batteryCapacityKW > 0) && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-sm font-bold text-blue-800 mb-1">NEC 705.12 Analysis</div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <strong>Busbar Rating:</strong>
                      <span>{panelDetails.busRating || mainBreaker}A</span>
                    </div>
                    <div className="flex justify-between">
                      <strong>Main Breaker:</strong>
                      <span>{mainBreaker}A</span>
                    </div>
                    <div className="flex justify-between">
                      <strong>120% of Busbar:</strong>
                      <span>{((panelDetails.busRating || mainBreaker) * 1.2).toFixed(0)}A</span>
                    </div>
                    <div className="flex justify-between">
                      <strong>Max Backfeed:</strong>
                      <span>{calculations.maxAllowableBackfeed?.toFixed(0)}A</span>
                    </div>
                    <div className="flex justify-between">
                      <strong>Total Backfeed:</strong>
                      <span className={calculations.interconnectionCompliant ? '' : 'text-red-600'}>
                        {calculations.totalInterconnectionAmps}A
                      </span>
                    </div>
                    <div className={`font-bold mt-2 text-center p-1 rounded ${
                      calculations.interconnectionCompliant 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {calculations.interconnectionCompliant 
                        ? '✓ Compliant with 120% Rule' 
                        : '✗ Exceeds 120% Rule'}
                    </div>
                    {!calculations.interconnectionCompliant && (
                      <div className="text-red-600 text-xs mt-2 p-2 bg-red-50 rounded">
                        <strong>Options:</strong>
                        <ol className="ml-4 mt-1">
                          <li>1. Reduce solar/battery breaker sizes</li>
                          <li>2. Upgrade panel busbar rating</li>
                          <li>3. Use load-side connection (705.12(B)(3)(3))</li>
                          <li>4. Install supply-side connection (705.12(A))</li>
                          <li>5. Install Power Control System (705.13)</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* 220.87 Actual Demand Data */}
              {calculationMethod === 'existing' && !hasRenewableEnergy && (
                <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded">
                  <div className="text-sm font-bold text-purple-800 mb-1">NEC 220.87 Actual Demand</div>
                  <label className="flex items-center gap-2 text-xs mb-2">
                    <input
                      type="checkbox"
                      checked={actualDemandData.enabled}
                      onChange={(e) => setActualDemandData(prev => ({ ...prev, enabled: e.target.checked }))}
                    />
                    <span>Use actual demand data</span>
                  </label>
                  {actualDemandData.enabled && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs">Peak Demand (A)</label>
                        <input
                          type="number"
                          value={actualDemandData.peakDemand}
                          onChange={(e) => setActualDemandData(prev => ({ ...prev, peakDemand: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-1 border rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs">Monitoring Days</label>
                        <input
                          type="number"
                          value={actualDemandData.monitoringDays}
                          onChange={(e) => setActualDemandData(prev => ({ ...prev, monitoringDays: parseInt(e.target.value) || 30 }))}
                          className="w-full px-1 border rounded text-xs"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={actualDemandData.includesHeatCool}
                          onChange={(e) => setActualDemandData(prev => ({ ...prev, includesHeatCool: e.target.checked }))}
                        />
                        <span>Includes heating/cooling</span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadCalculator;import React, { useState, useEffect, useReducer, useMemo, useCallback, Fragment } from 'react';
import { Calculator, Download, AlertCircle, CheckCircle, Save, Upload, FileText, BarChart3, Zap, Home, Car, Battery } from 'lucide-react';

// NEC Constants and Configuration
const NEC_CONSTANTS = {
  GENERAL_LIGHTING_VA_PER_SQFT: 3,
  SMALL_APPLIANCE_VA: 1500,
  LAUNDRY_VA: 1500,
  BATHROOM_VA: 1500,
  DRYER_MIN_VA: 5000,
  EVSE_MIN_VA: 7200,
  CONTINUOUS_LOAD_FACTOR: 1.25,
  SERVICE_SIZES: [100, 125, 150, 175, 200, 225, 250, 300, 350, 400, 500, 600, 800, 1000, 1200],
  DEMAND_FACTORS: {
    OPTIONAL_METHOD: {
      FIRST_10K: 1.0,
      REMAINDER: 0.4
    },
    STANDARD_METHOD: {
      FIRST_3K: 1.0,
      NEXT_117K: 0.35,
      ABOVE_120K: 0.25
    },
    EXISTING_DWELLING: {
      FIRST_8K: 1.0,
      REMAINDER: 0.4
    },
    APPLIANCES: {
      3: 1.0,
      4: 0.75,
      5: 0.75,
      DEFAULT: 0.75
    }
  },
  WIRE_AMPACITY: {
    '14': { copper60C: 15, copper75C: 20, copper90C: 25, aluminum: 15 },
    '12': { copper60C: 20, copper75C: 25, copper90C: 30, aluminum: 20 },
    '10': { copper60C: 30, copper75C: 35, copper90C: 40, aluminum: 30 },
    '8': { copper60C: 40, copper75C: 50, copper90C: 55, aluminum: 40 },
    '6': { copper60C: 55, copper75C: 65, copper90C: 75, aluminum: 50 },
    '4': { copper60C: 70, copper75C: 85, copper90C: 95, aluminum: 65 },
    '3': { copper60C: 85, copper75C: 100, copper90C: 110, aluminum: 75 },
    '2': { copper60C: 95, copper75C: 115, copper90C: 130, aluminum: 90 },
    '1': { copper60C: 110, copper75C: 130, copper90C: 150, aluminum: 100 },
    '1/0': { copper60C: 125, copper75C: 150, copper90C: 170, aluminum: 120 },
    '2/0': { copper60C: 145, copper75C: 175, copper90C: 195, aluminum: 135 },
    '3/0': { copper60C: 165, copper75C: 200, copper90C: 225, aluminum: 155 },
    '4/0': { copper60C: 195, copper75C: 230, copper90C: 260, aluminum: 180 },
    '250': { copper60C: 215, copper75C: 255, copper90C: 290, aluminum: 205 },
    '300': { copper60C: 240, copper75C: 285, copper90C: 320, aluminum: 230 },
    '350': { copper60C: 260, copper75C: 310, copper90C: 350, aluminum: 250 },
    '400': { copper60C: 280, copper75C: 335, copper90C: 380, aluminum: 270 },
    '500': { copper60C: 320, copper75C: 380, copper90C: 430, aluminum: 310 }
  },
  TEMPERATURE_CORRECTION: {
    '86-95': 0.96,
    '96-104': 0.91,
    '105-113': 0.87,
    '114-122': 0.82,
    '123-131': 0.76,
    '132-140': 0.71
  },
  VOLTAGE_DROP: {
    BRANCH_CIRCUIT_MAX: 3,
    FEEDER_MAX: 2,
    COMBINED_MAX: 5
  }
};

// Load Templates
const LOAD_TEMPLATES = {
  GENERAL: [
    { id: 1, name: 'General Lighting & Receptacles', quantity: 2524, amps: 0, volts: 0, va: 3, total: 7572, category: 'lighting', critical: false, circuit: '' },
    { id: 2, name: 'Small Appliance Circuits (Kitchen)', quantity: 3, amps: 20, volts: 120, va: 1500, total: 4500, category: 'kitchen', critical: true, circuit: '' },
    { id: 3, name: 'Laundry Circuit', quantity: 1, amps: 20, volts: 120, va: 1500, total: 1500, category: 'laundry', critical: false, circuit: '' },
    { id: 4, name: 'Bathroom Circuit', quantity: 1, amps: 20, volts: 120, va: 1500, total: 1500, category: 'bathroom', critical: false, circuit: '' },
    { id: 5, name: 'Refrigerators / Freezers', quantity: 1, amps: 6, volts: 120, va: 720, total: 720, category: 'kitchen', critical: true, circuit: '' },
    { id: 6, name: 'Dish Washer', quantity: 1, amps: 10, volts: 120, va: 1200, total: 1200, category: 'kitchen', critical: false, circuit: '' },
    { id: 7, name: 'Disposal', quantity: 1, amps: 6, volts: 120, va: 720, total: 720, category: 'kitchen', critical: false, circuit: '' },
    { id: 8, name: 'Microwave Oven', quantity: 1, amps: 12, volts: 120, va: 1440, total: 1440, category: 'kitchen', critical: false, circuit: '' },
    { id: 9, name: 'Oven/Range', quantity: 1, amps: 40, volts: 240, va: 9600, total: 8000, category: 'kitchen', critical: false, circuit: '' },
    { id: 10, name: 'Clothes Dryer', quantity: 1, amps: 30, volts: 240, va: 7200, total: 7200, category: 'laundry', critical: false, circuit: '' },
    { id: 11, name: 'Garage Door Operators', quantity: 0, amps: 5, volts: 120, va: 600, total: 0, category: 'other', critical: false, circuit: '' },
    { id: 12, name: 'Water Heater', quantity: 1, amps: 24, volts: 240, va: 5760, total: 5760, category: 'other', critical: false, circuit: '' },
    { id: 13, name: 'Landscape Lighting & Controls', quantity: 0, amps: 5, volts: 120, va: 600, total: 0, category: 'other', critical: false, circuit: '' },
    { id: 14, name: 'Pool Pump', quantity: 0, amps: 10, volts: 240, va: 2400, total: 0, category: 'other', critical: false, circuit: '' },
    { id: 15, name: 'Other', quantity: 0, amps: 15, volts: 120, va: 1800, total: 0, category: 'other', critical: false, circuit: '' }
  ],
  HVAC: [
    { id: 1, name: 'Air Conditioning Load #1', quantity: 1, amps: 25, volts: 240, va: 6000, total: 6000, type: 'hvac', critical: true, circuit: '' },
    { id: 2, name: 'Air Conditioning Load #2', quantity: 0, amps: 15, volts: 240, va: 3600, total: 0, type: 'hvac', critical: false, circuit: '' },
    { id: 3, name: 'Heat Pump Load', quantity: 0, amps: 30, volts: 240, va: 7200, total: 0, type: 'hvac', critical: true, circuit: '' },
    { id: 4, name: 'Electric Heat Load', quantity: 0, amps: 20, volts: 240, va: 4800, total: 0, type: 'resistance_heat', critical: true, circuit: '' },
    { id: 5, name: 'Air Handler / Furnace Fan', quantity: 0, amps: 5, volts: 120, va: 600, total: 0, type: 'motor', hp: 0.5, critical: true, circuit: '' },
    { id: 6, name: 'Attic Fan', quantity: 0, amps: 8, volts: 120, va: 960, total: 0, type: 'motor', hp: 1, critical: false, circuit: '' },
    { id: 7, name: 'Other HVAC', quantity: 0, amps: 20, volts: 240, va: 4800, total: 0, type: 'other', critical: false, circuit: '' }
  ],
  EVSE: [
    { id: 1, name: 'Level 2 EV Charger #1', quantity: 0, amps: 48, volts: 240, va: 11520, total: 0, continuous: true, circuit: '' },
    { id: 2, name: 'Level 2 EV Charger #2', quantity: 0, amps: 32, volts: 240, va: 7680, total: 0, continuous: true, circuit: '' },
    { id: 3, name: 'Level 1 EV Charger', quantity: 0, amps: 12, volts: 120, va: 1440, total: 0, continuous: true, circuit: '' },
    { id: 4, name: 'Future EV Charger', quantity: 0, amps: 40, volts: 240, va: 9600, total: 0, continuous: true, circuit: '' }
  ],
  SOLAR_BATTERY: [
    { id: 1, name: 'Solar PV System', kw: 0, inverterAmps: 0, volts: 240, breaker: 0, type: 'solar', location: 'backfeed' },
    { id: 2, name: 'Battery Energy Storage System', kw: 0, inverterAmps: 0, volts: 240, breaker: 0, type: 'battery', location: 'backfeed' },
    { id: 3, name: 'Additional PV System', kw: 0, inverterAmps: 0, volts: 240, breaker: 0, type: 'solar', location: 'backfeed' }
  ]
};

// Reducer for state management
const loadReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_LOAD':
      const { category, id, field, value } = action.payload;
      return {
        ...state,
        [category]: state[category].map(load =>
          load.id === id ? { ...load, [field]: value } : load
        )
      };
    case 'SET_LOADS':
      return { ...state, ...action.payload };
    case 'RESET_LOADS':
      return action.payload;
    default:
      return state;
  }
};

// Utility functions
const calculateWireSize = (amps, volts, distance = 0, tempRating = '75C', conduitFill = 3, material = 'copper') => {
  const adjustedAmps = amps * NEC_CONSTANTS.CONTINUOUS_LOAD_FACTOR;
  
  // Temperature derating
  let tempDerating = 1.0;
  if (tempRating === '90C') tempDerating = 0.96; // Common derating
  
  // Conduit fill derating (more than 3 current-carrying conductors)
  let fillDerating = 1.0;
  if (conduitFill > 3 && conduitFill <= 6) fillDerating = 0.8;
  else if (conduitFill > 6 && conduitFill <= 9) fillDerating = 0.7;
  else if (conduitFill > 9) fillDerating = 0.5;
  
  const deratedAmps = adjustedAmps / (tempDerating * fillDerating);
  
  const ampacityKey = material === 'copper' ? `copper${tempRating}` : 'aluminum';
  
  for (const [size, ampacities] of Object.entries(NEC_CONSTANTS.WIRE_AMPACITY)) {
    if (ampacities[ampacityKey] >= deratedAmps) {
      return size;
    }
  }
  return '500';
};

const calculateVoltageDrop = (amps, volts, wireSize, distance, material = 'copper') => {
  const resistance = {
    copper: {
      '14': 3.14, '12': 1.98, '10': 1.24, '8': 0.778,
      '6': 0.491, '4': 0.308, '3': 0.245, '2': 0.194,
      '1': 0.154, '1/0': 0.122, '2/0': 0.0967, '3/0': 0.0766, '4/0': 0.0608,
      '250': 0.0515, '300': 0.0429, '350': 0.0367, '400': 0.0321, '500': 0.0258
    },
    aluminum: {
      '12': 3.25, '10': 2.04, '8': 1.28, '6': 0.808,
      '4': 0.508, '3': 0.403, '2': 0.319, '1': 0.253,
      '1/0': 0.201, '2/0': 0.159, '3/0': 0.126, '4/0': 0.100
    }
  };
  
  const r = resistance[material][wireSize] || 0.0608;
  const vDrop = (2 * distance * amps * r) / 1000;
  const percentDrop = (vDrop / volts) * 100;
  
  return {
    voltageDrop: vDrop.toFixed(2),
    percentDrop: percentDrop.toFixed(2),
    acceptable: percentDrop <= NEC_CONSTANTS.VOLTAGE_DROP.BRANCH_CIRCUIT_MAX,
    recommendation: percentDrop > NEC_CONSTANTS.VOLTAGE_DROP.BRANCH_CIRCUIT_MAX 
      ? `Increase wire size to limit voltage drop to ${NEC_CONSTANTS.VOLTAGE_DROP.BRANCH_CIRCUIT_MAX}%` 
      : 'Voltage drop within acceptable limits'
  };
};

// Validation functions
const validateLoad = (load) => {
  const warnings = [];
  const errors = [];
  
  if (load.amps > 0) {
    const requiredWireSize = calculateWireSize(load.amps, load.volts);
    const recommendedBreaker = Math.ceil(load.amps * NEC_CONSTANTS.CONTINUOUS_LOAD_FACTOR / 5) * 5;
    
    if (load.breaker && load.breaker < load.amps) {
      errors.push({
        field: 'breaker',
        message: `Breaker undersized. Minimum required: ${recommendedBreaker}A`,
        code: 'NEC 210.20(A)'
      });
    }
    
    if (load.breaker > recommendedBreaker * 1.5) {
      warnings.push({
        field: 'breaker',
        message: `Breaker may be oversized. Recommended: ${recommendedBreaker}A`,
        code: 'NEC 240.4'
      });
    }
  }
  
  return { warnings, errors, valid: errors.length === 0 };
};

// Main Component
const LoadCalculator = () => {
  // State Management
  const [squareFootage, setSquareFootage] = useState(2524);
  const [codeYear, setCodeYear] = useState('2023');
  const [calculationMethod, setCalculationMethod] = useState('optional'); // optional, standard, existing
  const [projectInfo, setProjectInfo] = useState({
    propertyOwner: '',
    propertyAddress: '',
    serviceType: '120/240V - 1PH - 3W - 200A',
    calculatedBy: '',
    date: new Date().toISOString().split('T')[0],
    projectName: 'New Project',
    permitNumber: '',
    utilityCompany: '',
    meterNumber: ''
  });
  
  const [mainBreaker, setMainBreaker] = useState(200);
  const [panelDetails, setPanelDetails] = useState({
    manufacturer: '',
    model: '',
    busRating: 200,
    spaces: 40,
    usedSpaces: 0,
    subfeedBreaker: 0
  });
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState('loads');
  const [useEMS, setUseEMS] = useState(false);
  const [emsMaxLoad, setEmsMaxLoad] = useState(0);
  
  // Actual demand data for 220.87
  const [actualDemandData, setActualDemandData] = useState({
    enabled: false,
    peakDemand: 0,
    averageDemand: 0,
    monitoringDays: 30,
    includesHeatCool: true
  });
  
  // Load state using reducer
  const initialLoadState = {
    generalLoads: LOAD_TEMPLATES.GENERAL,
    hvacLoads: LOAD_TEMPLATES.HVAC,
    evseLoads: LOAD_TEMPLATES.EVSE,
    solarBatteryLoads: LOAD_TEMPLATES.SOLAR_BATTERY
  };
  
  const [loads, dispatch] = useReducer(loadReducer, initialLoadState);
  const { generalLoads, hvacLoads, evseLoads, solarBatteryLoads } = loads;
  
  // Validation and warnings state
  const [validationResults, setValidationResults] = useState({});
  const [calculations, setCalculations] = useState({});
  
  // Check for renewable energy
  const hasRenewableEnergy = useMemo(() => {
    return solarBatteryLoads.some(load => 
      (load.type === 'solar' || load.type === 'battery') && load.kw > 0
    );
  }, [solarBatteryLoads]);
  
  // Update functions with validation
  const updateSquareFootage = (value) => {
    const sqft = parseFloat(value) || 0;
    setSquareFootage(sqft);
    
    dispatch({
      type: 'UPDATE_LOAD',
      payload: {
        category: 'generalLoads',
        id: 1,
        field: 'quantity',
        value: sqft
      }
    });
    
    dispatch({
      type: 'UPDATE_LOAD',
      payload: {
        category: 'generalLoads',
        id: 1,
        field: 'total',
        value: sqft * NEC_CONSTANTS.GENERAL_LIGHTING_VA_PER_SQFT
      }
    });
  };
  
  // Enhanced load update with NEC calculations
  const updateGeneralLoad = (id, field, value) => {
    const load = generalLoads.find(l => l.id === id);
    if (!load) return;
    
    const updatedLoad = { ...load, [field]: field === 'critical' ? value : (parseFloat(value) || 0) };
    
    // Special handling for different load types
    if (load.name === 'General Lighting & Receptacles') {
      if (field === 'quantity') {
        updateSquareFootage(value);
        return;
      }
      updatedLoad.total = updatedLoad.quantity * NEC_CONSTANTS.GENERAL_LIGHTING_VA_PER_SQFT;
    } else if (load.name.includes('Small Appliance')) {
      updatedLoad.total = updatedLoad.quantity * NEC_CONSTANTS.SMALL_APPLIANCE_VA;
    } else if (load.name === 'Laundry Circuit') {
      updatedLoad.total = updatedLoad.quantity * NEC_CONSTANTS.LAUNDRY_VA;
    } else if (load.name === 'Bathroom Circuit') {
      updatedLoad.total = updatedLoad.quantity * NEC_CONSTANTS.BATHROOM_VA;
    } else if (load.name === 'Clothes Dryer') {
      const nameplateVA = updatedLoad.amps * updatedLoad.volts;
      updatedLoad.total = updatedLoad.quantity * Math.max(nameplateVA, NEC_CONSTANTS.DRYER_MIN_VA);
    } else if (load.name === 'Oven/Range') {
      const nameplateVA = updatedLoad.amps * updatedLoad.volts;
      if (nameplateVA <= 12000) {
        updatedLoad.total = updatedLoad.quantity * Math.min(nameplateVA, 8000);
      } else {
        updatedLoad.total = updatedLoad.quantity * (nameplateVA * 0.8);
      }
    } else {
      if (field === 'va') {
        updatedLoad.total = updatedLoad.quantity * updatedLoad.va;
      } else {
        const calculatedVA = updatedLoad.amps * updatedLoad.volts;
        if (calculatedVA > 0) {
          updatedLoad.va = calculatedVA;
          updatedLoad.total = updatedLoad.quantity * calculatedVA;
        } else {
          updatedLoad.total = updatedLoad.quantity * updatedLoad.va;
        }
      }
    }
    
    dispatch({
      type: 'UPDATE_LOAD',
      payload: {
        category: 'generalLoads',
        id,
        field,
        value: field === 'critical' ? value : updatedLoad[field]
      }
    });
    
    if (field !== 'total' && field !== 'critical') {
      dispatch({
        type: 'UPDATE_LOAD',
        payload: {
          category: 'generalLoads',
          id,
          field: 'total',
          value: updatedLoad.total
        }
      });
    }
  };
  
  // Update HVAC load
  const updateHvacLoad = (id, field, value) => {
    const load = hvacLoads.find(l => l.id === id);
    if (!load) return;
    
    const updatedLoad = { ...load, [field]: field === 'critical' ? value : (parseFloat(value) || 0) };
    
    if (field === 'va') {
      updatedLoad.total = updatedLoad.quantity * updatedLoad.va;
    } else {
      const calculatedVA = updatedLoad.amps * updatedLoad.volts;
      if (calculatedVA > 0) {
        updatedLoad.va = calculatedVA;
        updatedLoad.total = updatedLoad.quantity * calculatedVA;
      } else {
        updatedLoad.total = updatedLoad.quantity * updatedLoad.va;
      }
    }
    
    dispatch({
      type: 'UPDATE_LOAD',
      payload: {
        category: 'hvacLoads',
        id,
        field,
        value: field === 'critical' ? value : updatedLoad[field]
      }
    });
    
    if (field !== 'total' && field !== 'critical') {
      dispatch({
        type: 'UPDATE_LOAD',
        payload: {
          category: 'hvacLoads',
          id,
          field: 'total',
          value: updatedLoad.total
        }
      });
    }
  };
  
  // Update EVSE load
  const updateEvseLoad = (id, field, value) => {
    const load = evseLoads.find(l => l.id === id);
    if (!load) return;
    
    const updatedLoad = { ...load, [field]: parseFloat(value) || 0 };
    
    // EVSE minimum 7200VA per NEC 220.57
    if (field === 'va') {
      const enteredVA = parseFloat(value) || 0;
      updatedLoad.va = Math.max(enteredVA, NEC_CONSTANTS.EVSE_MIN_VA);
      updatedLoad.total = updatedLoad.quantity * updatedLoad.va * NEC_CONSTANTS.CONTINUOUS_LOAD_FACTOR;
    } else {
      const calculatedVA = updatedLoad.amps * updatedLoad.volts;
      const minVA = updatedLoad.quantity > 0 ? NEC_CONSTANTS.EVSE_MIN_VA : 0;
      updatedLoad.va = Math.max(calculatedVA, minVA);
      updatedLoad.total = updatedLoad.quantity * updatedLoad.va * NEC_CONSTANTS.CONTINUOUS_LOAD_FACTOR;
    }
    
    dispatch({
      type: 'UPDATE_LOAD',
      payload: {
        category: 'evseLoads',
        id,
        field,
        value: updatedLoad[field]
      }
    });
    
    if (field !== 'total') {
      dispatch({
        type: 'UPDATE_LOAD',
        payload: {
          category: 'evseLoads',
          id,
          field: 'total',
          value: updatedLoad.total
        }
      });
      
      dispatch({
        type: 'UPDATE_LOAD',
        payload: {
          category: 'evseLoads',
          id,
          field: 'va',
          value: updatedLoad.va
        }
      });
    }
  };
  
  // Solar/Battery update function
  const updateSolarBatteryLoad = (id, field, value) => {
    const load = solarBatteryLoads.find(l => l.id === id);
    if (!load) return;
    
    const updatedValue = field === 'location' ? value : (parseFloat(value) || 0);
    
    dispatch({
      type: 'UPDATE_LOAD',
      payload: {
        category: 'solarBatteryLoads',
        id,
        field,
        value: updatedValue
      }
    });
    
    if (field === 'kw' && updatedValue > 0) {
      const inverterAmps = (updatedValue * 1000) / load.volts;
      const continuousAmps = inverterAmps * NEC_CONSTANTS.CONTINUOUS_LOAD_FACTOR;
      const breakerSizes = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200];
      const recommendedBreaker = breakerSizes.find(size => size >= continuousAmps) || continuousAmps;
      
      dispatch({
        type: 'UPDATE_LOAD',
        payload: {
          category: 'solarBatteryLoads',
          id,
          field: 'inverterAmps',
          value: inverterAmps
        }
      });
      
      dispatch({
        type: 'UPDATE_LOAD',
        payload: {
          category: 'solarBatteryLoads',
          id,
          field: 'breaker',
          value: recommendedBreaker
        }
      });
    }
  };
  
  // Get recommended service size
  const getRecommendedServiceSize = (totalAmps) => {
    const minRequired = totalAmps * 1.25; // 25% safety margin
    return NEC_CONSTANTS.SERVICE_SIZES.find(size => size >= minRequired) || 1200;
  };
  
  // Enhanced calculation with memoization
  const memoizedCalculations = useMemo(() => {
    const calc = {};
    const warnings = [];
    const errors = [];
    
    // Check for 220.87 restriction with renewable energy
    if (hasRenewableEnergy && calculationMethod === 'existing' && actualDemandData.enabled) {
      errors.push({
        type: 'error',
        message: 'Cannot use NEC 220.87 existing load determination with renewable energy systems present',
        code: 'NEC 220.87 Exception',
        solution: 'Use standard or optional calculation method instead'
      });
    }
    
    // Calculate EVSE with EMS considerations
    const calculateEvseLoad = () => {
      if (useEMS && emsMaxLoad > 0) {
        // NEC 220.70 - EMS setpoint as continuous load
        return emsMaxLoad * NEC_CONSTANTS.CONTINUOUS_LOAD_FACTOR;
      } else {
        // No demand factor for multiple EVSE without EMS
        return evseLoads.reduce((sum, load) => sum + load.total, 0);
      }
    };
    
    calc.evseVA = calculateEvseLoad();
    
    // Check EVSE capacity
    const evseCount = evseLoads.filter(load => load.quantity > 0).length;
    if (evseCount > 1 && !useEMS) {
      warnings.push({
        type: 'warning',
        message: `${evseCount} EVSEs without Energy Management System require full capacity calculation`,
        code: 'NEC 625.42',
        solution: 'Consider installing EMS per NEC 750.30 to reduce service requirements'
      });
    }
    
    // Solar/Battery interconnection calculations
    const totalSolarAmps = solarBatteryLoads
      .filter(load => load.type === 'solar')
      .reduce((sum, load) => sum + load.breaker, 0);
    const totalBatteryAmps = solarBatteryLoads
      .filter(load => load.type === 'battery')
      .reduce((sum, load) => sum + load.breaker, 0);
    const totalInterconnectionAmps = totalSolarAmps + totalBatteryAmps;
    
    // NEC 705.12(B)(3)(2) - 120% Rule
    const busbarRating = panelDetails.busRating || mainBreaker;
    const maxAllowableBackfeed = (busbarRating * 1.2) - mainBreaker;
    
    if (totalInterconnectionAmps > 0) {
      const backfeedLoads = solarBatteryLoads.filter(load => load.location === 'backfeed');
      if (backfeedLoads.length > 0) {
        if (totalInterconnectionAmps <= maxAllowableBackfeed) {
          warnings.push({
            type: 'success',
            message: `Solar/Battery interconnection ${totalInterconnectionAmps}A is within 120% rule limit of ${maxAllowableBackfeed}A`,
            code: 'NEC 705.12(B)(3)(2)'
          });
        } else {
          errors.push({
            type: 'error',
            message: `Solar/Battery interconnection ${totalInterconnectionAmps}A EXCEEDS 120% rule limit of ${maxAllowableBackfeed}A`,
            code: 'NEC 705.12(B)(3)(2)',
            solution: 'Consider load-side connection, panel upgrade, or power control system'
          });
        }
        
        // Check breaker position
        warnings.push({
          type: 'info',
          message: 'Ensure solar/battery backfeed breakers are at opposite end of busbar from main breaker',
          code: 'NEC 705.12(B)(3)(2)'
        });
      }
    }
    
    // General validations
    if (squareFootage > 15000) {
      warnings.push({
        type: 'warning',
        message: 'Large residence - consider multiple panels or feeders',
        code: 'NEC 225.30'
      });
    }
    
    // Count fixed appliances excluding required items per NEC 220.53
    const fixedAppliances = generalLoads.filter(load => 
      load.total > 0 && 
      !load.name.includes('General Lighting') && 
      !load.name.includes('Small Appliance') && 
      !load.name.includes('Laundry Circuit') &&
      !load.name.includes('Bathroom Circuit') &&
      !load.name.includes('Oven/Range') &&
      !load.name.includes('Clothes Dryer') &&
      !load.name.includes('Space Heat') &&
      !load.name.includes('Air Condition')
    );
    const applianceCount = fixedAppliances.length;
    
    // EVSE should never be in the 75% calculation
    if (evseCount > 0) {
      warnings.push({
        type: 'info',
        message: 'EVSE loads calculated at 125% continuous with no demand reduction',
        code: 'NEC 625.42'
      });
    }
    
    // Calculate based on selected method
    if (calculationMethod === 'optional') {
      // Optional Method (NEC 220.82)
      const generalLightingVA = generalLoads.find(l => l.name.includes('General Lighting'))?.total || 0;
      const smallApplianceVA = generalLoads.filter(l => l.name.includes('Small Appliance')).reduce((sum, l) => sum + l.total, 0);
      const laundryVA = generalLoads.find(l => l.name === 'Laundry Circuit')?.total || 0;
      const bathVA = generalLoads.find(l => l.name === 'Bathroom Circuit')?.total || 0;
      const totalGeneralVA = generalLightingVA + smallApplianceVA + laundryVA + bathVA;
      
      const first10kVA = Math.min(totalGeneralVA, 10000);
      const remainder = Math.max(totalGeneralVA - 10000, 0);
      calc.generalDemand = first10kVA + (remainder * NEC_CONSTANTS.DEMAND_FACTORS.OPTIONAL_METHOD.REMAINDER);
      
      // Fixed appliances with demand factor
      let fixedApplianceVA = fixedAppliances.reduce((sum, appliance) => sum + appliance.total, 0);
      
      let applianceDemandFactor = 1.0;
      if (applianceCount >= 4) {
        applianceDemandFactor = NEC_CONSTANTS.DEMAND_FACTORS.APPLIANCES[4];
        warnings.push({
          type: 'info',
          message: `Applied 75% demand factor for ${applianceCount} fixed appliances (excluding range, dryer, HVAC, EVSE per NEC 220.53)`,
          code: 'NEC 220.53'
        });
      }
      calc.applianceDemand = fixedApplianceVA * applianceDemandFactor;
      
      // Include range and dryer at 100%
      const rangeVA = generalLoads.find(load => load.name.includes('Oven/Range'))?.total || 0;
      const dryerVA = generalLoads.find(load => load.name.includes('Clothes Dryer'))?.total || 0;
      
      // Motor loads
      const motorLoads = hvacLoads.filter(load => load.type === 'motor' && load.total > 0);
      if (motorLoads.length > 0) {
        const sortedMotors = motorLoads.sort((a, b) => b.total - a.total);
        const largestMotor = sortedMotors[0];
        const otherMotors = sortedMotors.slice(1);
        
        calc.motorDemand = (largestMotor.total * NEC_CONSTANTS.CONTINUOUS_LOAD_FACTOR) + 
                          otherMotors.reduce((sum, motor) => sum + motor.total, 0);
        
        warnings.push({
          type: 'info',
          message: `Applied 125% factor to largest motor: ${largestMotor.name}`,
          code: 'NEC 430.24'
        });
      } else {
        calc.motorDemand = 0;
      }
      
      // HVAC
      const hvacVA = Math.max(...hvacLoads
        .filter(load => (load.type === 'hvac' || load.type === 'resistance_heat') && load.total > 0)
        .map(load => load.total), 0);
      
      // Other
      const otherVA = hvacLoads.filter(load => load.type === 'other').reduce((sum, load) => sum + load.total, 0);
      
      calc.totalVA = calc.generalDemand + calc.applianceDemand + rangeVA + dryerVA + 
                     calc.motorDemand + hvacVA + calc.evseVA + otherVA;
      calc.cookingVA = rangeVA;
      calc.cookingDemand = rangeVA;
      calc.dryerVA = dryerVA;
      calc.hvacVA = hvacVA;
      calc.applianceVA = fixedApplianceVA;
      
    } else if (calculationMethod === 'standard') {
      // Standard Method (NEC 220.42-220.55)
      const generalLightingVA = generalLoads.find(l => l.name.includes('General Lighting'))?.total || 0;
      const smallApplianceVA = generalLoads.filter(l => l.name.includes('Small Appliance')).reduce((sum, l) => sum + l.total, 0);
      const laundryVA = generalLoads.find(l => l.name === 'Laundry Circuit')?.total || 0;
      const bathVA = generalLoads.find(l => l.name === 'Bathroom Circuit')?.total || 0;
      const totalGeneralVA = generalLightingVA + smallApplianceVA + laundryVA + bathVA;
      
      const first3kVA = Math.min(totalGeneralVA, 3000);
      const next117kVA = Math.min(Math.max(totalGeneralVA - 3000, 0), 117000);
      const above120kVA = Math.max(totalGeneralVA - 120000, 0);
      calc.generalDemand = first3kVA + 
                          (next117kVA * NEC_CONSTANTS.DEMAND_FACTORS.STANDARD_METHOD.NEXT_117K) + 
                          (above120kVA * NEC_CONSTANTS.DEMAND_FACTORS.STANDARD_METHOD.ABOVE_120K);
      
      // Cooking with Table 220.55
      const cookingVA = generalLoads.find(load => load.name.includes('Oven/Range'))?.total || 0;
      calc.cookingVA = cookingVA;
      if (cookingVA <= 12000) {
        calc.cookingDemand = Math.min(cookingVA, 8000);
      } else if (cookingVA <= 27000) {
        calc.cookingDemand = cookingVA * 0.8;
      } else {
        calc.cookingDemand = cookingVA * 0.65;
      }
      
      // Fixed appliances with demand factors
      let fixedApplianceVA = fixedAppliances.reduce((sum, appliance) => sum + appliance.total, 0);
      
      let applianceDemandFactor = 1.0;
      if (applianceCount >= 4) {
        applianceDemandFactor = 0.75;
        warnings.push({
          type: 'info',
          message: `Applied 75% demand factor for ${applianceCount} fixed appliances (excluding range, dryer, HVAC, EVSE per NEC 220.53)`,
          code: 'NEC 220.53'
        });
      }
      calc.applianceDemand = fixedApplianceVA * applianceDemandFactor;
      calc.applianceVA = fixedApplianceVA;
      
      // Dryer at 100% or 5000W minimum
      const dryerVA = generalLoads.find(load => load.name.includes('Clothes Dryer'))?.total || 0;
      calc.dryerVA = dryerVA;
      
      // Motor loads
      const motorLoads = hvacLoads.filter(load => load.type === 'motor' && load.total > 0);
      if (motorLoads.length > 0) {
        const sortedMotors = motorLoads.sort((a, b) => b.total - a.total);
        const largestMotor = sortedMotors[0];
        const otherMotors = sortedMotors.slice(1);
        
        calc.motorDemand = (largestMotor.total * 1.25) + 
                          otherMotors.reduce((sum, motor) => sum + motor.total, 0);
        
        warnings.push({
          type: 'info',
          message: `Applied 125% factor to largest motor: ${largestMotor.name}`,
          code: 'NEC 430.24'
        });
      } else {
        calc.motorDemand = 0;
      }
      
      // HVAC
      const hvacVA = Math.max(...hvacLoads
        .filter(load => (load.type === 'hvac' || load.type === 'resistance_heat') && load.total > 0)
        .map(load => load.total), 0);
      
      // Other loads
      const otherVA = hvacLoads.filter(load => load.type === 'other').reduce((sum, load) => sum + load.total, 0);
      
      calc.hvacVA = hvacVA;
      calc.totalVA = calc.generalDemand + calc.cookingDemand + calc.applianceDemand + 
                     dryerVA + calc.motorDemand + hvacVA + calc.evseVA + otherVA;
                     
    } else if (calculationMethod === 'existing') {
      // Existing Dwelling Unit (NEC 220.83)
      if (actualDemandData.enabled && !hasRenewableEnergy) {
        // Use actual demand data per 220.87
        calc.existingLoad = actualDemandData.peakDemand * 240;
        calc.totalVA = calc.existingLoad + calc.evseVA;
        warnings.push({
          type: 'info',
          message: `Using actual demand data: ${actualDemandData.peakDemand}A peak over ${actualDemandData.monitoringDays} days`,
          code: 'NEC 220.87'
        });
      } else {
        // Use 220.83 calculation
        const generalLightingVA = generalLoads.find(l => l.name.includes('General Lighting'))?.total || 0;
        const smallApplianceVA = generalLoads.filter(l => l.name.includes('Small Appliance')).reduce((sum, l) => sum + l.total, 0);
        const laundryVA = generalLoads.find(l => l.name === 'Laundry Circuit')?.total || 0;
        const totalGeneralVA = generalLightingVA + smallApplianceVA + laundryVA;
        
        const first8kVA = Math.min(totalGeneralVA, 8000);
        const remainder = Math.max(totalGeneralVA - 8000, 0);
        calc.generalDemand = first8kVA + (remainder * NEC_CONSTANTS.DEMAND_FACTORS.EXISTING_DWELLING.REMAINDER);
        
        // Add other loads
        const allOtherLoads = generalLoads.filter(l => 
          !l.name.includes('General Lighting') && 
          !l.name.includes('Small Appliance') && 
          !l.name.includes('Laundry')
        ).reduce((sum, l) => sum + l.total, 0);
        
        const hvacTotal = hvacLoads.reduce((sum, l) => sum + l.total, 0);
        
        calc.totalVA = calc.generalDemand + allOtherLoads + hvacTotal + calc.evseVA;
      }
    }
    
    // Final calculations
    calc.totalAmps = calc.totalVA / 240;
    calc.generalLoadVA = generalLoads.reduce((sum, load) => sum + load.total, 0);
    
    // Critical loads calculation
    calc.criticalLoadsVA = [...generalLoads, ...hvacLoads].filter(load => load.critical).reduce((sum, load) => sum + load.total, 0);
    calc.criticalLoadsAmps = calc.criticalLoadsVA / 240;
    
    // Solar/Battery summary
    calc.solarCapacityKW = solarBatteryLoads
      .filter(load => load.type === 'solar')
      .reduce((sum, load) => sum + load.kw, 0);
    calc.batteryCapacityKW = solarBatteryLoads
      .filter(load => load.type === 'battery')
      .reduce((sum, load) => sum + load.kw, 0);
    calc.totalInterconnectionAmps = totalInterconnectionAmps;
    calc.maxAllowableBackfeed = maxAllowableBackfeed;
    calc.interconnectionCompliant = totalInterconnectionAmps <= maxAllowableBackfeed;
    
    // Service adequacy and recommendations
    calc.serviceAdequate = calc.totalAmps <= mainBreaker;
    calc.serviceSize = mainBreaker;
    calc.spareCapacity = ((mainBreaker - calc.totalAmps) / mainBreaker) * 100;
    calc.recommendedService = getRecommendedServiceSize(calc.totalAmps);
    
    // Professional recommendations
    if (calc.totalAmps > mainBreaker * 0.8) {
      warnings.push({
        type: 'warning',
        message: `Load at ${(calc.totalAmps/mainBreaker*100).toFixed(0)}% of service capacity - exceeds 80% rule for continuous operation`,
        code: 'Best Practice',
        solution: `Consider upgrading to ${calc.recommendedService}A service`
      });
    }
    
    if (calc.spareCapacity < 25 && calc.serviceAdequate) {
      warnings.push({
        type: 'warning',
        message: 'Less than 25% spare capacity - limited room for future expansion',
        code: 'Best Practice'
      });
    }
    
    if (calc.evseVA > 0 && calc.spareCapacity < 15) {
      warnings.push({
        type: 'warning',
        message: 'EV charging with minimal spare capacity - consider load management system',
        code: 'NEC 625.42'
      });
    }
    
    if (calc.evseVA > 0 && calc.solarCapacityKW > 0) {
      warnings.push({
        type: 'info',
        message: 'Combined solar + EV installation - verify utility net metering policies',
        code: 'Utility Requirements'
      });
    }
    
    // Ensure no NaN values
    Object.keys(calc).forEach(key => {
      if (isNaN(calc[key])) {
        console.warn(`NaN detected for ${key}`);
        calc[key] = 0;
      }
    });
    
    return { calculations: calc, warnings, errors };
  }, [generalLoads, hvacLoads, evseLoads, solarBatteryLoads, calculationMethod, mainBreaker, squareFootage, hasRenewableEnergy, actualDemandData, useEMS, emsMaxLoad, panelDetails]);
  
  // Update calculations when dependencies change
  useEffect(() => {
    setCalculations(memoizedCalculations.calculations);
  }, [memoizedCalculations]);
  
  // Panel Schedule Component
  const PanelSchedule = () => {
    const circuits = [];
    let currentCircuit = 1;
    
    // Add general loads
    generalLoads.forEach(load => {
      if (load.quantity > 0 && load.amps > 0) {
        const poles = load.volts > 120 ? 2 : 1;
        circuits.push({
          circuit: currentCircuit,
          description: load.name,
          amps: load.amps,
          poles,
          wire: calculateWireSize(load.amps, load.volts),
          critical: load.critical
        });
        currentCircuit += poles;
      }
    });
    
    // Add HVAC
    hvacLoads.forEach(load => {
      if (load.quantity > 0) {
        const poles = load.volts > 120 ? 2 : 1;
        circuits.push({
          circuit: currentCircuit,
          description: load.name,
          amps: load.amps,
          poles,
          wire: calculateWireSize(load.amps, load.volts),
          critical: load.critical
        });
        currentCircuit += poles;
      }
    });
    
    // Add EVSE
    evseLoads.forEach(load => {
      if (load.quantity > 0) {
        const poles = load.volts > 120 ? 2 : 1;
        const breakerAmps = Math.ceil(load.amps * 1.25 / 5) * 5;
        circuits.push({
          circuit: currentCircuit,
          description: load.name + ' (Continuous)',
          amps: breakerAmps,
          poles,
          wire: calculateWireSize(load.amps, load.volts),
          critical: false
        });
        currentCircuit += poles;
      }
    });
    
    panelDetails.usedSpaces = currentCircuit - 1;
    
    return (
      <div className="bg-white rounded shadow p-3">
        <h3 className="text-sm font-bold mb-2">Panel Schedule</h3>
        <div className="mb-2 text-xs">
          <span>Panel: {panelDetails.manufacturer} {panelDetails.model}</span>
          <span className="ml-4">Spaces: {panelDetails.usedSpaces}/{panelDetails.spaces}</span>
        </div>
        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-1">Circuit</th>
              <th className="border border-black p-1">Description</th>
              <th className="border border-black p-1">Amps</th>
              <th className="border border-black p-1">Poles</th>
              <th className="border border-black p-1">Wire</th>
              <th className="border border-black p-1">Critical</th>
            </tr>
          </thead>
          <tbody>
            {circuits.map((circuit, idx) => (
              <tr key={idx}>
                <td className="border border-black p-1 text-center">{circuit.circuit}</td>
                <td className="border border-black p-1">{circuit.description}</td>
                <td className="border border-black p-1 text-center">{circuit.amps}</td>
                <td className="border border-black p-1 text-center">{circuit.poles}</td>
                <td className="border border-black p-1 text-center">{circuit.wire}</td>
                <td className="border border-black p-1 text-center">
                  {circuit.critical && <span className="text-red-600">✓</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Load distribution visualization
  const LoadDistribution = () => {
    const categories = {
      lighting: { color: 'bg-blue-500', label: 'Lighting & Receptacles' },
      kitchen: { color: 'bg-green-500', label: 'Kitchen & Laundry' },
      hvac: { color: 'bg-yellow-500', label: 'HVAC' },
      evse: { color: 'bg-purple-500', label: 'EV Charging' },
      other: { color: 'bg-gray-500', label: 'Other' }
    };
    
    const loadsByCategory = useMemo(() => {
      const result = { lighting: 0, kitchen: 0, hvac: 0, evse: 0, other: 0 };
      
      generalLoads.forEach(load => {
        if (load.category && load.total > 0) {
          if (load.category === 'laundry') {
            result.kitchen += load.total;
          } else {
            result[load.category] = (result[load.category] || 0) + load.total;
          }
        }
      });
      
      hvacLoads.forEach(load => {
        if (load.total > 0) {
          result.hvac += load.total;
        }
      });
      
      result.evse = calculations.evseVA || 0;
      
      return result;
    }, [generalLoads, hvacLoads, calculations.evseVA]);
    
    const totalLoad = Object.values(loadsByCategory).reduce((sum, val) => sum + val, 0);
    
    return (
      <div className="mb-4 p-3 bg-white rounded shadow">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-bold">Load Distribution Analysis</h4>
        </div>
        <div className="relative h-8 bg-gray-200 rounded overflow-hidden mb-3">
          {Object.entries(loadsByCategory).reduce((acc, [category, value], index) => {
            if (value === 0) return acc;
            const width = (value / totalLoad) * 100;
            const left = acc.offset;
            acc.elements.push(
              <div
                key={category}
                className={`absolute h-full ${categories[category].color}`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`
                }}
                title={`${categories[category].label}: ${value.toLocaleString()} VA (${width.toFixed(1)}%)`}
              />
            );
            acc.offset += width;
            return acc;
          }, { elements: [], offset: 0 }).elements}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(categories).map(([key, { color, label }]) => (
            <div key={key} className="flex items-center gap-1">
              <div className={`w-3 h-3 ${color} rounded`} />
              <span>{label}: {loadsByCategory[key].toLocaleString()} VA</span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Project management
  const saveProject = () => {
    const project = {
      id: Date.now().toString(),
      name: projectInfo.projectName,
      date: new Date().toISOString(),
      data: {
        projectInfo,
        squareFootage,
        mainBreaker,
        calculationMethod,
        generalLoads,
        hvacLoads,
        evseLoads,
        solarBatteryLoads,
        calculations,
        panelDetails,
        useEMS,
        emsMaxLoad
      }
    };
    
    localStorage.setItem(`nec_project_${project.id}`, JSON.stringify(project));
    alert('Project saved successfully!');
  };
  
  const loadProject = (projectId) => {
    const saved = localStorage.getItem(`nec_project_${projectId}`);
    if (saved) {
      const project = JSON.parse(saved);
      setProjectInfo(project.data.projectInfo);
      setSquareFootage(project.data.squareFootage);
      setMainBreaker(project.data.mainBreaker);
      setCalculationMethod(project.data.calculationMethod);
      setPanelDetails(project.data.panelDetails || panelDetails);
      setUseEMS(project.data.useEMS || false);
      setEmsMaxLoad(project.data.emsMaxLoad || 0);
      dispatch({ type: 'SET_LOADS', payload: {
        generalLoads: project.data.generalLoads,
        hvacLoads: project.data.hvacLoads,
        evseLoads: project.data.evseLoads || LOAD_TEMPLATES.EVSE,
        solarBatteryLoads: project.data.solarBatteryLoads
      }});
    }
  };
  
  // Enhanced report generation
  const generateReport = () => {
    const report = `
ELECTRICAL LOAD CALCULATION REPORT
NEC ${codeYear} COMPLIANT
==================

PROJECT INFORMATION
-------------------
Project Name: ${projectInfo.projectName}
Property Owner: ${projectInfo.propertyOwner}
Property Address: ${projectInfo.propertyAddress}
Calculated By: ${projectInfo.calculatedBy}
Date: ${projectInfo.date}
Permit Number: ${projectInfo.permitNumber || 'N/A'}
Utility Company: ${projectInfo.utilityCompany || 'N/A'}

BUILDING INFORMATION
--------------------
Square Footage: ${squareFootage} sq ft
Calculation Method: ${calculationMethod === 'optional' ? 'Optional (NEC 220.82)' : 
                    calculationMethod === 'standard' ? 'Standard (NEC 220.42-55)' : 
                    'Existing Dwelling (NEC 220.83)'}
${hasRenewableEnergy ? 'Renewable Energy Present: YES' : ''}

SERVICE INFORMATION
-------------------
Existing Service: ${projectInfo.serviceType}
Main Breaker: ${mainBreaker}A
Panel: ${panelDetails.manufacturer} ${panelDetails.model}
Bus Rating: ${panelDetails.busRating}A
Spaces: ${panelDetails.usedSpaces}/${panelDetails.spaces} used

LOAD SUMMARY
------------
General Loads Total: ${calculations.generalLoadVA?.toLocaleString() || 0} VA
General Load Demand: ${calculations.generalDemand?.toLocaleString() || 0} VA
Fixed Appliances: ${calculations.applianceVA?.toLocaleString() || 0} VA (Demand: ${calculations.applianceDemand?.toLocaleString() || 0} VA)
Cooking Equipment: ${calculations.cookingVA?.toLocaleString() || 0} VA (Demand: ${calculations.cookingDemand?.toLocaleString() || 0} VA)
Clothes Dryer: ${calculations.dryerVA?.toLocaleString() || 0} VA
HVAC Equipment: ${calculations.hvacVA?.toLocaleString() || 0} VA
Motor Loads: ${calculations.motorDemand?.toLocaleString() || 0} VA
EV Charging: ${calculations.evseVA?.toLocaleString() || 0} VA${useEMS ? ' (with EMS)' : ''}

CRITICAL LOADS
--------------
Total Critical Loads: ${calculations.criticalLoadsVA?.toLocaleString() || 0} VA (${calculations.criticalLoadsAmps?.toFixed(1) || 0}A)

TOTAL CALCULATED LOAD
---------------------
Total Volt-Amps: ${calculations.totalVA?.toLocaleString() || 0} VA
Total Load Amps: ${calculations.totalAmps?.toFixed(1) || 0} A
80% Continuous Rating: ${(calculations.totalAmps * 0.8)?.toFixed(1) || 0} A

SERVICE ANALYSIS
----------------
Current Service Size: ${calculations.serviceSize}A
Calculated Load: ${calculations.totalAmps?.toFixed(1) || 0}A
Remaining Capacity: ${Math.max(calculations.serviceSize - (calculations.totalAmps || 0), 0).toFixed(1)}A
Spare Capacity: ${calculations.spareCapacity?.toFixed(1) || 0}%
Recommended Service: ${calculations.recommendedService}A

SERVICE ADEQUACY: ${calculations.serviceAdequate ? 
  `${calculations.serviceSize}A Service is ADEQUATE` :
  `${calculations.serviceSize}A Service is INADEQUATE - Recommend ${calculations.recommendedService}A`}

RENEWABLE ENERGY SYSTEMS
------------------------
Solar PV Capacity: ${calculations.solarCapacityKW || 0} kW
Battery Storage: ${calculations.batteryCapacityKW || 0} kW
Total Interconnection: ${calculations.totalInterconnectionAmps || 0}A
120% Rule Limit: ${calculations.maxAllowableBackfeed || 0}A
NEC 705.12 Compliant: ${calculations.interconnectionCompliant ? 'YES' : 'NO'}

DETAILED LOAD BREAKDOWN
-----------------------
GENERAL LOADS:
${generalLoads.map(load => 
  `${load.name}: Qty=${load.quantity}, ${load.amps}A @ ${load.volts}V, ${load.va}VA, Total=${load.total}VA${load.critical ? ' [CRITICAL]' : ''}`
).join('\n')}

HVAC LOADS:
${hvacLoads.map(load => 
  `${load.name}: Qty=${load.quantity}, ${load.amps}A @ ${load.volts}V, ${load.va}VA, Total=${load.total}VA${load.critical ? ' [CRITICAL]' : ''}`
).join('\n')}

EV CHARGING:
${evseLoads.map(load => 
  `${load.name}: Qty=${load.quantity}, ${load.amps}A @ ${load.volts}V, ${load.va}VA, Total=${load.total}VA (Continuous)`
).join('\n')}

SOLAR &