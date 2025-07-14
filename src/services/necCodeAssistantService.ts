/**
 * NEC Code Assistant Service
 * 
 * Intelligent real-time compliance assistant providing NEC code suggestions,
 * violation detection, educational guidance, and automated compliance checking
 * throughout the electrical design process. Includes multi-version support
 * and jurisdiction-specific requirements.
 */

import { LoadState, Load } from '../context/LoadCalculatorContext';
import { NECCalculationResult } from './necCalculations';
import { SLDComponent, SLDConnection } from './intelligentSLDService';

export interface NECCodeRule {
  id: string;
  section: string; // e.g., "210.8(A)(1)"
  title: string;
  description: string;
  
  // Rule categorization
  category: 'safety' | 'installation' | 'calculation' | 'protection' | 'grounding' | 'wiring';
  severity: 'mandatory' | 'recommended' | 'informational';
  applicability: 'residential' | 'commercial' | 'industrial' | 'all';
  
  // Version support
  versions: Array<{
    year: '2017' | '2020' | '2023' | '2026';
    text: string;
    changes?: string;
  }>;
  
  // Rule logic
  conditions: Array<{
    type: 'voltage' | 'amperage' | 'power' | 'location' | 'application' | 'equipment';
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'in';
    value: any;
    unit?: string;
  }>;
  
  // Compliance requirements
  requirements: Array<{
    description: string;
    formula?: string;
    parameters?: string[];
    exceptions?: string[];
  }>;
  
  // Related sections
  relatedSections: string[];
  references: string[];
}

export interface ComplianceViolation {
  id: string;
  ruleId: string;
  section: string;
  severity: 'critical' | 'major' | 'minor' | 'warning';
  
  // Violation details
  title: string;
  description: string;
  currentValue: any;
  requiredValue: any;
  
  // Location context
  component?: string;
  load?: string;
  circuit?: string;
  location?: { x: number; y: number };
  
  // Resolution guidance
  resolution: {
    steps: string[];
    alternatives: string[];
    estimatedEffort: 'low' | 'medium' | 'high';
    cost?: 'none' | 'low' | 'medium' | 'high';
  };
  
  // Educational content
  explanation: string;
  whyItMatters: string;
  commonMistakes: string[];
  examples?: string[];
}

export interface ComplianceSuggestion {
  id: string;
  type: 'improvement' | 'optimization' | 'best_practice' | 'education';
  priority: 'high' | 'medium' | 'low';
  
  title: string;
  description: string;
  benefit: string;
  
  // Implementation details
  implementation: {
    steps: string[];
    requirements: string[];
    timeEstimate: string;
    skillLevel: 'basic' | 'intermediate' | 'advanced';
  };
  
  // Code references
  necSections: string[];
  relatedStandards: string[];
  
  // Context
  applicableComponents: string[];
  conditions: string[];
}

export interface RealTimeAnalysis {
  timestamp: Date;
  analysisId: string;
  
  // Compliance status
  overallCompliance: number; // 0-100 percentage
  criticalViolations: number;
  majorViolations: number;
  minorViolations: number;
  warnings: number;
  
  // Analysis results
  violations: ComplianceViolation[];
  suggestions: ComplianceSuggestion[];
  
  // Educational insights
  insights: Array<{
    type: 'tip' | 'warning' | 'info' | 'best_practice';
    title: string;
    content: string;
    necSection?: string;
    learnMore?: string;
  }>;
  
  // Quick fixes
  quickFixes: Array<{
    description: string;
    action: string;
    impact: string;
    difficulty: 'easy' | 'moderate' | 'complex';
  }>;
}

export interface AssistantConfig {
  // NEC version and jurisdiction
  necVersion: '2017' | '2020' | '2023' | '2026';
  jurisdiction: string;
  adoptionDate?: Date;
  localAmendments: string[];
  
  // Analysis preferences
  analysisDepth: 'basic' | 'thorough' | 'comprehensive';
  includeRecommendations: boolean;
  includeEducationalContent: boolean;
  realTimeUpdates: boolean;
  
  // User preferences
  experienceLevel: 'student' | 'apprentice' | 'journeyman' | 'master' | 'engineer';
  focusAreas: Array<'safety' | 'efficiency' | 'cost' | 'code_compliance' | 'best_practices'>;
  notificationLevel: 'critical' | 'important' | 'all';
  
