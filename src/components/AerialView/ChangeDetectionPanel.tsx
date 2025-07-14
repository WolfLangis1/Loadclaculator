/**
 * Change Detection Panel Component
 * 
 * Interactive UI for analyzing historical changes in satellite imagery.
 * Provides timeline visualization, change filtering, and detailed analysis
 * of detected modifications over time.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Filter,
  Layers,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Construction,
  TreePine,
  Building,
  Zap,
  Minimize2,
  Maximize2,
  X
} from 'lucide-react';

import ChangeDetectionService, {
  DetectedChange,
  TimeSeriesAnalysis,
  ChangeDetectionConfig
} from '../../services/changeDetectionService';
import MultiSourceImageryService from '../../services/multiSourceImageryService';

interface ChangeDetectionPanelProps {
  location: { latitude: number; longitude: number };
  onChangeSelected?: (change: DetectedChange) => void;
  className?: string;
}

interface TimelineEntry {
  date: Date;
  changes: DetectedChange[];
  imageUrl: string;
  provider: string;
  selected: boolean;
}

interface FilterOptions {
  changeTypes: string[];
  confidenceThreshold: number;
  dateRange: { start: Date; end: Date };
  minimumMagnitude: number;
  showOnlySignificant: boolean;
}

export const ChangeDetectionPanel: React.FC<ChangeDetectionPanelProps> = ({
  location,
  onChangeSelected,
  className = ''
}) => {
  // State management
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeSeriesAnalysis, setTimeSeriesAnalysis] = useState<TimeSeriesAnalysis | null>(null);
  const [selectedChanges, setSelectedChanges] = useState<DetectedChange[]>([]);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    changeTypes: [],
    confidenceThreshold: 0.7,
    dateRange: {
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
      end: new Date()
    },
    minimumMagnitude: 0.5,
    showOnlySignificant: true
  });

  // Configuration state
  const [config] = useState<Partial<ChangeDetectionConfig>>({
    algorithm: 'hybrid',
    confidenceThreshold: 0.7,
    minimumChangeArea: 100,
    preprocessing: {
      enableImageRegistration: true,
      normalizeColors: true,
      removeSeasonalEffects: true,
      compensateShadows: true,
      enhanceContrast: false
    },
    classification: {
      enableMLClassification: true,
      buildingDetectionEnabled: true,
      vegetationAnalysisEnabled: true,
      infrastructureDetectionEnabled: true,
      solarPanelDetectionEnabled: true
    }
  });

  // Initialize change detection service
  useEffect(() => {
    const initializeService = async () => {
      try {
        setLoading(true);
        await ChangeDetectionService.initialize();
        setIsInitialized(true);
        console.log('✅ Change Detection Panel initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Change Detection Panel:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeService();
  }, []);

  // Load historical imagery and analyze changes
  const loadHistoricalData = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setLoading(true);
      console.log('📅 Loading historical imagery for change detection...', location);

      // Get historical imagery timeline
      const historicalTimeline = await MultiSourceImageryService.getHistoricalImageryTimeline(
        location.latitude,
        location.longitude,
        filters.dateRange.start,
        filters.dateRange.end
      );

      // Store for reference (not currently used in UI but available for future features)
      console.log('📅 Historical timeline loaded:', historicalTimeline);

      // Analyze time series for changes
      const timeSeriesAnalysis = await ChangeDetectionService.analyzeTimeSeries(
        historicalTimeline,
        config
      );

      setTimeSeriesAnalysis(timeSeriesAnalysis);

      // Convert to timeline entries for UI
      const entries: TimelineEntry[] = timeSeriesAnalysis.changeTimeline.map((entry, index) => ({
        date: entry.date,
        changes: entry.changes,
        imageUrl: `mock_image_${entry.date.getTime()}`,
        provider: 'combined',
        selected: index === 0
      }));

      setTimelineEntries(entries);
      setCurrentEntryIndex(0);

      // Extract all unique changes for filtering
      const allChanges = timeSeriesAnalysis.changeTimeline.flatMap(entry => entry.changes);
      setSelectedChanges(allChanges);

      console.log('✅ Historical data loaded:', {
        timelineEntries: entries.length,
        totalChanges: allChanges.length,
        timeRange: [filters.dateRange.start.toISOString(), filters.dateRange.end.toISOString()]
      });

    } catch (error) {
      console.error('❌ Failed to load historical data:', error);
    } finally {
      setLoading(false);
    }
  }, [isInitialized, location, filters.dateRange, config]);

  // Load data when component mounts or location changes
  useEffect(() => {
    if (isInitialized && location.latitude && location.longitude) {
      loadHistoricalData();
    }
  }, [isInitialized, location, loadHistoricalData]);

  // Timeline playback
  useEffect(() => {
    if (!isPlaying || timelineEntries.length === 0) return;

    const interval = setInterval(() => {
      setCurrentEntryIndex(prev => {
        const next = prev + 1;
        if (next >= timelineEntries.length) {
          setIsPlaying(false);
          return prev;
        }
        return next;
      });
    }, 2000); // 2 seconds per frame

    return () => clearInterval(interval);
  }, [isPlaying, timelineEntries.length]);

  // Filter changes based on current filters
  const filteredChanges = selectedChanges.filter(change => {
    if (filters.changeTypes.length > 0 && !filters.changeTypes.includes(change.changeType)) {
      return false;
    }
    if (change.characteristics.confidence < filters.confidenceThreshold) {
      return false;
    }
    if (change.characteristics.magnitude < filters.minimumMagnitude) {
      return false;
    }
    if (filters.showOnlySignificant && change.characteristics.magnitude < 0.7) {
      return false;
    }
    return true;
  });

  const handleChangeClick = (change: DetectedChange) => {
    onChangeSelected?.(change);
  };

  const handleTimelineSelect = (index: number) => {
    setCurrentEntryIndex(index);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'construction':
      case 'building_modification':
        return <Construction className="h-4 w-4" />;
      case 'vegetation_growth':
      case 'vegetation_removal':
        return <TreePine className="h-4 w-4" />;
      case 'infrastructure_addition':
      case 'road_construction':
        return <Building className="h-4 w-4" />;
      case 'solar_installation':
        return <Zap className="h-4 w-4" />;
      default:
        return <Layers className="h-4 w-4" />;
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'construction':
      case 'building_modification':
        return 'text-blue-600 bg-blue-100';
      case 'vegetation_growth':
        return 'text-green-600 bg-green-100';
      case 'vegetation_removal':
        return 'text-orange-600 bg-orange-100';
      case 'infrastructure_addition':
        return 'text-purple-600 bg-purple-100';
      case 'solar_installation':
        return 'text-yellow-600 bg-yellow-100';
      case 'demolition':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const currentEntry = timelineEntries[currentEntryIndex];

  if (!isInitialized) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="h-5 w-5 animate-spin" />
          <span>Initializing change detection...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${expanded ? 'fixed inset-4 z-50' : ''} ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Change Detection</h3>
            {loading && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Toggle filters"
            >
              <Filter className="h-4 w-4" />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title={expanded ? "Minimize" : "Expand"}
            >
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            {expanded && (
              <button
                onClick={() => setExpanded(false)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        {timeSeriesAnalysis && (
          <div className="mt-3 grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-lg font-bold text-blue-600">
                {timeSeriesAnalysis.changeTimeline.reduce((sum, entry) => sum + entry.changes.length, 0)}
              </div>
              <div className="text-xs text-blue-700">Total Changes</div>
            </div>
            <div className="bg-green-50 rounded-lg p-2">
              <div className="text-lg font-bold text-green-600">
                {timeSeriesAnalysis.trends.changeVelocity.toFixed(1)}
              </div>
              <div className="text-xs text-green-700">Changes/Month</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-2">
              <div className="text-lg font-bold text-purple-600">
                {(timeSeriesAnalysis.evolution.siteSuitabilityTrend * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-purple-700">Site Trend</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confidence Threshold
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={filters.confidenceThreshold}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  confidenceThreshold: parseFloat(e.target.value)
                }))}
                className="w-full"
              />
              <div className="text-xs text-gray-600">{(filters.confidenceThreshold * 100).toFixed(0)}%</div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.showOnlySignificant}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    showOnlySignificant: e.target.checked
                  }))}
                />
                <span className="text-sm text-gray-700">Show only significant changes</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Controls */}
      {timelineEntries.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentEntryIndex(0)}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                disabled={currentEntryIndex === 0}
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                onClick={togglePlayback}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setCurrentEntryIndex(timelineEntries.length - 1)}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                disabled={currentEntryIndex === timelineEntries.length - 1}
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>
            <div className="text-sm text-gray-600">
              {currentEntry?.date.toLocaleDateString()}
            </div>
          </div>

          {/* Timeline Scrubber */}
          <div className="relative">
            <input
              type="range"
              min="0"
              max={timelineEntries.length - 1}
              value={currentEntryIndex}
              onChange={(e) => handleTimelineSelect(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{timelineEntries[0]?.date.getFullYear()}</span>
              <span>{timelineEntries[timelineEntries.length - 1]?.date.getFullYear()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Changes List */}
      <div className={`${expanded ? 'flex-1 overflow-hidden' : 'max-h-96'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">
              Detected Changes ({filteredChanges.length})
            </h4>
            {currentEntry && currentEntry.changes.length > 0 && (
              <div className="text-sm text-gray-600">
                {currentEntry.changes.length} changes in {currentEntry.date.toLocaleDateString()}
              </div>
            )}
          </div>

          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: expanded ? 'calc(100vh - 300px)' : '300px' }}>
            {filteredChanges.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <div>No changes detected</div>
                <div className="text-sm">Try adjusting your filters</div>
              </div>
            ) : (
              filteredChanges.map((change) => (
                <div
                  key={change.id}
                  onClick={() => handleChangeClick(change)}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getChangeTypeColor(change.changeType)}`}>
                        {getChangeTypeIcon(change.changeType)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {change.context.description}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {change.detectedBetween.beforeDate.toLocaleDateString()} → {' '}
                          {change.detectedBetween.afterDate.toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                            {Math.round(change.characteristics.confidence * 100)}% confidence
                          </span>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {change.region.area.toLocaleString()} m²
                          </span>
                          {change.classification.solarPotentialImpact !== 'neutral' && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              change.classification.solarPotentialImpact === 'positive' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              Solar {change.classification.solarPotentialImpact}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {Math.round(change.characteristics.magnitude * 100)}%
                      </div>
                      <div className="text-xs text-gray-600">magnitude</div>
                    </div>
                  </div>

                  {/* Additional details */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-sm text-gray-700">
                      <div><strong>Impact:</strong> {change.context.impactAssessment}</div>
                      {change.context.necRelevance && (
                        <div className="mt-1"><strong>NEC:</strong> {change.context.necRelevance}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Development Trend Summary */}
      {timeSeriesAnalysis && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {timeSeriesAnalysis.trends.developmentTrend === 'increasing' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : timeSeriesAnalysis.trends.developmentTrend === 'decreasing' ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : (
                <Minus className="h-4 w-4 text-gray-600" />
              )}
              <span className="text-sm font-medium text-gray-900">
                Development trend: {timeSeriesAnalysis.trends.developmentTrend}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {timeSeriesAnalysis.predictions.nextLikelyChange}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangeDetectionPanel;