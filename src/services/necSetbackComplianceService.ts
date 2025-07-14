/**
 * NEC 690.12 Setback Compliance Service
 * 
 * Comprehensive National Electrical Code (NEC) Article 690.12 compliance analysis
 * for solar photovoltaic systems. Provides automated setback detection, violation
 * identification, and compliance recommendations for electrical permit submissions.
 */

import { RoofPlane, RoofFeature, OptimizedPanelLayout } from './aiRoofAnalysisService';

export interface NECCodeRequirement {
  code: string; // e.g., "NEC 690.12(B)(2)"
  title: string;
  description: string;
  measurement: number; // required distance in feet
  applicability: 'all' | 'residential' | 'commercial' | 'ground_mount' | 'roof_mount';
  exceptions: string[];
  enforcementLevel: 'mandatory' | 'recommended' | 'conditional';
  necVersion: '2017' | '2020' | '2023';
}

export interface SetbackZone {
  id: string;
  type: 'fire_setback' | 'pathway' | 'smoke_vent' | 'hip_ridge' | 'valley' | 'equipment_access';
  necReference: string;
  requiredWidth: number; // feet
  actualWidth?: number; // feet (calculated)
  boundary: Array<{ x: number; y: number }>; // polygon defining the zone
  roofPlaneId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  enforceable: boolean;
}

export interface SetbackViolation {
  id: string;
  violationType: 'setback' | 'pathway' | 'access' | 'clearance' | 'spacing';
  necCode: string;
  severity: 'critical' | 'major' | 'minor' | 'warning';
  description: string;
  location: { x: number; y: number };
  affectedPanels: string[];
  requiredDistance: number; // feet
  actualDistance: number; // feet
  shortfall: number; // feet (required - actual)
  recommendation: string;
  remediation: {
    action: 'relocate_panel' | 'reduce_array_size' | 'install_rsd' | 'modify_layout' | 'seek_variance';
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedCost?: number;
    timeImpact?: number; // days
  };
}

export interface RapidShutdownCompliance {
  required: boolean;
  compliant: boolean;
  deviceType: 'module_level' | 'string_level' | 'combiner_level' | 'none';
  coverage: number; // percentage of array requiring RSD
  violations: Array<{
    location: { x: number; y: number };
    description: string;
    necReference: string;
  }>;
  recommendations: string[];
}

export interface BuildingCharacteristics {
  type: 'residential' | 'commercial' | 'industrial' | 'agricultural';
  stories: number;
  roofType: 'pitched' | 'flat' | 'mansard' | 'hip' | 'gable' | 'shed';
  roofMaterial: 'asphalt_shingle' | 'metal' | 'tile' | 'membrane' | 'concrete' | 'other';
  constructionYear?: number;
  fireRating?: string;
  jurisdictionCode: 'ifc' | 'ibc' | 'local';
  ahjRequirements?: Record<string, any>;
}

export interface ComplianceAnalysisResult {
  analysisId: string;
  timestamp: Date;
  necVersion: '2017' | '2020' | '2023';
  jurisdiction: string;
  
  // Overall Compliance
  overallCompliant: boolean;
  complianceScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Setback Analysis
  setbackZones: SetbackZone[];
  violations: SetbackViolation[];
  
  // Rapid Shutdown Analysis
  rapidShutdown: RapidShutdownCompliance;
  
  // Code Requirements Applied
  applicableRequirements: NECCodeRequirement[];
  
  // Recommendations
  summary: {
    criticalIssues: number;
    majorIssues: number;
    minorIssues: number;
    totalViolations: number;
    estimatedFixCost: number;
    permitReady: boolean;
  };
  
  // Action Items
  actionItems: Array<{
    priority: 'immediate' | 'high' | 'medium' | 'low';
    description: string;
    necReference: string;
    estimatedEffort: string;
  }>;
  
  // Report Generation
  reportData: {
    complianceStatement: string;
    engineeringSeal: boolean;
    permitSubmissionReady: boolean;
    reviewComments: string[];
  };
}

export class NECSetbackComplianceService {
  
  // NEC 690.12 Requirements Database
  private static readonly NEC_REQUIREMENTS: NECCodeRequirement[] = [
    {
      code: 'NEC 690.12(B)(2)',
      title: 'Roof-Mounted PV System Setbacks',
      description: '3-foot pathway around arrays on sloped roofs',
      measurement: 3.0,
      applicability: 'roof_mount',
      exceptions: ['Rapid shutdown devices per 690.12(B)(2)(1)'],
      enforcementLevel: 'mandatory',
      necVersion: '2023'
    },
    {
      code: 'NEC 690.12(B)(2)(a)',
      title: 'Hip Roof Setbacks',
      description: '1.5-foot setback from hip ridges',
      measurement: 1.5,
      applicability: 'roof_mount',
      exceptions: [],
      enforcementLevel: 'mandatory',
      necVersion: '2023'
    },
    {
      code: 'NEC 690.12(B)(2)(b)',
      title: 'Flat Roof Pathways',
      description: '3-foot pathway on flat roofs',
      measurement: 3.0,
      applicability: 'roof_mount',
      exceptions: ['Single-family residential buildings'],
      enforcementLevel: 'mandatory',
      necVersion: '2023'
    },
    {
      code: 'NEC 690.12(B)(2)(c)',
      title: 'Smoke Ventilation',
      description: '3-foot clearance for smoke ventilation',
      measurement: 3.0,
      applicability: 'all',
      exceptions: [],
      enforcementLevel: 'mandatory',
      necVersion: '2023'
    },
    {
      code: 'NEC 690.12(B)(1)',
      title: 'Rapid Shutdown Requirements',
      description: 'Rapid shutdown device requirements',
      measurement: 0,
      applicability: 'all',
      exceptions: [],
      enforcementLevel: 'mandatory',
      necVersion: '2023'
    }
  ];

  /**
   * Perform comprehensive NEC 690.12 compliance analysis
   */
  static async analyzeNECCompliance(
    roofPlanes: RoofPlane[],
    roofFeatures: RoofFeature[],
    layout: OptimizedPanelLayout,
    buildingCharacteristics: BuildingCharacteristics,
    necVersion: '2017' | '2020' | '2023' = '2023',
    jurisdiction: string = 'National'
  ): Promise<ComplianceAnalysisResult> {
    console.log('📋 Starting comprehensive NEC 690.12 compliance analysis...');
    
    const startTime = performance.now();
    
    // Determine applicable requirements
    const applicableRequirements = this.getApplicableRequirements(
      buildingCharacteristics,
      necVersion
    );
    
    // Generate setback zones
    const setbackZones = await this.generateSetbackZones(
      roofPlanes,
      roofFeatures,
      buildingCharacteristics,
      applicableRequirements
    );
    
    // Analyze violations
    const violations = await this.analyzeViolations(
      layout,
      setbackZones,
      applicableRequirements
    );
    
    // Analyze rapid shutdown compliance
    const rapidShutdown = await this.analyzeRapidShutdownCompliance(
      layout,
      setbackZones,
      buildingCharacteristics
    );
    
    // Calculate compliance metrics
    const complianceMetrics = this.calculateComplianceMetrics(violations, rapidShutdown);
    
    // Generate recommendations and action items
    const actionItems = this.generateActionItems(violations, rapidShutdown);
    
    // Generate compliance report data
    const reportData = this.generateReportData(violations, complianceMetrics);
    
    const processingTime = performance.now() - startTime;
    
    const result: ComplianceAnalysisResult = {
      analysisId: `nec_compliance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      necVersion,
      jurisdiction,
      overallCompliant: violations.filter(v => v.severity === 'critical' || v.severity === 'major').length === 0,
      complianceScore: complianceMetrics.score,
      riskLevel: complianceMetrics.riskLevel,
      setbackZones,
      violations,
      rapidShutdown,
      applicableRequirements,
      summary: {
        criticalIssues: violations.filter(v => v.severity === 'critical').length,
        majorIssues: violations.filter(v => v.severity === 'major').length,
        minorIssues: violations.filter(v => v.severity === 'minor').length,
        totalViolations: violations.length,
        estimatedFixCost: violations.reduce((sum, v) => sum + (v.remediation.estimatedCost || 0), 0),
        permitReady: complianceMetrics.permitReady
      },
      actionItems,
      reportData
    };
    
    console.log('✅ NEC compliance analysis completed:', {
      overallCompliant: result.overallCompliant,
      violations: result.violations.length,
      complianceScore: result.complianceScore,
      processingTime: Math.round(processingTime)
    });
    
    return result;
  }
  
  /**
   * Determine which NEC requirements apply to this installation
   */
  private static getApplicableRequirements(
    building: BuildingCharacteristics,
    necVersion: '2017' | '2020' | '2023'
  ): NECCodeRequirement[] {
    return this.NEC_REQUIREMENTS.filter(req => {
      // Filter by NEC version
      if (req.necVersion !== necVersion) return false;
      
      // Filter by applicability
      if (req.applicability === 'all') return true;
      if (req.applicability === 'roof_mount') return true; // Assuming roof mount for this analysis
      if (req.applicability === building.type) return true;
      
      return false;
    });
  }
  
  /**
   * Generate setback zones based on roof geometry and NEC requirements
   */
  private static async generateSetbackZones(
    roofPlanes: RoofPlane[],
    roofFeatures: RoofFeature[],
    building: BuildingCharacteristics,
    requirements: NECCodeRequirement[]
  ): Promise<SetbackZone[]> {
    const zones: SetbackZone[] = [];
    
    for (const plane of roofPlanes) {
      // Generate fire setback zones (3-foot perimeter)
      const fireSetbackReq = requirements.find(r => r.code === 'NEC 690.12(B)(2)');
      if (fireSetbackReq) {
        const fireSetbackZone = this.generatePerimeterSetback(
          plane,
          fireSetbackReq.measurement,
          'fire_setback',
          fireSetbackReq.code
        );
        zones.push(fireSetbackZone);
      }
      
      // Generate hip/ridge setback zones
      const hipSetbackReq = requirements.find(r => r.code === 'NEC 690.12(B)(2)(a)');
      if (hipSetbackReq && building.roofType === 'hip') {
        const hipZones = this.generateHipRidgeSetbacks(
          plane,
          roofFeatures,
          hipSetbackReq.measurement,
          hipSetbackReq.code
        );
        zones.push(...hipZones);
      }
      
      // Generate pathway zones
      const pathwayReq = requirements.find(r => r.code === 'NEC 690.12(B)(2)(b)');
      if (pathwayReq) {
        const pathwayZones = this.generatePathwayZones(
          plane,
          roofFeatures,
          pathwayReq.measurement,
          pathwayReq.code
        );
        zones.push(...pathwayZones);
      }
      
      // Generate equipment access zones
      const equipmentZones = this.generateEquipmentAccessZones(plane, roofFeatures);
      zones.push(...equipmentZones);
    }
    
    return zones;
  }
  
  /**
   * Generate perimeter setback zone
   */
  private static generatePerimeterSetback(
    plane: RoofPlane,
    setbackDistance: number,
    type: SetbackZone['type'],
    necReference: string
  ): SetbackZone {
    // Convert feet to pixels (approximate conversion)
    const pixelsPerFoot = 40; // Rough approximation for visualization
    const setbackPixels = setbackDistance * pixelsPerFoot;
    
    // Create inset polygon
    const insetBoundary = this.createInsetPolygon(plane.vertices, setbackPixels);
    
    return {
      id: `${type}_${plane.id}`,
      type,
      necReference,
      requiredWidth: setbackDistance,
      boundary: insetBoundary,
      roofPlaneId: plane.id,
      priority: 'critical',
      enforceable: true
    };
  }
  
  /**
   * Generate hip and ridge setback zones
   */
  private static generateHipRidgeSetbacks(
    plane: RoofPlane,
    features: RoofFeature[],
    setbackDistance: number,
    necReference: string
  ): SetbackZone[] {
    const zones: SetbackZone[] = [];
    
    // Find ridge and hip features
    const ridgeFeatures = features.filter(f => f.type === 'ridge' || f.type === 'edge');
    
    ridgeFeatures.forEach((feature, index) => {
      const pixelsPerFoot = 40;
      const setbackPixels = setbackDistance * pixelsPerFoot;
      
      // Create setback zone along the ridge/hip
      const zoneBoundary = this.createLinearSetback(
        feature.position,
        feature.size,
        setbackPixels
      );
      
      zones.push({
        id: `hip_ridge_${plane.id}_${index}`,
        type: 'hip_ridge',
        necReference,
        requiredWidth: setbackDistance,
        boundary: zoneBoundary,
        roofPlaneId: plane.id,
        priority: 'high',
        enforceable: true
      });
    });
    
    return zones;
  }
  
  /**
   * Generate pathway zones for access
   */
  private static generatePathwayZones(
    plane: RoofPlane,
    features: RoofFeature[],
    pathwayWidth: number,
    necReference: string
  ): SetbackZone[] {
    const zones: SetbackZone[] = [];
    
    // Generate access pathways to equipment
    const equipmentFeatures = features.filter(f => 
      f.type === 'hvac_unit' || f.type === 'antenna' || f.type === 'vent'
    );
    
    equipmentFeatures.forEach((equipment, index) => {
      const pixelsPerFoot = 40;
      const pathwayPixels = pathwayWidth * pixelsPerFoot;
      
      // Create pathway from roof edge to equipment
      const pathwayBoundary = this.createAccessPathway(
        plane.vertices,
        equipment.position,
        pathwayPixels
      );
      
      zones.push({
        id: `pathway_${plane.id}_${index}`,
        type: 'pathway',
        necReference,
        requiredWidth: pathwayWidth,
        boundary: pathwayBoundary,
        roofPlaneId: plane.id,
        priority: 'medium',
        enforceable: true
      });
    });
    
    return zones;
  }
  
  /**
   * Generate equipment access zones
   */
  private static generateEquipmentAccessZones(
    plane: RoofPlane,
    features: RoofFeature[]
  ): SetbackZone[] {
    const zones: SetbackZone[] = [];
    
    // Create access zones around equipment
    const equipmentFeatures = features.filter(f => 
      f.type === 'hvac_unit' || f.type === 'antenna'
    );
    
    equipmentFeatures.forEach((equipment, index) => {
      const accessDistance = 3.0; // 3-foot access clearance
      const pixelsPerFoot = 40;
      const accessPixels = accessDistance * pixelsPerFoot;
      
      // Create circular access zone around equipment
      const accessBoundary = this.createCircularZone(
        equipment.position,
        accessPixels
      );
      
      zones.push({
        id: `equipment_access_${plane.id}_${index}`,
        type: 'equipment_access',
        necReference: 'NEC 110.26',
        requiredWidth: accessDistance,
        boundary: accessBoundary,
        roofPlaneId: plane.id,
        priority: 'medium',
        enforceable: false // Recommended but not always required
      });
    });
    
    return zones;
  }
  
  /**
   * Analyze violations against setback zones
   */
  private static async analyzeViolations(
    layout: OptimizedPanelLayout,
    setbackZones: SetbackZone[],
    requirements: NECCodeRequirement[]
  ): Promise<SetbackViolation[]> {
    const violations: SetbackViolation[] = [];
    
    for (const panel of layout.panels) {
      for (const zone of setbackZones) {
        const violation = this.checkPanelAgainstZone(panel, zone, requirements);
        if (violation) {
          violations.push(violation);
        }
      }
    }
    
    return violations;
  }
  
  /**
   * Check if a panel violates a setback zone
   */
  private static checkPanelAgainstZone(
    panel: OptimizedPanelLayout['panels'][0],
    zone: SetbackZone,
    requirements: NECCodeRequirement[]
  ): SetbackViolation | null {
    // Check if panel overlaps with setback zone
    const panelBounds = {
      x: panel.position.x - panel.size.width / 2,
      y: panel.position.y - panel.size.height / 2,
      width: panel.size.width,
      height: panel.size.height
    };
    
    const overlaps = this.checkPolygonRectangleOverlap(zone.boundary, panelBounds);
    
    if (overlaps) {
      const distance = this.calculateMinimumDistance(panel.position, zone.boundary);
      const pixelsPerFoot = 40;
      const actualDistance = distance / pixelsPerFoot;
      const shortfall = zone.requiredWidth - actualDistance;
      
      const requirement = requirements.find(r => r.code === zone.necReference);
      const severity = this.determineSeverity(zone.type, shortfall, zone.priority);
      
      return {
        id: `violation_${panel.id}_${zone.id}`,
        violationType: 'setback',
        necCode: zone.necReference,
        severity,
        description: `Panel ${panel.id} violates ${zone.type.replace('_', ' ')} requirement`,
        location: panel.position,
        affectedPanels: [panel.id],
        requiredDistance: zone.requiredWidth,
        actualDistance,
        shortfall,
        recommendation: this.generateRecommendation(zone.type, shortfall),
        remediation: this.generateRemediation(zone.type, shortfall, actualDistance)
      };
    }
    
    return null;
  }
  
  /**
   * Analyze rapid shutdown compliance
   */
  private static async analyzeRapidShutdownCompliance(
    layout: OptimizedPanelLayout,
    setbackZones: SetbackZone[],
    building: BuildingCharacteristics
  ): Promise<RapidShutdownCompliance> {
    // Determine if rapid shutdown is required
    const required = building.type !== 'residential' || building.stories > 1;
    
    // Calculate areas that need rapid shutdown devices
    let panelsRequiringRSD = 0;
    const violations: RapidShutdownCompliance['violations'] = [];
    
    for (const panel of layout.panels) {
      // Check if panel is within setback zones (would require RSD)
      const inSetbackZone = setbackZones.some(zone => 
        zone.type === 'fire_setback' && 
        this.isPointInPolygon(panel.position, zone.boundary)
      );
      
      if (inSetbackZone) {
        panelsRequiringRSD++;
        
        if (required) {
          violations.push({
            location: panel.position,
            description: `Panel ${panel.id} requires rapid shutdown device`,
            necReference: 'NEC 690.12(B)(1)'
          });
        }
      }
    }
    
    const coverage = (panelsRequiringRSD / layout.panels.length) * 100;
    const compliant = !required || violations.length === 0;
    
    return {
      required,
      compliant,
      deviceType: coverage > 50 ? 'module_level' : 'string_level',
      coverage,
      violations,
      recommendations: this.generateRSDRecommendations(coverage, required, building)
    };
  }
  
  /**
   * Calculate compliance metrics
   */
  private static calculateComplianceMetrics(
    violations: SetbackViolation[],
    rapidShutdown: RapidShutdownCompliance
  ): { score: number; riskLevel: 'low' | 'medium' | 'high' | 'critical'; permitReady: boolean } {
    const criticalViolations = violations.filter(v => v.severity === 'critical').length;
    const majorViolations = violations.filter(v => v.severity === 'major').length;
    const minorViolations = violations.filter(v => v.severity === 'minor').length;
    const warningViolations = violations.filter(v => v.severity === 'warning').length;
    
    // Calculate base score
    let score = 100;
    score -= criticalViolations * 25;
    score -= majorViolations * 15;
    score -= minorViolations * 5;
    score -= warningViolations * 2;
    
    // Factor in rapid shutdown compliance
    if (rapidShutdown.required && !rapidShutdown.compliant) {
      score -= 20;
    }
    
    score = Math.max(0, score);
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (criticalViolations > 0) riskLevel = 'critical';
    else if (majorViolations > 2) riskLevel = 'high';
    else if (majorViolations > 0 || minorViolations > 3) riskLevel = 'medium';
    
    // Determine permit readiness
    const permitReady = criticalViolations === 0 && majorViolations === 0;
    
    return { score, riskLevel, permitReady };
  }
  
  /**
   * Generate action items for remediation
   */
  private static generateActionItems(
    violations: SetbackViolation[],
    rapidShutdown: RapidShutdownCompliance
  ): ComplianceAnalysisResult['actionItems'] {
    const actionItems: ComplianceAnalysisResult['actionItems'] = [];
    
    // Critical violations first
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    criticalViolations.forEach(violation => {
      actionItems.push({
        priority: 'immediate',
        description: `Address ${violation.necCode} violation: ${violation.description}`,
        necReference: violation.necCode,
        estimatedEffort: this.estimateEffort(violation.remediation.complexity)
      });
    });
    
    // Major violations
    const majorViolations = violations.filter(v => v.severity === 'major');
    majorViolations.forEach(violation => {
      actionItems.push({
        priority: 'high',
        description: `Resolve ${violation.necCode} violation: ${violation.description}`,
        necReference: violation.necCode,
        estimatedEffort: this.estimateEffort(violation.remediation.complexity)
      });
    });
    
    // Rapid shutdown compliance
    if (rapidShutdown.required && !rapidShutdown.compliant) {
      actionItems.push({
        priority: 'high',
        description: 'Install rapid shutdown devices per NEC 690.12(B)(1)',
        necReference: 'NEC 690.12(B)(1)',
        estimatedEffort: 'Moderate - requires certified devices and installation'
      });
    }
    
    return actionItems;
  }
  
  /**
   * Generate compliance report data
   */
  private static generateReportData(
    violations: SetbackViolation[],
    metrics: { score: number; permitReady: boolean }
  ): ComplianceAnalysisResult['reportData'] {
    const criticalCount = violations.filter(v => v.severity === 'critical').length;
    const majorCount = violations.filter(v => v.severity === 'major').length;
    
    let complianceStatement: string;
    if (metrics.permitReady) {
      complianceStatement = 'This solar PV system design meets NEC 690.12 requirements and is ready for permit submission.';
    } else if (criticalCount > 0) {
      complianceStatement = `This design has ${criticalCount} critical NEC violations that must be resolved before permit submission.`;
    } else {
      complianceStatement = `This design has ${majorCount} major issues that should be addressed for optimal compliance.`;
    }
    
    const reviewComments: string[] = [];
    if (violations.length > 0) {
      reviewComments.push(`Total violations found: ${violations.length}`);
      reviewComments.push('Review setback requirements and panel placement');
    }
    if (metrics.score < 80) {
      reviewComments.push('Consider design modifications to improve compliance score');
    }
    
    return {
      complianceStatement,
      engineeringSeal: metrics.permitReady && metrics.score >= 95,
      permitSubmissionReady: metrics.permitReady,
      reviewComments
    };
  }
  
  // Utility functions
  private static createInsetPolygon(
    vertices: Array<{ x: number; y: number }>,
    insetDistance: number
  ): Array<{ x: number; y: number }> {
    // Simplified inset algorithm - in production would use proper polygon offsetting
    const centroid = this.calculateCentroid(vertices);
    
    return vertices.map(vertex => {
      const dx = vertex.x - centroid.x;
      const dy = vertex.y - centroid.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const normalizedDx = dx / length;
      const normalizedDy = dy / length;
      
      return {
        x: vertex.x - normalizedDx * insetDistance,
        y: vertex.y - normalizedDy * insetDistance
      };
    });
  }
  
  private static calculateCentroid(vertices: Array<{ x: number; y: number }>): { x: number; y: number } {
    const x = vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length;
    const y = vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length;
    return { x, y };
  }
  
  private static createLinearSetback(
    position: { x: number; y: number },
    size: { width: number; height: number },
    setbackDistance: number
  ): Array<{ x: number; y: number }> {
    // Create rectangular setback zone around linear feature
    return [
      { x: position.x - size.width/2 - setbackDistance, y: position.y - size.height/2 - setbackDistance },
      { x: position.x + size.width/2 + setbackDistance, y: position.y - size.height/2 - setbackDistance },
      { x: position.x + size.width/2 + setbackDistance, y: position.y + size.height/2 + setbackDistance },
      { x: position.x - size.width/2 - setbackDistance, y: position.y + size.height/2 + setbackDistance }
    ];
  }
  
  private static createAccessPathway(
    roofVertices: Array<{ x: number; y: number }>,
    equipmentPosition: { x: number; y: number },
    pathwayWidth: number
  ): Array<{ x: number; y: number }> {
    // Find nearest roof edge
    const nearestEdge = this.findNearestEdge(roofVertices, equipmentPosition);
    
    // Create pathway from edge to equipment
    const pathway: Array<{ x: number; y: number }> = [];
    const halfWidth = pathwayWidth / 2;
    
    // Simplified pathway generation
    pathway.push(
      { x: nearestEdge.x - halfWidth, y: nearestEdge.y - halfWidth },
      { x: nearestEdge.x + halfWidth, y: nearestEdge.y - halfWidth },
      { x: equipmentPosition.x + halfWidth, y: equipmentPosition.y - halfWidth },
      { x: equipmentPosition.x + halfWidth, y: equipmentPosition.y + halfWidth },
      { x: equipmentPosition.x - halfWidth, y: equipmentPosition.y + halfWidth },
      { x: nearestEdge.x - halfWidth, y: nearestEdge.y + halfWidth }
    );
    
    return pathway;
  }
  
  private static createCircularZone(
    center: { x: number; y: number },
    radius: number
  ): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];
    const segments = 16;
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      points.push({
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle)
      });
    }
    
    return points;
  }
  
  private static findNearestEdge(
    vertices: Array<{ x: number; y: number }>,
    point: { x: number; y: number }
  ): { x: number; y: number } {
    // Find nearest vertex as approximation
    let nearest = vertices[0];
    let minDistance = Infinity;
    
    vertices.forEach(vertex => {
      const distance = Math.sqrt(
        Math.pow(vertex.x - point.x, 2) + Math.pow(vertex.y - point.y, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = vertex;
      }
    });
    
    return nearest;
  }
  
  private static checkPolygonRectangleOverlap(
    polygon: Array<{ x: number; y: number }>,
    rectangle: { x: number; y: number; width: number; height: number }
  ): boolean {
    // Check if any corner of rectangle is inside polygon
    const corners = [
      { x: rectangle.x, y: rectangle.y },
      { x: rectangle.x + rectangle.width, y: rectangle.y },
      { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height },
      { x: rectangle.x, y: rectangle.y + rectangle.height }
    ];
    
    return corners.some(corner => this.isPointInPolygon(corner, polygon));
  }
  
  private static isPointInPolygon(
    point: { x: number; y: number },
    polygon: Array<{ x: number; y: number }>
  ): boolean {
    let inside = false;
    const n = polygon.length;
    
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      
      if (((yi > point.y) !== (yj > point.y)) && 
          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }
  
  private static calculateMinimumDistance(
    point: { x: number; y: number },
    polygon: Array<{ x: number; y: number }>
  ): number {
    let minDistance = Infinity;
    
    polygon.forEach(vertex => {
      const distance = Math.sqrt(
        Math.pow(vertex.x - point.x, 2) + Math.pow(vertex.y - point.y, 2)
      );
      minDistance = Math.min(minDistance, distance);
    });
    
    return minDistance;
  }
  
  private static determineSeverity(
    zoneType: SetbackZone['type'],
    shortfall: number,
    priority: SetbackZone['priority']
  ): SetbackViolation['severity'] {
    if (zoneType === 'fire_setback' && shortfall > 1) return 'critical';
    if (priority === 'critical' && shortfall > 0.5) return 'critical';
    if (shortfall > 1) return 'major';
    if (shortfall > 0.5) return 'minor';
    return 'warning';
  }
  
  private static generateRecommendation(
    zoneType: SetbackZone['type'],
    shortfall: number
  ): string {
    switch (zoneType) {
      case 'fire_setback':
        return `Move panel ${shortfall.toFixed(1)} feet away from roof edge or install rapid shutdown device`;
      case 'pathway':
        return `Maintain ${shortfall.toFixed(1)} feet additional clearance for access pathway`;
      case 'hip_ridge':
        return `Increase setback from hip/ridge by ${shortfall.toFixed(1)} feet`;
      case 'equipment_access':
        return `Provide additional ${shortfall.toFixed(1)} feet clearance for equipment access`;
      default:
        return `Increase clearance by ${shortfall.toFixed(1)} feet to meet NEC requirements`;
    }
  }
  
  private static generateRemediation(
    zoneType: SetbackZone['type'],
    shortfall: number,
    actualDistance: number
  ): SetbackViolation['remediation'] {
    if (shortfall > 2) {
      return {
        action: 'relocate_panel',
        complexity: 'complex',
        estimatedCost: 500,
        timeImpact: 2
      };
    } else if (shortfall > 1) {
      return {
        action: 'modify_layout',
        complexity: 'moderate',
        estimatedCost: 200,
        timeImpact: 1
      };
    } else if (zoneType === 'fire_setback') {
      return {
        action: 'install_rsd',
        complexity: 'simple',
        estimatedCost: 150,
        timeImpact: 0.5
      };
    } else {
      return {
        action: 'reduce_array_size',
        complexity: 'simple',
        estimatedCost: 100,
        timeImpact: 0.5
      };
    }
  }
  
  private static generateRSDRecommendations(
    coverage: number,
    required: boolean,
    building: BuildingCharacteristics
  ): string[] {
    const recommendations: string[] = [];
    
    if (required) {
      if (coverage > 50) {
        recommendations.push('Consider module-level rapid shutdown devices for optimal compliance');
      } else {
        recommendations.push('String-level rapid shutdown devices may be sufficient');
      }
      recommendations.push('Ensure all rapid shutdown devices are UL 991 listed');
      recommendations.push('Label all rapid shutdown devices per NEC 690.12(B)(1)');
    } else {
      recommendations.push('Rapid shutdown not required for this installation type');
      if (coverage > 25) {
        recommendations.push('Consider voluntary RSD installation for enhanced safety');
      }
    }
    
    return recommendations;
  }
  
  private static estimateEffort(complexity: 'simple' | 'moderate' | 'complex'): string {
    switch (complexity) {
      case 'simple': return 'Simple - can be resolved during installation';
      case 'moderate': return 'Moderate - requires design modification';
      case 'complex': return 'Complex - may require engineering redesign';
      default: return 'Unknown effort level';
    }
  }
}

export default NECSetbackComplianceService;