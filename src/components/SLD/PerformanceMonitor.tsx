/**
 * SLD Performance Monitor Component
 * 
 * Real-time performance metrics display for development and optimization
 */

import React, { useState, useEffect } from 'react';
import { Monitor, Cpu, HardDrive, Zap, Eye, Settings } from 'lucide-react';
import { SLDPerformanceService } from '../../services/sldPerformanceService';
import { WebGLShaderService } from '../../services/webglShaderService';

interface PerformanceMonitorProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  detailed?: boolean;
}

interface PerformanceSnapshot {
  timestamp: number;
  frameRate: number;
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  visibleComponents: number;
  chunksTotal: number;
  chunksVisible: number;
  gpuMemory?: number;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  className = '',
  position = 'top-right',
  detailed = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceSnapshot>({
    timestamp: Date.now(),
    frameRate: 60,
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0,
    visibleComponents: 0,
    chunksTotal: 0,
    chunksVisible: 0
  });
  const [history, setHistory] = useState<PerformanceSnapshot[]>([]);
  const [updateInterval, setUpdateInterval] = useState(1000); // ms

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  /**
   * Update performance metrics
   */
  const updateMetrics = () => {
    try {
      const performanceMetrics = SLDPerformanceService.getPerformanceMetrics();
      const gpuMemory = WebGLShaderService.getMemoryUsage();
      
      const snapshot: PerformanceSnapshot = {
        timestamp: Date.now(),
        frameRate: performanceMetrics.frameRate,
        renderTime: performanceMetrics.averageRenderTime,
        memoryUsage: performanceMetrics.memoryUsage,
        componentCount: performanceMetrics.componentCount,
        visibleComponents: performanceMetrics.visibleComponents,
        chunksTotal: performanceMetrics.chunksTotal,
        chunksVisible: performanceMetrics.chunksVisible,
        gpuMemory: gpuMemory.total
      };

      setMetrics(snapshot);
      
      // Keep history for trends (last 60 entries)
      setHistory(prev => {
        const newHistory = [...prev, snapshot];
        return newHistory.slice(-60);
      });
    } catch (error) {
      console.error('Failed to update performance metrics:', error);
    }
  };

  /**
   * Get performance status color
   */
  const getStatusColor = (value: number, type: 'fps' | 'memory' | 'render') => {
    switch (type) {
      case 'fps':
        if (value >= 50) return 'text-green-500';
        if (value >= 30) return 'text-yellow-500';
        return 'text-red-500';
      case 'memory':
        if (value < 100) return 'text-green-500';
        if (value < 200) return 'text-yellow-500';
        return 'text-red-500';
      case 'render':
        if (value < 16) return 'text-green-500';
        if (value < 33) return 'text-yellow-500';
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  /**
   * Format memory value
   */
  const formatMemory = (mb: number) => {
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  /**
   * Calculate trend direction
   */
  const getTrend = (values: number[]): 'up' | 'down' | 'stable' => {
    if (values.length < 3) return 'stable';
    
    const recent = values.slice(-3);
    const increasing = recent[2] > recent[1] && recent[1] > recent[0];
    const decreasing = recent[2] < recent[1] && recent[1] < recent[0];
    
    if (increasing) return 'up';
    if (decreasing) return 'down';
    return 'stable';
  };

  /**
   * Render trend indicator
   */
  const TrendIndicator: React.FC<{ trend: 'up' | 'down' | 'stable' }> = ({ trend }) => {
    const colors = {
      up: 'text-red-500',
      down: 'text-green-500',
      stable: 'text-gray-400'
    };
    
    const symbols = {
      up: '↗',
      down: '↘',
      stable: '→'
    };

    return (
      <span className={`text-xs ${colors[trend]}`}>
        {symbols[trend]}
      </span>
    );
  };

  /**
   * Render mini performance chart
   */
  const MiniChart: React.FC<{ values: number[]; height?: number }> = ({ values, height = 20 }) => {
    if (values.length < 2) return <div className="w-16 h-5 bg-gray-100"></div>;

    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * 64; // 64px width
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="64" height={height} className="inline-block">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-blue-500"
        />
      </svg>
    );
  };

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(updateMetrics, updateInterval);
    updateMetrics(); // Initial update
    
    return () => clearInterval(interval);
  }, [updateInterval]);

