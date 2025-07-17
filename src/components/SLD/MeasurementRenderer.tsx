import React from 'react';
import type { Measurement, Point } from '../../services/sldMeasurementService';

interface MeasurementRendererProps {
  measurements: Measurement[];
  transform: { x: number; y: number; zoom: number };
  onMeasurementClick?: (id: string) => void;
  className?: string;
}

/**
 * Renders measurements on the SVG canvas with professional CAD-style appearance
 */
export const MeasurementRenderer: React.FC<MeasurementRendererProps> = ({
  measurements,
  transform,
  onMeasurementClick,
  className = ''
}) => {
  const visibleMeasurements = measurements.filter(m => m.visible);

  return (
    <g className={className}>
      {visibleMeasurements.map(measurement => {
        const commonProps = { 
          key: measurement.id, 
          measurement, 
          transform, 
          onClick: onMeasurementClick ? () => onMeasurementClick(measurement.id) : undefined 
        };
        
        switch (measurement.type) {
          case 'linear':
            return <LinearMeasurementRenderer {...commonProps} />;
          case 'angular':
            return <AngularMeasurementRenderer {...commonProps} />;
          case 'area':
            return <AreaMeasurementRenderer {...commonProps} />;
          case 'coordinate':
            return <CoordinateMeasurementRenderer {...commonProps} />;
          default:
            return null;
        }
      })}
    </g>
  );
};

interface LinearMeasurementRendererProps {
  measurement: Extract<Measurement, { type: 'linear' }>;
  transform: { x: number; y: number; zoom: number };
  onClick?: () => void;
}

const LinearMeasurementRenderer: React.FC<LinearMeasurementRendererProps> = ({ measurement, transform }) => {
  const { startPoint, endPoint, displayDistance, style } = measurement;
  
  // Calculate measurement line properties
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  
  // Calculate extension lines
  const extensionOffset = style.extensionLength;
  const perpAngle = angle + Math.PI / 2;
  
  const extStart1 = {
    x: startPoint.x + Math.cos(perpAngle) * extensionOffset,
    y: startPoint.y + Math.sin(perpAngle) * extensionOffset
  };
  const extEnd1 = {
    x: startPoint.x - Math.cos(perpAngle) * extensionOffset,
    y: startPoint.y - Math.sin(perpAngle) * extensionOffset
  };
  
  const extStart2 = {
    x: endPoint.x + Math.cos(perpAngle) * extensionOffset,
    y: endPoint.y + Math.sin(perpAngle) * extensionOffset
  };
  const extEnd2 = {
    x: endPoint.x - Math.cos(perpAngle) * extensionOffset,
    y: endPoint.y - Math.sin(perpAngle) * extensionOffset
  };
  
  // Calculate text position
  const midPoint = {
    x: (startPoint.x + endPoint.x) / 2,
    y: (startPoint.y + endPoint.y) / 2
  };
  
  const textOffset = style.textOffset / transform.zoom;
  const textPoint = {
    x: midPoint.x + Math.cos(perpAngle) * textOffset,
    y: midPoint.y + Math.sin(perpAngle) * textOffset
  };
  
  // Arrow properties
  const arrowSize = style.arrowSize / transform.zoom;
  const arrowAngle1 = angle + Math.PI - 0.3;
  const arrowAngle2 = angle + Math.PI + 0.3;
  
  const arrow1Start = {
    x: startPoint.x + Math.cos(arrowAngle1) * arrowSize,
    y: startPoint.y + Math.sin(arrowAngle1) * arrowSize
  };
  const arrow1End = {
    x: startPoint.x + Math.cos(arrowAngle2) * arrowSize,
    y: startPoint.y + Math.sin(arrowAngle2) * arrowSize
  };
  
  const arrow2Start = {
    x: endPoint.x + Math.cos(arrowAngle1 + Math.PI) * arrowSize,
    y: endPoint.y + Math.sin(arrowAngle1 + Math.PI) * arrowSize
  };
  const arrow2End = {
    x: endPoint.x + Math.cos(arrowAngle2 + Math.PI) * arrowSize,
    y: endPoint.y + Math.sin(arrowAngle2 + Math.PI) * arrowSize
  };

  return (
    <g>
      {/* Extension lines */}
      <line
        x1={extStart1.x}
        y1={extStart1.y}
        x2={extEnd1.x}
        y2={extEnd1.y}
        stroke={style.color}
        strokeWidth={style.lineWidth / transform.zoom}
        strokeDasharray="2,2"
        opacity={0.7}
      />
      <line
        x1={extStart2.x}
        y1={extStart2.y}
        x2={extEnd2.x}
        y2={extEnd2.y}
        stroke={style.color}
        strokeWidth={style.lineWidth / transform.zoom}
        strokeDasharray="2,2"
        opacity={0.7}
      />
      
      {/* Main dimension line */}
      <line
        x1={startPoint.x}
        y1={startPoint.y}
        x2={endPoint.x}
        y2={endPoint.y}
        stroke={style.color}
        strokeWidth={style.lineWidth / transform.zoom}
        markerStart="url(#measurementArrow)"
        markerEnd="url(#measurementArrow)"
      />
      
      {/* Arrows */}
      {style.arrowStyle === 'arrow' && (
        <>
          <polygon
            points={`${startPoint.x},${startPoint.y} ${arrow1Start.x},${arrow1Start.y} ${arrow1End.x},${arrow1End.y}`}
            fill={style.color}
          />
          <polygon
            points={`${endPoint.x},${endPoint.y} ${arrow2Start.x},${arrow2Start.y} ${arrow2End.x},${arrow2End.y}`}
            fill={style.color}
          />
        </>
      )}
      
      {/* Measurement text */}
      {(style.showValue || style.showLabel) && (
        <g transform={`translate(${textPoint.x}, ${textPoint.y})`}>
          <rect
            x={-20}
            y={-8}
            width={40}
            height={16}
            fill="white"
            fillOpacity={0.9}
            stroke={style.color}
            strokeWidth={0.5 / transform.zoom}
            rx={2}
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={style.textSize / transform.zoom}
            fill={style.textColor}
            fontFamily="Arial, sans-serif"
          >
            {style.showValue && displayDistance}
          </text>
        </g>
      )}
    </g>
  );
};

