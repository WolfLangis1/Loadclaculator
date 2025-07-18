/**
 * Professional aerial measurement service for site analysis
 * Provides accurate distance and area calculations for satellite imagery
 */

interface MeasurementPoint {
  x: number;
  y: number;
  latitude?: number;
  longitude?: number;
}

interface DistanceResult {
  distance: number;
  unit: 'feet' | 'meters';
  label: string;
}

interface PolylineResult {
  totalDistance: number;
  segmentDistances: number[];
  unit: 'feet' | 'meters';
  label: string;
}

interface AreaResult {
  area: number;
  unit: 'sqft' | 'sqm';
  label: string;
}

export class AerialMeasurementService {
  
  /**
   * Calculate meters per pixel based on zoom level and latitude
   * Uses improved Google Maps satellite imagery scaling
   */
  static calculateMetersPerPixel(zoom: number, latitude: number): number {
    // Earth's circumference at equator in meters
    const earthCircumference = 40075000;
    
    // Base meters per pixel calculation
    const baseMetersPerPixel = (earthCircumference * Math.cos(latitude * Math.PI / 180)) / Math.pow(2, zoom + 8);
    
    // Apply Google Maps satellite-specific correction factors
    // These factors account for satellite imagery vs map tile differences
    let correctionFactor = 0.85;
    
    // Adjust correction factor based on zoom level for better accuracy
    if (zoom >= 20) {
      correctionFactor = 0.82; // High zoom correction
    } else if (zoom >= 18) {
      correctionFactor = 0.84; // Medium zoom correction
    } else if (zoom <= 15) {
      correctionFactor = 0.87; // Low zoom correction
    }
    
    return baseMetersPerPixel * correctionFactor;
  }

  /**
   * Calculate linear distance between two points
   */
  static calculateLinearDistance(
    startPoint: MeasurementPoint,
    endPoint: MeasurementPoint,
    zoom: number,
    latitude: number,
    unit: 'feet' | 'meters' = 'meters'
  ): DistanceResult {
    // Calculate pixel distance
    const pixelDistance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) +
      Math.pow(endPoint.y - startPoint.y, 2)
    );
    
    // Convert to real-world distance
    const metersPerPixel = this.calculateMetersPerPixel(zoom, latitude);
    const distanceInMeters = pixelDistance * metersPerPixel;
    
    // Convert to requested unit
    const distance = unit === 'feet' ? distanceInMeters * 3.28084 : distanceInMeters;
    const unitSymbol = unit === 'feet' ? 'ft' : 'm';
    
    return {
      distance,
      unit,
      label: `${distance.toFixed(1)} ${unitSymbol}`
    };
  }

  /**
   * Calculate polyline distance with multiple points
   */
  static calculatePolylineDistance(
    points: MeasurementPoint[],
    zoom: number,
    latitude: number,
    unit: 'feet' | 'meters' = 'meters'
  ): PolylineResult {
    if (points.length < 2) {
      return {
        totalDistance: 0,
        segmentDistances: [],
        unit,
        label: '0 m'
      };
    }

    const metersPerPixel = this.calculateMetersPerPixel(zoom, latitude);
    const segmentDistances: number[] = [];
    let totalDistance = 0;

    // Calculate distance for each segment
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      
      const pixelDistance = Math.sqrt(
        Math.pow(end.x - start.x, 2) +
        Math.pow(end.y - start.y, 2)
      );
      
      const segmentMeters = pixelDistance * metersPerPixel;
      const segmentDistance = unit === 'feet' ? segmentMeters * 3.28084 : segmentMeters;
      
      segmentDistances.push(segmentDistance);
      totalDistance += segmentDistance;
    }

    const unitSymbol = unit === 'feet' ? 'ft' : 'm';
    
    return {
      totalDistance,
      segmentDistances,
      unit,
      label: `${totalDistance.toFixed(1)} ${unitSymbol} (${points.length - 1} segments)`
    };
  }

  /**
   * Calculate polygon area using the shoelace formula
   */
  static calculatePolygonArea(
    points: MeasurementPoint[],
    zoom: number,
    latitude: number,
    unit: 'sqft' | 'sqm' = 'sqm'
  ): AreaResult {
    if (points.length < 3) {
      return {
        area: 0,
        unit,
        label: '0 m²'
      };
    }

    // Calculate area in pixels using shoelace formula
    let pixelArea = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      pixelArea += points[i].x * points[j].y;
      pixelArea -= points[j].x * points[i].y;
    }
    pixelArea = Math.abs(pixelArea) / 2;

    // Convert to real-world area
    const metersPerPixel = this.calculateMetersPerPixel(zoom, latitude);
    const areaInSquareMeters = pixelArea * Math.pow(metersPerPixel, 2);
    
    // Convert to requested unit
    const area = unit === 'sqft' ? areaInSquareMeters * 10.7639 : areaInSquareMeters;
    const unitSymbol = unit === 'sqft' ? 'ft²' : 'm²';
    
    return {
      area,
      unit,
      label: `${area.toFixed(1)} ${unitSymbol}`
    };
  }

  /**
   * GPS-based distance calculation (for future enhancement)
   * Uses Haversine formula for great circle distance
   */
  static calculateGPSDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number,
    unit: 'feet' | 'meters' = 'meters'
  ): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distanceInMeters = R * c;
    return unit === 'feet' ? distanceInMeters * 3.28084 : distanceInMeters;
  }

  /**
   * Convert between units
   */
  static convertDistance(distance: number, fromUnit: 'feet' | 'meters', toUnit: 'feet' | 'meters'): number {
    if (fromUnit === toUnit) return distance;
    if (fromUnit === 'meters' && toUnit === 'feet') return distance * 3.28084;
    if (fromUnit === 'feet' && toUnit === 'meters') return distance / 3.28084;
    return distance;
  }

  /**
   * Convert area between units
   */
  static convertArea(area: number, fromUnit: 'sqft' | 'sqm', toUnit: 'sqft' | 'sqm'): number {
    if (fromUnit === toUnit) return area;
    if (fromUnit === 'sqm' && toUnit === 'sqft') return area * 10.7639;
    if (fromUnit === 'sqft' && toUnit === 'sqm') return area / 10.7639;
    return area;
  }

  /**
   * Validate measurement points
   */
  static validatePoints(points: MeasurementPoint[]): boolean {
    return points.every(point => 
      typeof point.x === 'number' && 
      typeof point.y === 'number' && 
      !isNaN(point.x) && 
      !isNaN(point.y)
    );
  }

  /**
   * Get measurement accuracy estimate based on zoom level
   */
  static getAccuracyEstimate(zoom: number): string {
    if (zoom >= 20) return "±0.5m";
    if (zoom >= 18) return "±1.0m";
    if (zoom >= 16) return "±2.0m";
    if (zoom >= 14) return "±5.0m";
    return "±10.0m";
  }
}