  if (!isExpanded && !detailed) {
    // Compact view
    return (
      <div 
        className={`fixed ${positionClasses[position]} z-50 ${className}`}
        onClick={() => setIsExpanded(true)}
      >
        <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-sm font-mono cursor-pointer hover:bg-black/90 transition-colors">
          <div className="flex items-center gap-2">
            <Monitor size={14} />
            <span className={getStatusColor(metrics.frameRate, 'fps')}>
              {metrics.frameRate} fps
            </span>
            <span className={getStatusColor(metrics.renderTime, 'render')}>
              {metrics.renderTime.toFixed(1)}ms
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Monitor size={16} className="text-blue-600" />
            <h3 className="font-semibold text-sm">Performance Monitor</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              Minimize
            </button>
            <Settings size={14} className="text-gray-400" />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 p-3 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Zap size={12} className="text-green-600" />
                <span className="text-xs text-gray-600">FPS</span>
              </div>
              <TrendIndicator trend={getTrend(history.map(h => h.frameRate))} />
            </div>
            <div className={`text-lg font-bold ${getStatusColor(metrics.frameRate, 'fps')}`}>
              {metrics.frameRate}
            </div>
            <MiniChart values={history.map(h => h.frameRate)} />
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Cpu size={12} className="text-blue-600" />
                <span className="text-xs text-gray-600">Render</span>
              </div>
              <TrendIndicator trend={getTrend(history.map(h => h.renderTime))} />
            </div>
            <div className={`text-lg font-bold ${getStatusColor(metrics.renderTime, 'render')}`}>
              {metrics.renderTime.toFixed(1)}ms
            </div>
            <MiniChart values={history.map(h => h.renderTime)} />
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive size={12} className="text-purple-600" />
              <span className="text-gray-600">Memory</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={getStatusColor(metrics.memoryUsage, 'memory')}>
                {formatMemory(metrics.memoryUsage)}
              </span>
              {metrics.gpuMemory && (
                <span className="text-gray-500">
                  + {formatMemory(metrics.gpuMemory)} GPU
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={12} className="text-yellow-600" />
              <span className="text-gray-600">Visible</span>
            </div>
            <span className="font-mono">
              {metrics.visibleComponents} / {metrics.componentCount}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
              <span className="text-gray-600">Chunks</span>
            </div>
            <span className="font-mono">
              {metrics.chunksVisible} / {metrics.chunksTotal}
            </span>
          </div>
        </div>

        {/* Performance History Chart */}
        {detailed && history.length > 1 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600 mb-2">FPS History (60s)</div>
            <div className="h-16 bg-gray-50 rounded p-2">
              <svg width="100%" height="100%" viewBox="0 0 240 48" className="w-full h-full">
                <polyline
                  points={history.map((h, i) => {
                    const x = (i / Math.max(1, history.length - 1)) * 240;
                    const y = 48 - (h.frameRate / 60) * 48;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
                <line x1="0" y1="24" x2="240" y2="24" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
                <text x="2" y="28" fontSize="8" fill="#ef4444">30fps</text>
              </svg>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Update:</span>
              <select 
                value={updateInterval}
                onChange={(e) => setUpdateInterval(Number(e.target.value))}
                className="text-xs border border-gray-300 rounded px-1 py-0.5"
              >
                <option value={500}>0.5s</option>
                <option value={1000}>1s</option>
                <option value={2000}>2s</option>
                <option value={5000}>5s</option>
              </select>
            </div>
            <button
              onClick={() => setHistory([])}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;