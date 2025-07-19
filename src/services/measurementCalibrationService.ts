import type { EditorPoint } from '../context/PhotoEditorContext';

export interface CalibrationData {
  pixelDistance: number;
  realWorldDistance: number;
  unit: 'ft' | 'm';
  scale: number; // pixels per unit
  referencePoints: [EditorPoint, EditorPoint];
}

export class MeasurementCalibrationService {
  
  /**
   * Calculate scale from reference measurement
   */
  static calculateScale(
    point1: EditorPoint, 
    point2: EditorPoint, 
    realWorldDistance: number, 
    unit: 'ft' | 'm'
  ): CalibrationData {
    const pixelDistance = Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );
    
    const scale = pixelDistance / realWorldDistance;
    
    return {
      pixelDistance,
      realWorldDistance,
      unit,
      scale,
      referencePoints: [point1, point2]
    };
  }

  /**
   * Common reference objects for calibration
   */
  static getCommonReferences(): Array<{
    name: string;
    size: { ft: number; m: number };
    description: string;
  }> {
    return [
      {
        name: 'Standard Car',
        size: { ft: 15, m: 4.57 },
        description: 'Average sedan length'
      },
      {
        name: 'Pickup Truck',
        size: { ft: 19, m: 5.79 },
        description: 'Full-size pickup truck'
      },
      {
        name: 'Semi Trailer',
        size: { ft: 53, m: 16.15 },
        description: 'Standard semi-trailer'
      },
      {
        name: 'Standard Parking Space',
        size: { ft: 18, m: 5.49 },
        description: 'Length of parking space'
      },
      {
        name: 'Basketball Court',
        size: { ft: 94, m: 28.65 },
        description: 'Full court length'
      },
      {
        name: 'Tennis Court',
        size: { ft: 78, m: 23.77 },
        description: 'Court length baseline to baseline'
      },
      {
        name: 'Swimming Pool (Standard)',
        size: { ft: 25, m: 7.62 },
        description: 'Typical residential pool length'
      },
      {
        name: 'House Width (Average)',
        size: { ft: 30, m: 9.14 },
        description: 'Typical single-story home width'
      },
      {
        name: 'Garage Door',
        size: { ft: 16, m: 4.88 },
        description: 'Standard two-car garage door width'
      },
      {
        name: 'Street Lane',
        size: { ft: 12, m: 3.66 },
        description: 'Standard traffic lane width'
      }
    ];
  }

  /**
   * Auto-detect possible reference objects from Google Maps zoom level
   */
  static estimateGoogleMapsScale(zoomLevel: number, latitude: number): number {
    // Google Maps scale approximation
    // At zoom level z, the resolution is approximately 156543.03392 * cos(latitude) / (2^z) meters per pixel
    const metersPerPixel = 156543.03392 * Math.cos(latitude * Math.PI / 180) / Math.pow(2, zoomLevel);
    
    // Convert to feet per pixel
    const feetPerPixel = metersPerPixel * 3.28084;
    
    // Return pixels per foot (inverse)
    return 1 / feetPerPixel;
  }

  /**
   * Validate calibration accuracy
   */
  static validateCalibration(calibration: CalibrationData): {
    isValid: boolean;
    confidence: 'high' | 'medium' | 'low';
    warnings: string[];
  } {
    const warnings: string[] = [];
    let confidence: 'high' | 'medium' | 'low' = 'high';

    // Check if pixel distance is reasonable
    if (calibration.pixelDistance < 10) {
      warnings.push('Reference measurement is very short - may affect accuracy');
      confidence = 'low';
    } else if (calibration.pixelDistance < 50) {
      warnings.push('Reference measurement is short - consider using a longer reference');
      confidence = 'medium';
    }

    // Check if real-world distance is reasonable
    if (calibration.realWorldDistance < 1) {
      warnings.push('Real-world distance is very small - may affect accuracy');
      confidence = 'low';
    }

    // Check scale reasonableness (should be in reasonable range for typical images)
    if (calibration.scale < 0.1 || calibration.scale > 1000) {
      warnings.push('Scale value seems unrealistic - please verify measurements');
      confidence = 'low';
    }

    return {
      isValid: warnings.length === 0 || confidence !== 'low',
      confidence,
      warnings
    };
  }

  /**
   * Apply scale to existing measurements
   */
  static convertMeasurementsToScale(
    measurements: Array<{ distance?: number; area?: number; unit: string }>,
    oldScale: number | undefined,
    newScale: number,
    newUnit: 'ft' | 'm'
  ): Array<{ distance?: number; area?: number; unit: string }> {
    return measurements.map(measurement => {
      const updated = { ...measurement };
      
      if (measurement.distance !== undefined) {
        if (oldScale) {
          // Convert back to pixels, then to new scale
          const pixels = measurement.distance * oldScale;
          updated.distance = pixels / newScale;
        } else {
          // Assume measurement was in pixels
          updated.distance = measurement.distance / newScale;
        }
      }

      if (measurement.area !== undefined) {
        if (oldScale) {
          // Convert back to square pixels, then to new scale
          const squarePixels = measurement.area * (oldScale * oldScale);
          updated.area = squarePixels / (newScale * newScale);
        } else {
          // Assume measurement was in square pixels
          updated.area = measurement.area / (newScale * newScale);
        }
      }

      updated.unit = newUnit;
      return updated;
    });
  }

  /**
   * Generate calibration report
   */
  static generateCalibrationReport(calibration: CalibrationData): string {
    const validation = this.validateCalibration(calibration);
    
    let report = `Measurement Calibration Report\n`;
    report += `==============================\n\n`;
    report += `Reference Measurement:\n`;
    report += `- Pixel Distance: ${calibration.pixelDistance.toFixed(2)} pixels\n`;
    report += `- Real World Distance: ${calibration.realWorldDistance} ${calibration.unit}\n`;
    report += `- Calculated Scale: ${calibration.scale.toFixed(4)} pixels/${calibration.unit}\n\n`;
    report += `Validation:\n`;
    report += `- Status: ${validation.isValid ? 'Valid' : 'Invalid'}\n`;
    report += `- Confidence: ${validation.confidence.toUpperCase()}\n`;
    
    if (validation.warnings.length > 0) {
      report += `\nWarnings:\n`;
      validation.warnings.forEach((warning, index) => {
        report += `${index + 1}. ${warning}\n`;
      });
    }

    report += `\nReference Points:\n`;
    report += `- Point 1: (${calibration.referencePoints[0].x.toFixed(1)}, ${calibration.referencePoints[0].y.toFixed(1)})\n`;
    report += `- Point 2: (${calibration.referencePoints[1].x.toFixed(1)}, ${calibration.referencePoints[1].y.toFixed(1)})\n`;

    return report;
  }

  /**
   * Save calibration data
   */
  static saveCalibration(calibration: CalibrationData, imageUrl: string): void {
    const key = `calibration_${this.hashImageUrl(imageUrl)}`;
    localStorage.setItem(key, JSON.stringify(calibration));
  }

  /**
   * Load calibration data
   */
  static loadCalibration(imageUrl: string): CalibrationData | null {
    const key = `calibration_${this.hashImageUrl(imageUrl)}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.warn('Failed to parse stored calibration data:', error);
      }
    }
    
    return null;
  }

  /**
   * Simple hash function for image URL
   */
  private static hashImageUrl(url: string): string {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}