  // Display preferences
  showFormulas: boolean;
  showExplanations: boolean;
  showExamples: boolean;
  highlightViolations: boolean;
}

export class NECCodeAssistantService {
  private static codeDatabase: Map<string, NECCodeRule> = new Map();
  private static isInitialized = false;
  private static activeAnalysis: RealTimeAnalysis | null = null;
  private static analysisHistory: RealTimeAnalysis[] = [];
  private static userInteractions: Array<{
    type: 'violation_resolved' | 'suggestion_applied' | 'rule_viewed' | 'feedback_given';
    timestamp: Date;
    data: any;
  }> = [];

  /**
   * Initialize the NEC Code Assistant
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('📖 Initializing NEC Code Assistant...');
      
      // Load NEC code database
      await this.loadNECDatabase();
      
      this.isInitialized = true;
      console.log('✅ NEC Code Assistant initialized with', this.codeDatabase.size, 'rules');
    } catch (error) {
      console.error('❌ Failed to initialize NEC Code Assistant:', error);
      throw new Error('NEC Code Assistant initialization failed');
    }
  }

  /**
   * Perform real-time compliance analysis
   */
  static async analyzeCompliance(
    loadState: LoadState,
    necCalculations: NECCalculationResult,
    components: SLDComponent[],
    connections: SLDConnection[],
    config: Partial<AssistantConfig> = {}
  ): Promise<RealTimeAnalysis> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const defaultConfig: AssistantConfig = {
      necVersion: '2023',
      jurisdiction: 'National',
      localAmendments: [],
      analysisDepth: 'thorough',
      includeRecommendations: true,
      includeEducationalContent: true,
      realTimeUpdates: true,
      experienceLevel: 'journeyman',
      focusAreas: ['safety', 'code_compliance'],
      notificationLevel: 'important',
      showFormulas: true,
      showExplanations: true,
      showExamples: false,
      highlightViolations: true
    };

    const finalConfig = { ...defaultConfig, ...config };

    console.log('🔍 Performing real-time NEC compliance analysis...');