interface AngularMeasurementRendererProps {
  measurement: Extract<Measurement, { type: 'angular' }>;
  transform: { x: number; y: number; zoom: number };
}

const AngularMeasurementRenderer: React.FC<AngularMeasurementRendererProps> = ({ measurement, transform }) => {
  const { centerPoint, startPoint, endPoint, displayAngle, style } = measurement;
  
  // Calculate angles
  const startAngle = Math.atan2(startPoint.y - centerPoint.y, startPoint.x - centerPoint.x);
  const endAngle = Math.atan2(endPoint.y - centerPoint.y, endPoint.x - centerPoint.x);
  
  // Calculate radius for arc
  const radius = Math.min(
    Math.sqrt(Math.pow(startPoint.x - centerPoint.x, 2) + Math.pow(startPoint.y - centerPoint.y, 2)),
    Math.sqrt(Math.pow(endPoint.x - centerPoint.x, 2) + Math.pow(endPoint.y - centerPoint.y, 2))
  ) * 0.3;
  
  // Calculate arc path
  const arcStartX = centerPoint.x + Math.cos(startAngle) * radius;
  const arcStartY = centerPoint.y + Math.sin(startAngle) * radius;
  const arcEndX = centerPoint.x + Math.cos(endAngle) * radius;
  const arcEndY = centerPoint.y + Math.sin(endAngle) * radius;
  
  let angleDiff = endAngle - startAngle;
  if (angleDiff < 0) angleDiff += 2 * Math.PI;
  
  const largeArcFlag = angleDiff > Math.PI ? 1 : 0;
  const arcPath = `M ${arcStartX} ${arcStartY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${arcEndX} ${arcEndY}`;
  
  // Calculate text position
  const midAngle = startAngle + angleDiff / 2;
  const textRadius = radius + style.textOffset / transform.zoom;
  const textPoint = {
    x: centerPoint.x + Math.cos(midAngle) * textRadius,
    y: centerPoint.y + Math.sin(midAngle) * textRadius
  };

  return (
    <g>
      {/* Construction lines */}
      <line
        x1={centerPoint.x}
        y1={centerPoint.y}
        x2={startPoint.x}
        y2={startPoint.y}
        stroke={style.color}
        strokeWidth={style.lineWidth / transform.zoom}
        strokeDasharray="3,2"
        opacity={0.5}
      />
      <line
        x1={centerPoint.x}
        y1={centerPoint.y}
        x2={endPoint.x}
        y2={endPoint.y}
        stroke={style.color}
        strokeWidth={style.lineWidth / transform.zoom}
        strokeDasharray="3,2"
        opacity={0.5}
      />
      
      {/* Angle arc */}
      <path
        d={arcPath}
        fill="none"
        stroke={style.color}
        strokeWidth={style.lineWidth / transform.zoom}
      />
      
      {/* Center point */}
      <circle
        cx={centerPoint.x}
        cy={centerPoint.y}
        r={2 / transform.zoom}
        fill={style.color}
      />
      
      {/* Angle text */}
      {(style.showValue || style.showLabel) && (
        <g transform={`translate(${textPoint.x}, ${textPoint.y})`}>
          <rect
            x={-15}
            y={-8}
            width={30}
            height={16}
            fill="white"
            fillOpacity={0.9}
            stroke={style.color}
            strokeWidth={0.5 / transform.zoom}
            rx={2}
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={style.textSize / transform.zoom}
            fill={style.textColor}
            fontFamily="Arial, sans-serif"
          >
            {style.showValue && displayAngle}
          </text>
        </g>
      )}
    </g>
  );
};

