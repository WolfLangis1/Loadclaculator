import React from 'react';

export interface AnnotationPoint {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  type: 'line' | 'circle' | 'square' | 'polyline';
  points: AnnotationPoint[];
  style: AnnotationStyle;
  label?: string;
  completed: boolean;
}

export interface AnnotationStyle {
  stroke: string;
  strokeWidth: number;
  fill?: string;
  opacity: number;
  dashArray?: string;
}

interface AnnotationOverlayProps {
  annotations: Annotation[];
  currentAnnotation: Annotation | null;
  measurementPoints: AnnotationPoint[];
  imageWidth: number;
  imageHeight: number;
  onAnnotationClick?: (annotation: Annotation) => void;
}

export const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  annotations,
  currentAnnotation,
  measurementPoints,
  imageWidth,
  imageHeight,
  onAnnotationClick
}) => {
  const renderLine = (annotation: Annotation) => {
    if (annotation.points.length < 2) return null;
    
    const start = annotation.points[0];
    const end = annotation.points[1];
    
    return (
      <line
        key={annotation.id}
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={annotation.style.stroke}
        strokeWidth={annotation.style.strokeWidth}
        opacity={annotation.style.opacity}
        strokeDasharray={annotation.style.dashArray}
        className="cursor-pointer hover:stroke-blue-500"
        onClick={() => onAnnotationClick?.(annotation)}
      />
    );
  };

  const renderCircle = (annotation: Annotation) => {
    if (annotation.points.length < 2) return null;
    
    const center = annotation.points[0];
    const edge = annotation.points[1];
    const radius = Math.sqrt(
      Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
    );
    
    return (
      <circle
        key={annotation.id}
        cx={center.x}
        cy={center.y}
        r={radius}
        stroke={annotation.style.stroke}
        strokeWidth={annotation.style.strokeWidth}
        fill={annotation.style.fill || 'none'}
        opacity={annotation.style.opacity}
        strokeDasharray={annotation.style.dashArray}
        className="cursor-pointer hover:stroke-blue-500"
        onClick={() => onAnnotationClick?.(annotation)}
      />
    );
  };

  const renderSquare = (annotation: Annotation) => {
    if (annotation.points.length < 2) return null;
    
    const start = annotation.points[0];
    const end = annotation.points[1];
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    
    return (
      <rect
        key={annotation.id}
        x={x}
        y={y}
        width={width}
        height={height}
        stroke={annotation.style.stroke}
        strokeWidth={annotation.style.strokeWidth}
        fill={annotation.style.fill || 'none'}
        opacity={annotation.style.opacity}
        strokeDasharray={annotation.style.dashArray}
        className="cursor-pointer hover:stroke-blue-500"
        onClick={() => onAnnotationClick?.(annotation)}
      />
    );
  };

  const renderPolyline = (annotation: Annotation) => {
    if (annotation.points.length < 2) return null;
    
    const points = annotation.points
      .map(point => `${point.x},${point.y}`)
      .join(' ');
    
    return (
      <polyline
        key={annotation.id}
        points={points}
        stroke={annotation.style.stroke}
        strokeWidth={annotation.style.strokeWidth}
        fill="none"
        opacity={annotation.style.opacity}
        strokeDasharray={annotation.style.dashArray}
        className="cursor-pointer hover:stroke-blue-500"
        onClick={() => onAnnotationClick?.(annotation)}
      />
    );
  };

  const renderAnnotation = (annotation: Annotation) => {
    switch (annotation.type) {
      case 'line':
        return renderLine(annotation);
      case 'circle':
        return renderCircle(annotation);
      case 'square':
        return renderSquare(annotation);
      case 'polyline':
        return renderPolyline(annotation);
      default:
        return null;
    }
  };

  const renderCurrentPoints = () => {
    return measurementPoints.map((point, index) => (
      <circle
        key={`current-${index}`}
        cx={point.x}
        cy={point.y}
        r={4}
        fill="red"
        stroke="white"
        strokeWidth={2}
        opacity={0.8}
      />
    ));
  };

  const renderCurrentPreview = () => {
    if (!currentAnnotation || measurementPoints.length === 0) return null;

    const style = {
      stroke: 'red',
      strokeWidth: 2,
      opacity: 0.6,
      dashArray: '5,5'
    };

    const previewAnnotation = {
      ...currentAnnotation,
      points: measurementPoints,
      style
    };

    return renderAnnotation(previewAnnotation);
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        width={imageWidth}
        height={imageHeight}
        className="absolute inset-0"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Render completed annotations */}
        {annotations.map(renderAnnotation)}
        
        {/* Render current drawing preview */}
        {renderCurrentPreview()}
        
        {/* Render measurement points */}
        {renderCurrentPoints()}
      </svg>
    </div>
  );
};