    try {
      const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Step 1: Analyze load calculations
      const loadViolations = await this.analyzeLoadCalculations(
        loadState,
        necCalculations,
        finalConfig
      );

      // Step 2: Analyze components
      const componentViolations = await this.analyzeComponents(
        components,
        finalConfig
      );

      // Step 3: Analyze connections and wiring
      const wiringViolations = await this.analyzeWiring(
        connections,
        components,
        finalConfig
      );

      // Step 4: Analyze system-level requirements
      const systemViolations = await this.analyzeSystemRequirements(
        loadState,
        necCalculations,
        components,
        finalConfig
      );

      // Combine all violations
      const allViolations = [
        ...loadViolations,
        ...componentViolations,
        ...wiringViolations,
        ...systemViolations
      ];

      // Step 5: Generate suggestions
      const suggestions = await this.generateSuggestions(
        loadState,
        necCalculations,
        components,
        allViolations,
        finalConfig
      );

      // Step 6: Generate educational insights
      const insights = await this.generateInsights(
        allViolations,
        suggestions,
        finalConfig
      );

      // Step 7: Generate quick fixes
      const quickFixes = await this.generateQuickFixes(
        allViolations,
        finalConfig
      );

      // Calculate compliance metrics
      const criticalViolations = allViolations.filter(v => v.severity === 'critical').length;
      const majorViolations = allViolations.filter(v => v.severity === 'major').length;
      const minorViolations = allViolations.filter(v => v.severity === 'minor').length;
      const warnings = allViolations.filter(v => v.severity === 'warning').length;
      
      const totalIssues = criticalViolations + majorViolations + minorViolations;
      const overallCompliance = totalIssues === 0 ? 100 : Math.max(0, 100 - (totalIssues * 10));

      const analysis: RealTimeAnalysis = {
        timestamp: new Date(),
        analysisId,
        overallCompliance,
        criticalViolations,
        majorViolations,
        minorViolations,
        warnings,
        violations: allViolations,
        suggestions,
        insights,
        quickFixes
      };

      // Store analysis
      this.activeAnalysis = analysis;
      this.analysisHistory.push(analysis);

      console.log('✅ NEC compliance analysis completed:', {
        compliance: `${overallCompliance}%`,
        violations: allViolations.length,
        suggestions: suggestions.length,
        insights: insights.length
      });

      return analysis;

    } catch (error) {
      console.error('❌ NEC compliance analysis failed:', error);
      throw new Error(`Compliance analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze load calculations for NEC compliance
   */
  private static async analyzeLoadCalculations(
    loadState: LoadState,
    necCalculations: NECCalculationResult,
    config: AssistantConfig
  ): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    // Check service size adequacy (NEC 220.82)
    if (necCalculations.calculatedServiceSize > necCalculations.serviceSize) {
      violations.push({
        id: `violation_service_size_${Date.now()}`,
        ruleId: 'nec_220_82',
        section: '220.82',
        severity: 'critical',
        title: 'Service Size Inadequate',
        description: `Calculated load (${necCalculations.calculatedServiceSize}A) exceeds service capacity (${necCalculations.serviceSize}A)`,
        currentValue: necCalculations.serviceSize,
        requiredValue: necCalculations.calculatedServiceSize,
        resolution: {
          steps: [
            'Upgrade service panel to higher amperage rating',
            'Verify utility service capacity',
            'Update service entrance conductors',
            'Update meter base if required'
          ],
          alternatives: [
            'Reduce connected loads',
            'Implement load management system',
            'Phase installation over time'
          ],
          estimatedEffort: 'high',
          cost: 'high'
        },
        explanation: 'The service panel must be sized to handle the calculated electrical load with appropriate safety margin.',
        whyItMatters: 'Undersized service can lead to overheating, equipment damage, and fire hazards.',
        commonMistakes: [
          'Not accounting for future load growth',
          'Forgetting motor starting current requirements',
          'Improper application of demand factors'
        ]
      });
    }

    // Check 125% continuous load factor (NEC 210.19(A)(1))
    loadState.loads.evse.forEach((load, index) => {
      const continuousAmperage = load.watts / (load.voltage || 240);
      const requiredAmperage = continuousAmperage * 1.25;
      
      if (continuousAmperage > 0 && requiredAmperage > continuousAmperage) {
        violations.push({
          id: `violation_continuous_load_${index}`,
          ruleId: 'nec_210_19_a_1',
          section: '210.19(A)(1)',
          severity: 'major',
          title: '125% Continuous Load Factor Required',
          description: `EVSE load "${load.description}" requires 125% sizing for continuous operation`,
          currentValue: `${continuousAmperage.toFixed(1)}A`,
          requiredValue: `${requiredAmperage.toFixed(1)}A`,
          load: load.id,
          resolution: {
            steps: [
              'Apply 125% factor to continuous loads',
              'Size conductors and overcurrent protection accordingly',
              'Verify terminal temperature ratings'
            ],
            alternatives: [
              'Use load management to avoid continuous operation',
              'Install timer controls for non-continuous use'
            ],
            estimatedEffort: 'medium',
            cost: 'medium'
          },
          explanation: 'Continuous loads (operating for 3+ hours) must be calculated at 125% for conductor and overcurrent protection sizing.',
          whyItMatters: 'Prevents conductor overheating and ensures safe long-term operation.',
          commonMistakes: [
            'Forgetting to apply continuous load factor',
            'Misidentifying continuous vs non-continuous loads'
          ]
        });
      }
    });

    // Check GFCI requirements (NEC 210.8)
    loadState.loads.general.forEach((load, index) => {
      const description = load.description.toLowerCase();
      const needsGFCI = description.includes('bathroom') || 
                       description.includes('kitchen') || 
                       description.includes('garage') ||
                       description.includes('outdoor') ||
                       description.includes('basement') ||
                       description.includes('laundry');

      if (needsGFCI && !description.includes('gfci')) {
        violations.push({
          id: `violation_gfci_${index}`,
          ruleId: 'nec_210_8',
          section: '210.8',
          severity: 'critical',
          title: 'GFCI Protection Required',
          description: `Load "${load.description}" requires GFCI protection based on location`,
          currentValue: 'No GFCI protection specified',
          requiredValue: 'GFCI protection required',
          load: load.id,
          resolution: {
            steps: [
              'Install GFCI circuit breaker',
              'Use GFCI receptacles',
              'Verify proper wiring connections',
              'Test GFCI functionality'
            ],
            alternatives: [
              'Use portable GFCI devices (temporary solution)',
              'Relocate equipment to non-GFCI area if possible'
            ],
            estimatedEffort: 'low',
            cost: 'low'
          },
          explanation: 'GFCI protection is required in wet and damp locations to prevent electrical shock.',
          whyItMatters: 'GFCI protection can prevent fatal electrical shock in hazardous locations.',
          commonMistakes: [
            'Not identifying all GFCI-required locations',
            'Using wrong type of GFCI device',
            'Improper GFCI wiring'
          ]
        });
      }
    });

    return violations;
  }

  /**
   * Analyze components for NEC compliance
   */
  private static async analyzeComponents(
    components: SLDComponent[],
    config: AssistantConfig
  ): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    components.forEach(component => {
      // Check component ratings and specifications
      if (component.electrical.amperage > 100 && !component.specifications.shortCircuitRating) {
        violations.push({
          id: `violation_short_circuit_${component.id}`,
          ruleId: 'nec_110_9',
          section: '110.9',
          severity: 'major',
          title: 'Short Circuit Rating Required',
          description: `Component "${component.visual.label}" requires short circuit current rating`,
          currentValue: 'No rating specified',
          requiredValue: 'Short circuit rating required',
          component: component.id,
          resolution: {
            steps: [
              'Obtain available fault current from utility',
              'Calculate fault current at component location',
              'Verify component short circuit rating meets or exceeds calculated value',
              'Use series rating if applicable'
            ],
            alternatives: [
              'Use current limiting devices',
              'Install fault current limiters',
              'Relocate to lower fault current location'
            ],
            estimatedEffort: 'medium',
            cost: 'medium'
          },
          explanation: 'Equipment must be rated to safely interrupt available fault current.',
          whyItMatters: 'Inadequate ratings can result in equipment explosion and fire.',
          commonMistakes: [
            'Not obtaining utility fault current data',
            'Ignoring series rating opportunities',
            'Using inadequately rated equipment'
          ]
        });
      }

      // Check grounding requirements (NEC 250)
      if (!component.terminals.some(t => t.type === 'ground') && 
          component.metadata.category !== 'control') {
        violations.push({
          id: `violation_grounding_${component.id}`,
          ruleId: 'nec_250_118',
          section: '250.118',
          severity: 'critical',
          title: 'Equipment Grounding Required',
          description: `Component "${component.visual.label}" missing equipment grounding connection`,
          currentValue: 'No grounding terminal',
          requiredValue: 'Equipment grounding conductor required',
          component: component.id,
          resolution: {
            steps: [
              'Add equipment grounding conductor',
              'Connect to equipment grounding terminal',
              'Verify grounding electrode system',
              'Test grounding continuity'
            ],
            alternatives: [
              'Use self-grounding devices where permitted',
              'Install GFCI protection in lieu of grounding (limited applications)'
            ],
            estimatedEffort: 'medium',
            cost: 'low'
          },
          explanation: 'Equipment grounding provides safety path for fault current and voltage stabilization.',
          whyItMatters: 'Proper grounding prevents shock hazards and ensures protective device operation.',
          commonMistakes: [
            'Omitting equipment grounding conductor',
            'Using inadequate grounding methods',
            'Not maintaining grounding continuity'
          ]
        });
      }

      // Check EVSE specific requirements (NEC 625)
      if (component.type === 'evse') {
        if (!component.specifications.enclosureType?.includes('3')) {
          violations.push({
            id: `violation_evse_enclosure_${component.id}`,
            ruleId: 'nec_625_22',
            section: '625.22',
            severity: 'major',
            title: 'EVSE Enclosure Rating',
            description: `EVSE "${component.visual.label}" requires weather-resistant enclosure`,
            currentValue: component.specifications.enclosureType || 'Not specified',
            requiredValue: 'NEMA 3R or better for outdoor use',
            component: component.id,
            resolution: {
              steps: [
                'Specify appropriate NEMA-rated enclosure',
                'Verify environmental conditions',
                'Install proper mounting hardware',
                'Ensure proper drainage'
              ],
              alternatives: [
                'Install in covered area with NEMA 1 enclosure',
                'Use weatherproof cover for existing enclosure'
              ],
              estimatedEffort: 'low',
              cost: 'low'
            },
            explanation: 'EVSE equipment exposed to weather requires appropriate protection.',
            whyItMatters: 'Inadequate protection can lead to equipment failure and safety hazards.',
            commonMistakes: [
              'Using indoor-rated equipment outdoors',
              'Inadequate mounting or drainage',
              'Not considering environmental conditions'
            ]
          });
        }
      }
    });

    return violations;
  }

  /**
   * Analyze wiring and connections for NEC compliance
   */
  private static async analyzeWiring(
    connections: SLDConnection[],
    components: SLDComponent[],
    config: AssistantConfig
  ): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    connections.forEach(connection => {
      // Check conductor sizing (NEC 310.15)
      const ampacity = this.getConductorAmpacity(connection.conductor.size, connection.conductor.type);
      const requiredAmpacity = this.getRequiredAmpacity(connection, components);

      if (ampacity < requiredAmpacity) {
        violations.push({
          id: `violation_conductor_size_${connection.id}`,
          ruleId: 'nec_310_15',
          section: '310.15(B)(16)',
          severity: 'critical',
          title: 'Conductor Undersized',
          description: `Conductor "${connection.conductor.size}" insufficient for ${requiredAmpacity}A load`,
          currentValue: `${connection.conductor.size} (${ampacity}A)`,
          requiredValue: `${requiredAmpacity}A capacity`,
          resolution: {
            steps: [
              'Calculate actual load current',
              'Apply temperature and bundling corrections',
              'Select conductor with adequate ampacity',
              'Verify voltage drop requirements'
            ],
            alternatives: [
              'Reduce load current',
              'Improve installation conditions',
              'Use multiple parallel conductors'
            ],
            estimatedEffort: 'high',
            cost: 'medium'
          },
          explanation: 'Conductors must be sized to carry load current safely without overheating.',
          whyItMatters: 'Undersized conductors can overheat, causing fires and equipment damage.',
          commonMistakes: [
            'Not applying correction factors',
            'Using nominal vs. actual ampacities',
            'Ignoring terminal temperature limitations'
          ]
        });
      }

      // Check voltage drop (NEC 210.19(A)(1) FPN)
      if (connection.conductor.length) {
        const voltageDrop = this.calculateVoltageDrop(connection);
        const maxVoltageDrop = connection.type === 'power' ? 0.03 : 0.05; // 3% branch, 5% feeder + branch

        if (voltageDrop > maxVoltageDrop) {
          violations.push({
            id: `violation_voltage_drop_${connection.id}`,
            ruleId: 'nec_210_19_fpn',
            section: '210.19(A)(1) FPN',
            severity: 'minor',
            title: 'Excessive Voltage Drop',
            description: `${(voltageDrop * 100).toFixed(1)}% voltage drop exceeds recommended limits`,
            currentValue: `${(voltageDrop * 100).toFixed(1)}%`,
            requiredValue: `${(maxVoltageDrop * 100)}% or less`,
            resolution: {
              steps: [
                'Increase conductor size',
                'Reduce circuit length',
                'Verify actual load current',
                'Consider voltage drop at full load'
              ],
              alternatives: [
                'Install closer distribution panel',
                'Use higher voltage circuit',
                'Reduce connected load'
              ],
              estimatedEffort: 'medium',
              cost: 'medium'
            },
            explanation: 'Excessive voltage drop reduces equipment efficiency and can cause malfunction.',
            whyItMatters: 'Proper voltage levels ensure equipment operates as designed.',
            commonMistakes: [
              'Not calculating voltage drop',
              'Using improper resistance values',
              'Ignoring actual operating conditions'
            ]
          });
        }
      }
    });

    return violations;
  }

  /**
   * Analyze system-level requirements
   */
  private static async analyzeSystemRequirements(
    loadState: LoadState,
    necCalculations: NECCalculationResult,
    components: SLDComponent[],
    config: AssistantConfig
  ): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    // Check panel space requirements (NEC 408.35)
    const servicePanels = components.filter(c => c.type === 'service_panel');
    if (servicePanels.length > 0) {
      const totalCircuits = components.filter(c => c.type === 'breaker').length;
      const panelSpaces = 42; // Assume standard 42-space panel

      if (totalCircuits > panelSpaces * 0.8) { // 80% fill rule
        violations.push({
          id: `violation_panel_fill_${Date.now()}`,
          ruleId: 'nec_408_35',
          section: '408.35',
          severity: 'major',
          title: 'Panel Space Limitation',
          description: `Panel approaching capacity (${totalCircuits}/${panelSpaces} spaces)`,
          currentValue: `${totalCircuits} circuits`,
          requiredValue: `Less than ${Math.floor(panelSpaces * 0.8)} circuits recommended`,
          resolution: {
            steps: [
              'Add subpanel for additional circuits',
              'Combine compatible loads where permitted',
              'Use larger panel with more spaces',
              'Consider future expansion needs'
            ],
            alternatives: [
              'Use tandem breakers where permitted',
              'Relocate some loads to existing spare capacity'
            ],
            estimatedEffort: 'high',
            cost: 'medium'
          },
          explanation: 'Panels should not be filled to capacity to allow for future expansion.',
          whyItMatters: 'Overcrowded panels are difficult to work on and limit future additions.',
          commonMistakes: [
            'Not planning for future expansion',
            'Using all available spaces initially',
            'Not considering space requirements for larger breakers'
          ]
        });
      }
    }

    return violations;
  }

  /**
   * Generate improvement suggestions
   */
  private static async generateSuggestions(
    loadState: LoadState,
    necCalculations: NECCalculationResult,
    components: SLDComponent[],
    violations: ComplianceViolation[],
    config: AssistantConfig
  ): Promise<ComplianceSuggestion[]> {
    const suggestions: ComplianceSuggestion[] = [];

    // Suggest surge protection (NEC 230.67)
    if (necCalculations.calculatedServiceSize >= 100 && 
        !components.some(c => c.type === 'surge_protector')) {
      suggestions.push({
        id: `suggestion_surge_protection_${Date.now()}`,
        type: 'improvement',
        priority: 'medium',
        title: 'Add Surge Protection Device',
        description: 'Install Type 1 or Type 2 surge protective device for service entrance',
        benefit: 'Protects entire electrical system from voltage surges',
        implementation: {
          steps: [
            'Select appropriate SPD rating',
            'Install in service panel or adjacent enclosure',
            'Connect to service grounding electrode',
            'Add SPD overcurrent protection'
          ],
          requirements: ['SPD device', 'Mounting space', 'Grounding connection'],
          timeEstimate: '2-3 hours',
          skillLevel: 'intermediate'
        },
        necSections: ['230.67', '285.25'],
        relatedStandards: ['UL 1449'],
        applicableComponents: ['service_panel'],
        conditions: ['Service ≥ 100A', 'No existing SPD']
      });
    }

    // Suggest load management for EVSE
    const evseLoads = loadState.loads.evse;
    if (evseLoads.length > 1) {
      suggestions.push({
        id: `suggestion_load_management_${Date.now()}`,
        type: 'optimization',
        priority: 'high',
        title: 'Implement EVSE Load Management',
        description: 'Use load management system to optimize multiple EVSE installations',
        benefit: 'Reduces service size requirements and installation costs',
        implementation: {
          steps: [
            'Install load management controller',
            'Configure EVSE sharing protocols',
            'Set load priorities and limits',
            'Test system operation'
          ],
          requirements: ['Load management system', 'Compatible EVSE units'],
          timeEstimate: '4-6 hours',
          skillLevel: 'advanced'
        },
        necSections: ['625.41', '625.42'],
        relatedStandards: ['UL 2594'],
        applicableComponents: evseLoads.map(load => load.id),
        conditions: ['Multiple EVSE installations', 'Service capacity constraints']
      });
    }

    // Suggest energy monitoring
    suggestions.push({
      id: `suggestion_energy_monitoring_${Date.now()}`,
      type: 'best_practice',
      priority: 'low',
      title: 'Add Energy Monitoring System',
      description: 'Install smart meters or monitoring devices for energy usage tracking',
      benefit: 'Enables energy management and cost optimization',
      implementation: {
        steps: [
          'Select monitoring system',
          'Install current transformers',
          'Configure data collection',
          'Set up user interface'
        ],
        requirements: ['Monitoring hardware', 'Network connectivity'],
        timeEstimate: '3-4 hours',
        skillLevel: 'intermediate'
      },
      necSections: ['230.82'],
      relatedStandards: ['IEEE 1547'],
      applicableComponents: ['service_panel'],
      conditions: ['Smart home integration desired']
    });

    return suggestions;
  }

  /**
   * Generate educational insights
   */
  private static async generateInsights(
    violations: ComplianceViolation[],
    suggestions: ComplianceSuggestion[],
    config: AssistantConfig
  ): Promise<RealTimeAnalysis['insights']> {
    const insights: RealTimeAnalysis['insights'] = [];

    // Safety insight
    if (violations.some(v => v.section.includes('210.8'))) {
      insights.push({
        type: 'warning',
        title: 'GFCI Protection Critical for Safety',
        content: 'GFCI devices can prevent fatal electrical shock by detecting ground faults and disconnecting power in milliseconds.',
        necSection: '210.8',
        learnMore: 'Review NEC Article 210.8 for complete GFCI requirements'
      });
    }

    // Best practice insight
    if (config.includeEducationalContent) {
      insights.push({
        type: 'best_practice',
        title: 'Plan for Future Expansion',
        content: 'Reserve 25% of panel spaces and 25% of service capacity for future electrical loads.',
        necSection: '220.87',
        learnMore: 'Consider future needs when sizing electrical systems'
      });
    }

    // Code tip
    insights.push({
      type: 'tip',
      title: 'Conductor Sizing Factors',
      content: 'Apply temperature correction and adjustment factors when sizing conductors. Standard ampacity tables assume 30°C ambient and no more than 3 current-carrying conductors.',
      necSection: '310.15(B)',
      learnMore: 'See NEC Table 310.15(B)(2)(a) for temperature corrections'
    });

    return insights;
  }

  /**
   * Generate quick fixes
   */
  private static async generateQuickFixes(
    violations: ComplianceViolation[],
    config: AssistantConfig
  ): Promise<RealTimeAnalysis['quickFixes']> {
    const quickFixes: RealTimeAnalysis['quickFixes'] = [];

    // Quick fix for GFCI violations
    if (violations.some(v => v.ruleId === 'nec_210_8')) {
      quickFixes.push({
        description: 'Add GFCI Protection',
        action: 'Install GFCI circuit breaker or GFCI receptacle',
        impact: 'Eliminates critical safety violation',
        difficulty: 'easy'
      });
    }

    // Quick fix for conductor sizing
    if (violations.some(v => v.ruleId === 'nec_310_15')) {
      quickFixes.push({
        description: 'Upsize Conductors',
        action: 'Specify next larger conductor size',
        impact: 'Ensures adequate ampacity and safety',
        difficulty: 'moderate'
      });
    }

    return quickFixes;
  }

  /**
   * Load NEC code database
   */
  private static async loadNECDatabase(): Promise<void> {
    // In production, this would load from external database
    // For now, add essential rules directly
    const rules: NECCodeRule[] = [
      {
        id: 'nec_210_8',
        section: '210.8',
        title: 'Ground-Fault Circuit-Interrupter Protection for Personnel',
        description: 'GFCI protection requirements for various locations',
        category: 'safety',
        severity: 'mandatory',
        applicability: 'all',
        versions: [
          {
            year: '2023',
            text: 'Ground-fault circuit-interrupter protection for personnel shall be provided as required in 210.8(A) through (F).'
          }
        ],
        conditions: [
          { type: 'location', operator: 'in', value: ['bathroom', 'kitchen', 'garage', 'outdoor', 'basement', 'laundry'] }
        ],
        requirements: [
          { description: 'Install GFCI protection for receptacles in specified locations' }
        ],
        relatedSections: ['215.9', '590.6'],
        references: ['UL 943', 'UL 1053']
      },
      {
        id: 'nec_220_82',
        section: '220.82',
        title: 'Optional Calculation for One-Family Dwellings',
        description: 'Simplified method for calculating dwelling unit loads',
        category: 'calculation',
        severity: 'mandatory',
        applicability: 'residential',
        versions: [
          {
            year: '2023',
            text: 'This section provides an optional calculation method for one-family dwellings.'
          }
        ],
        conditions: [
          { type: 'application', operator: '==', value: 'residential' }
        ],
        requirements: [
          { 
            description: 'First 10 kVA at 100%, remainder at 40%',
            formula: '(first_10kva * 1.0) + (remaining_kva * 0.4)'
          }
        ],
        relatedSections: ['220.83', '220.87'],
        references: []
      }
    ];

    // Store rules in database
    rules.forEach(rule => {
      this.codeDatabase.set(rule.id, rule);
    });
  }

  /**
   * Get conductor ampacity from NEC tables
   */
  private static getConductorAmpacity(size: string, type: 'copper' | 'aluminum'): number {
    const ampacityTable: Record<string, { copper: number; aluminum: number }> = {
      '14 AWG': { copper: 20, aluminum: 15 },
      '12 AWG': { copper: 25, aluminum: 20 },
      '10 AWG': { copper: 35, aluminum: 30 },
      '8 AWG': { copper: 50, aluminum: 40 },
      '6 AWG': { copper: 65, aluminum: 50 },
      '4 AWG': { copper: 85, aluminum: 65 },
      '3 AWG': { copper: 100, aluminum: 80 },
      '2 AWG': { copper: 115, aluminum: 90 },
      '1 AWG': { copper: 130, aluminum: 100 },
      '1/0 AWG': { copper: 150, aluminum: 120 },
      '2/0 AWG': { copper: 175, aluminum: 135 },
      '3/0 AWG': { copper: 200, aluminum: 155 },
      '4/0 AWG': { copper: 230, aluminum: 180 }
    };

    return ampacityTable[size]?.[type] || 0;
  }

  /**
   * Get required ampacity for connection
   */
  private static getRequiredAmpacity(connection: SLDConnection, components: SLDComponent[]): number {
    const fromComponent = components.find(c => c.id === connection.from.componentId);
    const toComponent = components.find(c => c.id === connection.to.componentId);
    
    if (toComponent) {
      // Apply 125% factor for continuous loads
      const isContinuous = toComponent.type === 'evse' || 
                          toComponent.visual.label.toLowerCase().includes('continuous');
      return toComponent.electrical.amperage * (isContinuous ? 1.25 : 1.0);
    }
    
    return 0;
  }

  /**
   * Calculate voltage drop for connection
   */
  private static calculateVoltageDrop(connection: SLDConnection): number {
    // Simplified voltage drop calculation
    const resistance = this.getConductorResistance(connection.conductor.size, connection.conductor.type);
    const length = connection.conductor.length || 100; // feet
    const current = 20; // assume 20A for calculation
    const voltage = 240; // assume 240V
    
    const voltageDrop = (2 * resistance * length * current) / 1000; // mV
    return voltageDrop / voltage; // percentage
  }

  /**
   * Get conductor resistance
   */
  private static getConductorResistance(size: string, type: 'copper' | 'aluminum'): number {
    // Resistance in ohms per 1000 feet at 75°C
    const resistanceTable: Record<string, { copper: number; aluminum: number }> = {
      '14 AWG': { copper: 3.07, aluminum: 5.06 },
      '12 AWG': { copper: 1.93, aluminum: 3.18 },
      '10 AWG': { copper: 1.21, aluminum: 2.00 },
      '8 AWG': { copper: 0.764, aluminum: 1.26 },
      '6 AWG': { copper: 0.491, aluminum: 0.808 },
      '4 AWG': { copper: 0.308, aluminum: 0.508 },
      '2 AWG': { copper: 0.194, aluminum: 0.319 },
      '1/0 AWG': { copper: 0.122, aluminum: 0.201 }
    };

    return resistanceTable[size]?.[type] || 1.0;
  }

  /**
   * Get active analysis
   */
  static getActiveAnalysis(): RealTimeAnalysis | null {
    return this.activeAnalysis;
  }

  /**
   * Get analysis history
   */
  static getAnalysisHistory(): RealTimeAnalysis[] {
    return [...this.analysisHistory];
  }

  /**
   * Record user interaction for learning
   */
  static recordUserInteraction(
    type: 'violation_resolved' | 'suggestion_applied' | 'rule_viewed' | 'feedback_given',
    data: any
  ): void {
    this.userInteractions.push({
      type,
      timestamp: new Date(),
      data
    });
    console.log('📝 User interaction recorded for NEC assistant learning');
  }

  /**
   * Get service capabilities
   */
  static getAssistantCapabilities(): {
    isInitialized: boolean;
    ruleCount: number;
    supportedVersions: string[];
    analysisHistory: number;
    userInteractions: number;
  } {
    return {
      isInitialized: this.isInitialized,
      ruleCount: this.codeDatabase.size,
      supportedVersions: ['2017', '2020', '2023', '2026'],
      analysisHistory: this.analysisHistory.length,
      userInteractions: this.userInteractions.length
    };
  }

  /**
   * Get rule by section
   */
  static getRule(section: string): NECCodeRule | undefined {
    return Array.from(this.codeDatabase.values()).find(rule => rule.section === section);
  }

  /**
   * Search rules by keyword
   */
  static searchRules(keyword: string): NECCodeRule[] {
    const searchTerm = keyword.toLowerCase();
    return Array.from(this.codeDatabase.values()).filter(rule =>
      rule.title.toLowerCase().includes(searchTerm) ||
      rule.description.toLowerCase().includes(searchTerm) ||
      rule.section.includes(searchTerm)
    );
  }
}

export default NECCodeAssistantService;