interface AreaMeasurementRendererProps {
  measurement: Extract<Measurement, { type: 'area' }>;
  transform: { x: number; y: number; zoom: number };
}

const AreaMeasurementRenderer: React.FC<AreaMeasurementRendererProps> = ({ measurement, transform }) => {
  const { points, displayArea, displayPerimeter, style } = measurement;
  
  if (points.length < 3) return null;
  
  // Create polygon path
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z';
  
  // Calculate centroid for text placement
  const centroid = points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 }
  );
  centroid.x /= points.length;
  centroid.y /= points.length;

  return (
    <g>
      {/* Area fill */}
      <path
        d={pathData}
        fill={style.color}
        fillOpacity={0.1}
        stroke={style.color}
        strokeWidth={style.lineWidth / transform.zoom}
        strokeDasharray="5,3"
      />
      
      {/* Perimeter dimensions */}
      {points.map((point, index) => {
        const nextIndex = (index + 1) % points.length;
        const nextPoint = points[nextIndex];
        
        const midPoint = {
          x: (point.x + nextPoint.x) / 2,
          y: (point.y + nextPoint.y) / 2
        };
        
        const distance = Math.sqrt(
          Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2)
        );
        
        const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x);
        const perpAngle = angle + Math.PI / 2;
        
        const textOffset = style.textOffset / transform.zoom;
        const textPoint = {
          x: midPoint.x + Math.cos(perpAngle) * textOffset,
          y: midPoint.y + Math.sin(perpAngle) * textOffset
        };
        
        return (
          <text
            key={index}
            x={textPoint.x}
            y={textPoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={(style.textSize - 2) / transform.zoom}
            fill={style.textColor}
            fontFamily="Arial, sans-serif"
            opacity={0.8}
          >
            {(distance / 12).toFixed(1)}'
          </text>
        );
      })}
      
      {/* Area text */}
      {(style.showValue || style.showLabel) && (
        <g transform={`translate(${centroid.x}, ${centroid.y})`}>
          <rect
            x={-30}
            y={-12}
            width={60}
            height={24}
            fill="white"
            fillOpacity={0.95}
            stroke={style.color}
            strokeWidth={style.lineWidth / transform.zoom}
            rx={3}
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={style.textSize / transform.zoom}
            fill={style.textColor}
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
          >
            <tspan x="0" dy="-4">Area: {displayArea}</tspan>
            <tspan x="0" dy="12">Perimeter: {displayPerimeter}</tspan>
          </text>
        </g>
      )}
    </g>
  );
};

interface CoordinateMeasurementRendererProps {
  measurement: Extract<Measurement, { type: 'coordinate' }>;
  transform: { x: number; y: number; zoom: number };
}

const CoordinateMeasurementRenderer: React.FC<CoordinateMeasurementRendererProps> = ({ measurement, transform }) => {
  const { point, displayX, displayY, style } = measurement;
  
  const crossSize = 8 / transform.zoom;
  const textOffset = style.textOffset / transform.zoom;

  return (
    <g>
      {/* Coordinate cross */}
      <line
        x1={point.x - crossSize}
        y1={point.y}
        x2={point.x + crossSize}
        y2={point.y}
        stroke={style.color}
        strokeWidth={style.lineWidth / transform.zoom}
      />
      <line
        x1={point.x}
        y1={point.y - crossSize}
        x2={point.x}
        y2={point.y + crossSize}
        stroke={style.color}
        strokeWidth={style.lineWidth / transform.zoom}
      />
      
      {/* Center dot */}
      <circle
        cx={point.x}
        cy={point.y}
        r={2 / transform.zoom}
        fill={style.color}
      />
      
      {/* Coordinate text */}
      {(style.showValue || style.showLabel) && (
        <g transform={`translate(${point.x + textOffset}, ${point.y - textOffset})`}>
          <rect
            x={-25}
            y={-12}
            width={50}
            height={24}
            fill="white"
            fillOpacity={0.95}
            stroke={style.color}
            strokeWidth={0.5 / transform.zoom}
            rx={2}
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={style.textSize / transform.zoom}
            fill={style.textColor}
            fontFamily="Arial, sans-serif"
          >
            <tspan x="0" dy="-4">X: {displayX}</tspan>
            <tspan x="0" dy="12">Y: {displayY}</tspan>
          </text>
        </g>
      )}
    </g>
  );
};

export default MeasurementRenderer;