import React from 'react';
import { AlertCircle, Info, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { useLoadCalculator } from '../../hooks/useLoadCalculator';
import { TooltipWrapper } from '../UI/TooltipWrapper';

interface LoadManagementSectionProps {
  isLoadManagementExpanded: boolean;
  setIsLoadManagementExpanded: (expanded: boolean) => void;
  activeEvseCount: number;
  totalEvseAmps: number;
}

export const LoadManagementSection: React.FC<LoadManagementSectionProps> = React.memo(
  ({
    isLoadManagementExpanded,
    setIsLoadManagementExpanded,
    activeEvseCount,
    totalEvseAmps,
  }) => {
    const { state, updateSettings } = useLoadCalculator();
    const { generalLoads, hvacLoads, evseLoads } = state.loads;

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-100/50 transition-colors"
          onClick={() => setIsLoadManagementExpanded(!isLoadManagementExpanded)}
        >
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-blue-800">Load Management System</h3>
            <TooltipWrapper term="load_management">
              <Info className="h-4 w-4 text-blue-500 cursor-help" />
            </TooltipWrapper>
            {state.loadManagementType !== 'none' && (
              <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                {state.loadManagementType.toUpperCase()}
                {state.loadManagementType === 'simpleswitch' &&
                  ` (${state.simpleSwitchMode.replace('_', ' ').toUpperCase()})`}
              </span>
            )}
          </div>
          {isLoadManagementExpanded ? (
            <ChevronUp className="h-5 w-5 text-blue-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-blue-600" />
          )}
        </div>

        {isLoadManagementExpanded && (
          <div className="px-4 pb-4 border-t border-blue-200 bg-white/50">
            <div className="space-y-4 pt-4">
              {/* Load Management Type Selection */}
              <div>
                <label className="text-sm font-medium text-blue-700 mb-2 block">
                  Load Management Type:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                    <input
                      type="radio"
                      name="loadManagementType"
                      value="none"
                      checked={state.loadManagementType === 'none'}
                      onChange={(e) =>
                        updateSettings({
                          loadManagementType: e.target.value as any,
                          useEMS: false,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">None</div>
                      <div className="text-xs text-gray-500">Full simultaneous capacity</div>
                    </div>
                  </label>

                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                    <input
                      type="radio"
                      name="loadManagementType"
                      value="ems"
                      checked={state.loadManagementType === 'ems'}
                      onChange={(e) =>
                        updateSettings({
                          loadManagementType: e.target.value as any,
                          useEMS: true,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">EMS</div>
                      <div className="text-xs text-gray-500">Limit simultaneous load</div>
                    </div>
                  </label>

                  <TooltipWrapper term="simpleswitch">
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-green-50 transition-colors">
                      <input
                        type="radio"
                        name="loadManagementType"
                        value="simpleswitch"
                        checked={state.loadManagementType === 'simpleswitch'}
                        onChange={(e) =>
                          updateSettings({
                            loadManagementType: e.target.value as any,
                            useEMS: false,
                          })
                        }
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">SimpleSwitch</div>
                        <div className="text-xs text-gray-500">Prevent simultaneous operation</div>
                      </div>
                    </label>
                  </TooltipWrapper>

                  <TooltipWrapper term="dcc">
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
                      <input
                        type="radio"
                        name="loadManagementType"
                        value="dcc"
                        checked={state.loadManagementType === 'dcc'}
                        onChange={(e) =>
                          updateSettings({
                            loadManagementType: e.target.value as any,
                            useEMS: false,
                          })
                        }
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">DCC</div>
                        <div className="text-xs text-gray-500">Smart current management</div>
                      </div>
                    </label>
                  </TooltipWrapper>
                </div>
              </div>

              {/* SimpleSwitch Configuration */}
              {state.loadManagementType === 'simpleswitch' && (
                <div className="bg-white rounded-md p-3 border border-green-200">
                  <div className="mb-3">
                    <label className="text-sm font-medium text-green-700 mb-2 block">
                      SimpleSwitch Operating Mode:
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-green-50">
                        <input
                          type="radio"
                          name="simpleSwitchMode"
                          value="branch_sharing"
                          checked={state.simpleSwitchMode === 'branch_sharing'}
                          onChange={(e) =>
                            updateSettings({ simpleSwitchMode: e.target.value as any })
                          }
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">Branch Circuit Sharing</div>
                          <div className="text-xs text-gray-500">
                            Manages two appliances on separate circuits (50A max each)
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-green-50">
                        <input
                          type="radio"
                          name="simpleSwitchMode"
                          value="feeder_monitoring"
                          checked={state.simpleSwitchMode === 'feeder_monitoring'}
                          onChange={(e) =>
                            updateSettings({ simpleSwitchMode: e.target.value as any })
                          }
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">Feeder Monitoring</div>
                          <div className="text-xs text-gray-500">
                            Whole-home load management at 80% panel capacity
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Branch Sharing Configuration */}
                  {state.simpleSwitchMode === 'branch_sharing' && (
                    <div className="bg-green-50 rounded p-3 space-y-3">
                      <div className="text-xs text-green-700 mb-2">
                        <strong>Branch Circuit Sharing:</strong> SimpleSwitch automatically switches between two
                        appliances. Only one appliance operates at full power at any time.
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Load A Selector */}
                        <div>
                          <label className="text-sm font-medium text-green-700 block mb-1">
                            Load A:
                          </label>
                          <select
                            value={state.simpleSwitchLoadA ? `${state.simpleSwitchLoadA.type}-${state.simpleSwitchLoadA.id}` : ''}
                            onChange={(e) => {
                              if (!e.target.value) {
                                updateSettings({ simpleSwitchLoadA: null });
                                return;
                              }

                              const [type, idStr] = e.target.value.split('-');
                              const id = parseInt(idStr);

                              let selectedLoad = null;
                              if (type === 'general') {
                                const load = generalLoads.find((l) => l.id === id);
                                if (load)
                                  selectedLoad = { type: 'general' as const, id, name: load.name, amps: load.amps };
                              } else if (type === 'hvac') {
                                const load = hvacLoads.find((l) => l.id === id);
                                if (load)
                                  selectedLoad = { type: 'hvac' as const, id, name: load.name, amps: load.amps };
                              } else if (type === 'evse') {
                                const load = evseLoads.find((l) => l.id === id);
                                if (load)
                                  selectedLoad = { type: 'evse' as const, id, name: load.name, amps: load.amps };
                              }

                              updateSettings({ simpleSwitchLoadA: selectedLoad });
                            }}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
                          >
                            <option value="">Select Load A</option>
                            <optgroup label="General Loads">
                              {generalLoads.filter((load) => load.quantity === 1).map((load) => (
                                <option key={`general-${load.id}`} value={`general-${load.id}`}>
                                  {load.name} ({load.amps}A, Qty: {load.quantity})
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="HVAC Loads">
                              {hvacLoads.filter((load) => load.quantity === 1).map((load) => (
                                <option key={`hvac-${load.id}`} value={`hvac-${load.id}`}>
                                  {load.name} ({load.amps}A, Qty: {load.quantity})
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="EVSE Loads">
                              {evseLoads.filter((load) => load.quantity === 1).map((load) => (
                                <option key={`evse-${load.id}`} value={`evse-${load.id}`}>
                                  {load.name} ({load.amps}A, Qty: {load.quantity})
                                </option>
                              ))}
                            </optgroup>
                          </select>
                          {state.simpleSwitchLoadA && state.simpleSwitchLoadA.amps > 50 && (
                            <div className="text-xs text-red-600 mt-1">⚠️ Exceeds 50A SimpleSwitch limit</div>
                          )}
                        </div>

                        {/* Load B Selector */}
                        <div>
                          <label className="text-sm font-medium text-green-700 block mb-1">
                            Load B:
                          </label>
                          <select
                            value={state.simpleSwitchLoadB ? `${state.simpleSwitchLoadB.type}-${state.simpleSwitchLoadB.id}` : ''}
                            onChange={(e) => {
                              if (!e.target.value) {
                                updateSettings({ simpleSwitchLoadB: null });
                                return;
                              }

                              const [type, idStr] = e.target.value.split('-');
                              const id = parseInt(idStr);

                              let selectedLoad = null;
                              if (type === 'general') {
                                const load = generalLoads.find((l) => l.id === id);
                                if (load)
                                  selectedLoad = { type: 'general' as const, id, name: load.name, amps: load.amps };
                              } else if (type === 'hvac') {
                                const load = hvacLoads.find((l) => l.id === id);
                                if (load)
                                  selectedLoad = { type: 'hvac' as const, id, name: load.name, amps: load.amps };
                              } else if (type === 'evse') {
                                const load = evseLoads.find((l) => l.id === id);
                                if (load)
                                  selectedLoad = { type: 'evse' as const, id, name: load.name, amps: load.amps };
                              }

                              updateSettings({ simpleSwitchLoadB: selectedLoad });
                            }}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
                          >
                            <option value="">Select Load B</option>
                            <optgroup label="General Loads">
                              {generalLoads.filter((load) => load.quantity === 1).map((load) => (
                                <option key={`general-${load.id}`} value={`general-${load.id}`}>
                                  {load.name} ({load.amps}A, Qty: {load.quantity})
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="HVAC Loads">
                              {hvacLoads.filter((load) => load.quantity === 1).map((load) => (
                                <option key={`hvac-${load.id}`} value={`hvac-${load.id}`}>
                                  {load.name} ({load.amps}A, Qty: {load.quantity})
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="EVSE Loads">
                              {evseLoads.filter((load) => load.quantity === 1).map((load) => (
                                <option key={`evse-${load.id}`} value={`evse-${load.id}`}>
                                  {load.name} ({load.amps}A, Qty: {load.quantity})
                                </option>
                              ))}
                            </optgroup>
                          </select>
                          {state.simpleSwitchLoadB && state.simpleSwitchLoadB.amps > 50 && (
                            <div className="text-xs text-red-600 mt-1">⚠️ Exceeds 50A SimpleSwitch limit</div>
                          )}
                        </div>
                      </div>

                      {(state.simpleSwitchLoadA || state.simpleSwitchLoadB) && (
                        <div className="text-xs space-y-1 pt-2 border-t border-green-200">
                          <div className="text-green-700">
                            Maximum Simultaneous Load: <span className="font-medium">
                              {Math.max(state.simpleSwitchLoadA?.amps || 0, state.simpleSwitchLoadB?.amps || 0)}A
                            </span>
                          </div>
                          <div className="text-green-600">
                            Demand Reduction: <span className="font-medium">
                              {Math.max(
                                0,
                                (state.simpleSwitchLoadA?.amps || 0) +
                                  (state.simpleSwitchLoadB?.amps || 0) -
                                  Math.max(
                                    state.simpleSwitchLoadA?.amps || 0,
                                    state.simpleSwitchLoadB?.amps || 0
                                  )
                              )}A
                            </span>
                            <span className="ml-1">(prevented simultaneous operation)</span>
                          </div>
                        </div>
                      )}

                      {/* Warning if both loads not selected */}
                      {(!state.simpleSwitchLoadA || !state.simpleSwitchLoadB) && (
                        <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                          ⚠️ Both Load A and Load B must be selected for proper SimpleSwitch operation.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feeder Monitoring Configuration */}
                  {state.simpleSwitchMode === 'feeder_monitoring' && (
                    <div className="bg-green-50 rounded p-3 space-y-3">
                      <div className="text-xs text-green-700 mb-2">
                        <strong>Feeder Monitoring:</strong> SimpleSwitch monitors whole-home electrical load and
                        pauses charging when panel reaches 80% capacity ({ (state.mainBreaker * 0.8).toFixed(0) }A).
                      </div>

                      <div>
                        <label className="text-sm font-medium text-green-700 block mb-1">
                          Maximum Load Override (A):
                        </label>
                        <input
                          type="number"
                          value={state.loadManagementMaxLoad || ''}
                          onChange={(e) =>
                            updateSettings({ loadManagementMaxLoad: parseFloat(e.target.value) || 0 })
                          }
                          className="w-32 text-center border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
                          min="0"
                          max="50"
                          step="1"
                          placeholder={`Default: ${Math.min(state.mainBreaker * 0.8, 50).toFixed(0)}`}
                        />
                        <div className="text-xs text-green-600 mt-1">
                          Leave empty to use automatic threshold: {Math.min(state.mainBreaker * 0.8, 50).toFixed(0)}A
                          (80% of {state.mainBreaker}A service, limited by 50A SimpleSwitch capacity)
                        </div>
                      </div>

                      {state.loadManagementMaxLoad > 50 && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          ⚠️ SimpleSwitch maximum capacity is 50A. Override value exceeds device limits.
                        </div>
                      )}
                    </div>
                  )}

                  {/* SimpleSwitch Technical Specifications */}
                  <div className="bg-gray-50 rounded p-2 mt-3">
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>
                        <strong>SimpleSwitch Specifications:</strong>
                      </div>
                      <div>• Maximum Capacity: 50A / 12kW per UL 916</div>
                      <div>• Connection: NEMA 14-50 receptacle</div>
                      <div>• Switching Time: &lt;100ms automatic transfer</div>
                      <div>• Certification: UL 916 Load Management Device</div>
                    </div>
                  </div>
                </div>
              )}

              {/* EMS/DCC Max Load Setting */}
              {(state.loadManagementType === 'ems' || state.loadManagementType === 'dcc') && (
                <div className="bg-white rounded-md p-3 border">
                  <div className="flex items-center gap-3 mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Maximum Load Setting:
                    </label>
                    <input
                      type="number"
                      value={
                        state.loadManagementType === 'ems'
                          ? state.emsMaxLoad || ''
                          : state.loadManagementMaxLoad || ''
                      }
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;

                        if (state.loadManagementType === 'ems') {
                          updateSettings({ emsMaxLoad: value });
                        } else {
                          updateSettings({ loadManagementMaxLoad: value });
                        }
                      }}
                      className="w-24 text-center border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      min="1"
                      max="400"
                      step="1"
                      placeholder="Amps"
                    />
                    <span className="text-sm text-gray-600">A</span>
                  </div>

                  {/* Information display */}
                  {totalEvseAmps > 0 && (
                    <div className="text-xs space-y-1">
                      <div className="text-gray-600">
                        Total EVSE Capacity: <span className="font-medium">{totalEvseAmps}A</span>
                      </div>

                      {(state.loadManagementType === 'ems' ? state.emsMaxLoad : state.loadManagementMaxLoad) > 0 && (
                        <div className="text-green-600">
                          Demand Reduction: <span className="font-medium">
                            {Math.max(
                              0,
                              totalEvseAmps -
                                (state.loadManagementType === 'ems'
                                  ? state.emsMaxLoad
                                  : state.loadManagementMaxLoad)
                            )}A
                          </span>
                          <span className="ml-1">(controlled simultaneous operation)</span>
                        </div>
                      )}

                      {/* Validation warnings */}
                      {(state.loadManagementType === 'ems' ? state.emsMaxLoad : state.loadManagementMaxLoad) >
                        totalEvseAmps && (
                        <div className="text-amber-600 bg-amber-50 p-2 rounded">
                          ⚠️ Max load setting exceeds total EVSE capacity
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Load Management Benefits */}
              {state.loadManagementType !== 'none' && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="text-xs text-green-700">
                    <div className="font-medium mb-1">NEC 625.42 Compliance:</div>
                    {state.loadManagementType === 'ems' && (
                      <div>• Energy Management System limits total simultaneous EVSE load</div>
                    )}
                    {state.loadManagementType === 'simpleswitch' && (
                      <div className="space-y-1">
                        {state.simpleSwitchMode === 'branch_sharing' ? (
                          <>
                            <div>• SimpleSwitch Branch Sharing: Automatic switching between two appliances</div>
                            <div>
                              • Maximum
                              {Math.max(
                                state.simpleSwitchLoadA?.amps || 0,
                                state.simpleSwitchLoadB?.amps || 0
                              )}A simultaneous operation (larger of the two loads)
                            </div>
                            <div>• UL 916 certified load management device with &lt;100ms switching</div>
                          </>
                        ) : (
                          <>
                            <div>• SimpleSwitch Feeder Monitoring: Whole-home load management</div>
                            <div>
                              • Pauses loads when panel reaches 80% capacity ({ (state.mainBreaker * 0.8).toFixed(0) }A)
                            </div>
                            <div>• Automatic resumption when capacity becomes available</div>
                          </>
                        )}
                      </div>
                    )}
                    {state.loadManagementType === 'dcc' && (
                      <div>
                        • Dynamic Current Control adjusts charging current to prevent electrical overload
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Warning for multiple EVSE without load management */}
        {activeEvseCount > 1 && state.loadManagementType === 'none' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Multiple EVSE Without Load Management</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Multiple EVSEs without load management require full capacity calculation at 125% per NEC 625.42.
                  Consider implementing EMS, SimpleSwitch, or DCC to reduce electrical demand and enable optimized
                  calculations.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);
