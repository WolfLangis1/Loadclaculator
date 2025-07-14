# Advanced Measurement Tools with GPS Coordinates

## Overview

The Advanced Measurement Tools provide professional-grade measurement capabilities for aerial imagery analysis with high-precision GPS coordinate calculations, geodetic transformations, and comprehensive measurement features for electrical site surveys and solar installations.

## Key Features

### 🎯 Precision Measurement Types
- **Distance Measurements**: Linear measurements with bearing calculations
- **Area Measurements**: Polygon areas with perimeter calculations  
- **Setback Measurements**: NEC compliance checking for electrical setbacks
- **Point Marking**: GPS coordinate reference points
- **Elevation Profiles**: Height analysis along measurement paths

### 📍 GPS Coordinate Integration
- **High-Precision Coordinates**: Up to 6 decimal places (±1.1m accuracy)
- **Multiple Coordinate Systems**: WGS84, NAD83, NAD27 support
- **Automatic Projections**: UTM, State Plane, and geographic projections
- **Real-time Conversion**: Pixel ↔ GPS coordinate transformation
- **Geodetic Calculations**: Haversine formula for accurate distances

### 🔧 Professional Tools
- **Snap-to-Grid**: Precise point placement assistance
- **Real-time Display**: Live distance/area calculations while measuring
- **Multiple Units**: Metric (meters) and Imperial (feet) support
- **Bearing Calculations**: True bearing from north (0-360°)
- **Magnetic Declination**: Correction for local magnetic variation

### ⚡ Solar & Electrical Integration
- **NEC Compliance**: Automatic setback validation per NEC 690.12
- **Solar Calculations**: Panel count and capacity estimates
- **Usable Area**: After setback area calculations
- **Roof Analysis**: Azimuth, tilt, and shading factor assessment
- **Safety Factors**: Built-in electrical safety margins

### 📊 Export & Documentation
- **Multiple Formats**: JSON, CSV, KML, GeoJSON export
- **Professional Reports**: Detailed measurement documentation
- **Project Management**: Organized measurement collections
- **Attachment Integration**: Save measurements to project files
- **GPS Metadata**: Complete coordinate and accuracy information

## Usage Guide

### Getting Started

1. **Select Measurement Mode**: Choose "Measure" tab in Aerial View
2. **Capture Site Image**: Get satellite imagery with GPS coordinates
3. **Choose Tool**: Distance, Area, Setback, or Point measurement
4. **Start Measuring**: Click points on the image to measure

### Distance Measurements

```typescript
// Click two points to measure distance
const measurement = {
  type: 'distance',
  results: {
    distanceMeters: 45.67,
    distanceFeet: 149.84,
    bearing: 127.3,
    elevationChange: 2.1
  },
  precision: {
    horizontalAccuracy: 3.0,
    confidenceLevel: 0.95
  }
}
```

### Area Measurements

```typescript
// Click multiple points to define area boundary
const measurement = {
  type: 'installation_area',
  results: {
    areaSquareMeters: 234.56,
    areaSquareFeet: 2524.89,
    perimeterMeters: 67.89,
    centroid: { latitude: 37.7749, longitude: -122.4194 }
  },
  solar: {
    maxPanelCount: 12,
    estimatedCapacity: 4.8, // kW
    usableArea: 210.11 // after setbacks
  }
}
```

### Setback Measurements

```typescript
// Automatic NEC compliance checking
const setbackMeasurement = {
  type: 'setback',
  results: {
    distanceMeters: 0.91, // 3 feet
    distanceFeet: 3.0
  },
  compliance: {
    necSetbackCompliance: true,
    minimumClearanceDistance: 0.91,
    applicableCodes: ['NEC 690.12']
  }
}
```

## Technical Specifications

### Coordinate Accuracy
- **Horizontal**: ±1-5 meters (depending on imagery source)
- **Coordinate Precision**: 6 decimal places (±1.1m at equator)
- **Distance Accuracy**: ±0.1% for distances >10m
- **Area Accuracy**: ±2% for areas >100m²

### Supported Coordinate Systems
- **WGS84**: World Geodetic System 1984 (GPS standard)
- **NAD83**: North American Datum 1983
- **NAD27**: North American Datum 1927
- **UTM Zones**: Universal Transverse Mercator projections
- **State Plane**: US State Plane Coordinate Systems

### Distance Calculation Methods
- **Haversine Formula**: Spherical earth calculations
- **Vincenty's Formula**: Ellipsoidal earth (high precision)
- **Great Circle**: Shortest path calculations
- **Rhumb Line**: Constant bearing calculations

### Area Calculation Methods
- **Shoelace Formula**: Polygon area from coordinates
- **Spherical Excess**: Large area corrections
- **Projection Compensation**: Distortion corrections

## NEC Compliance Features

### Automatic Setback Checking
- **NEC 690.12**: Solar PV system setbacks
- **Residential**: 3-foot minimum setbacks
- **Commercial**: Variable based on fire access
- **Compliance Validation**: Real-time violation detection
- **Safety Margins**: Configurable safety factors

### Code References
- **NEC 2023**: Latest electrical code version
- **AHJ Variations**: Local jurisdiction modifications
- **Fire Access**: Emergency responder requirements
- **Building Codes**: Integration with local building codes

## Integration Examples

### Basic Distance Measurement
```typescript
import AdvancedMeasurementService from './services/advancedMeasurementService';

// Initialize service
await AdvancedMeasurementService.initialize();

// Create measurement points
const points = [
  {
    id: 'start',
    coordinates: { latitude: 37.7749, longitude: -122.4194 },
    pixelPosition: { x: 100, y: 100 },
    type: 'waypoint'
  },
  {
    id: 'end', 
    coordinates: { latitude: 37.7759, longitude: -122.4184 },
    pixelPosition: { x: 200, y: 200 },
    type: 'waypoint'
  }
];

// Create measurement
const measurement = AdvancedMeasurementService.createLinearMeasurement(
  points,
  'distance'
);

console.log(`Distance: ${measurement.results.distanceMeters}m`);
console.log(`Bearing: ${measurement.results.bearing}°`);
```

### Export Measurements
```typescript
// Export project in multiple formats
const projectId = 'my-project-id';

// JSON export (full data)
const jsonData = await AdvancedMeasurementService.exportProject(projectId, 'json');

// KML export (Google Earth compatible)
const kmlData = await AdvancedMeasurementService.exportProject(projectId, 'kml');

// CSV export (spreadsheet compatible)  
const csvData = await AdvancedMeasurementService.exportProject(projectId, 'csv');

// GeoJSON export (GIS compatible)
const geoJsonData = await AdvancedMeasurementService.exportProject(projectId, 'geojson');
```

## Best Practices

### Measurement Accuracy
1. **Use High-Resolution Imagery**: Better pixel-to-GPS accuracy
2. **Multiple Reference Points**: Cross-check measurements
3. **Appropriate Scale**: Match zoom level to measurement size
4. **Coordinate Validation**: Verify GPS coordinates when possible

### NEC Compliance
1. **Know Local Codes**: Check AHJ modifications
2. **Safety Margins**: Add extra clearance for safety
3. **Document Everything**: Keep measurement records
4. **Professional Review**: Have licensed electrician verify

### Project Organization
1. **Descriptive Names**: Clear measurement labels
2. **Metadata Recording**: Include date, surveyor, equipment
3. **Version Control**: Track measurement revisions
4. **Export Backups**: Regular data exports

## Troubleshooting

### Common Issues
- **Coordinate Drift**: Check imagery metadata accuracy
- **Scale Problems**: Verify zoom level and image resolution
- **Projection Errors**: Ensure correct coordinate system
- **Export Failures**: Check file permissions and formats

### Support
- Use browser console for debugging information
- Check measurement service capabilities
- Verify GPS coordinate accuracy
- Test with known reference measurements

## Future Enhancements

### Planned Features
- **3D Measurements**: Height and volume calculations
- **CAD Integration**: DXF/DWG import/export
- **Survey Integration**: Total station data import
- **Mobile GPS**: Direct GPS device integration
- **Machine Learning**: Automated feature detection