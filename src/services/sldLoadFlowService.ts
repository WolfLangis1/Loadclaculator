import type { SLDDiagram, SLDComponent, SLDConnection } from '../types/sld';

export interface LoadFlowAnalysis {
  voltageDrop: Map<string, number>;
  currentFlow: Map<string, number>;
  powerLoss: Map<string, number>;
  efficiency: number;
  recommendations: string[];
  circuitPaths: CircuitPath[];
  criticalPaths: CircuitPath[];
}

export interface CircuitPath {
  id: string;
  components: string[];
  connections: string[];
  totalVoltageDrop: number;
  totalCurrent: number;
  totalPowerLoss: number;
  efficiency: number;
  isCritical: boolean;
}

export interface ElectricalNode {
  id: string;
  voltage: number;
  current: number;
  power: number;
  type: 'source' | 'load' | 'junction';
  componentId?: string;
}

export interface ElectricalBranch {
  id: string;
  fromNode: string;
  toNode: string;
  resistance: number;
  current: number;
  voltageDrop: number;
  powerLoss: number;
  connectionId?: string;
}

export class SLDLoadFlowService {
  private static readonly DEFAULT_VOLTAGE = 240;
  private static readonly DEFAULT_RESISTANCE_PER_FOOT = 0.0001; // Simplified resistance

  /**
   * Analyze electrical circuit for load flow
   */
  static analyzeCircuit(diagram: SLDDiagram): LoadFlowAnalysis {
    const nodes = this.buildElectricalNodes(diagram);
    const branches = this.buildElectricalBranches(diagram, nodes);
    const paths = this.findCircuitPaths(diagram, nodes, branches);
    
    // Calculate load flow for each path
    const analyzedPaths = paths.map(path => this.analyzePath(path, nodes, branches));
    
    // Calculate overall metrics
    const voltageDrop = new Map<string, number>();
    const currentFlow = new Map<string, number>();
    const powerLoss = new Map<string, number>();
    
    analyzedPaths.forEach(path => {
      path.connections.forEach(connId => {
        const branch = branches.find(b => b.connectionId === connId);
        if (branch) {
          voltageDrop.set(connId, branch.voltageDrop);
          currentFlow.set(connId, branch.current);
          powerLoss.set(connId, branch.powerLoss);
        }
      });
    });
    
    // Calculate overall efficiency
    const totalPowerInput = this.calculateTotalPowerInput(diagram);
    const totalPowerLoss = Array.from(powerLoss.values()).reduce((sum, loss) => sum + loss, 0);
    const efficiency = totalPowerInput > 0 ? ((totalPowerInput - totalPowerLoss) / totalPowerInput) * 100 : 100;
    
    // Identify critical paths
    const criticalPaths = analyzedPaths.filter(path => 
      path.totalVoltageDrop > 3 || path.efficiency < 95
    );
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(analyzedPaths, criticalPaths);
    
    return {
      voltageDrop,
      currentFlow,
      powerLoss,
      efficiency,
      recommendations,
      circuitPaths: analyzedPaths,
      criticalPaths
    };
  }

  /**
   * Optimize layout based on load flow analysis
   */
  static optimizeLayout(diagram: SLDDiagram): SLDDiagram {
    const analysis = this.analyzeCircuit(diagram);
    const optimizedDiagram = { ...diagram };
    
    // Optimize component placement to minimize voltage drop
    analysis.criticalPaths.forEach(path => {
      if (path.totalVoltageDrop > 3) {
        // Move components closer to reduce wire length
        this.optimizePathPlacement(optimizedDiagram, path);
      }
    });
    
    // Optimize wire sizing for high current paths
    analysis.circuitPaths.forEach(path => {
      if (path.totalCurrent > 50) {
        this.optimizeWireSizing(optimizedDiagram, path);
      }
    });
    
    return optimizedDiagram;
  }

  /**
   * Validate voltage drop for a connection
   */
  static validateVoltageDrop(connection: SLDConnection): boolean {
    const voltageDrop = this.calculateConnectionVoltageDrop(connection);
    const voltageDropPercent = (voltageDrop / (connection.voltage || this.DEFAULT_VOLTAGE)) * 100;
    
    // NEC allows 3% for branch circuits, 2% for feeders
    const maxAllowed = connection.wireType === 'ac' ? 3 : 2;
    return voltageDropPercent <= maxAllowed;
  }

  /**
   * Calculate voltage drop for a specific connection
   */
  static calculateConnectionVoltageDrop(connection: SLDConnection): number {
    const current = connection.current || 0;
    const length = this.estimateConnectionLength(connection);
    const resistance = length * this.DEFAULT_RESISTANCE_PER_FOOT;
    
    return current * resistance;
  }

  /**
   * Build electrical nodes from diagram components
   */
  private static buildElectricalNodes(diagram: SLDDiagram): ElectricalNode[] {
    const nodes: ElectricalNode[] = [];
    
    diagram.components.forEach(component => {
      const node: ElectricalNode = {
        id: `node_${component.id}`,
        voltage: this.getComponentVoltage(component),
        current: this.getComponentCurrent(component),
        power: this.getComponentPower(component),
        type: this.getComponentType(component),
        componentId: component.id
      };
      nodes.push(node);
    });
    
    return nodes;
  }

  /**
   * Build electrical branches from diagram connections
   */
  private static buildElectricalBranches(
    diagram: SLDDiagram, 
    nodes: ElectricalNode[]
  ): ElectricalBranch[] {
    const branches: ElectricalBranch[] = [];
    
    diagram.connections.forEach(connection => {
      const fromNode = nodes.find(n => n.componentId === connection.fromComponentId);
      const toNode = nodes.find(n => n.componentId === connection.toComponentId);
      
      if (fromNode && toNode) {
        const length = this.estimateConnectionLength(connection);
        const resistance = length * this.DEFAULT_RESISTANCE_PER_FOOT;
        const current = connection.current || 0;
        const voltageDrop = current * resistance;
        const powerLoss = current * current * resistance;
        
        const branch: ElectricalBranch = {
          id: `branch_${connection.id}`,
          fromNode: fromNode.id,
          toNode: toNode.id,
          resistance,
          current,
          voltageDrop,
          powerLoss,
          connectionId: connection.id
        };
        branches.push(branch);
      }
    });
    
    return branches;
  }

  /**
   * Find all circuit paths in the diagram
   */
  private static findCircuitPaths(
    diagram: SLDDiagram,
    nodes: ElectricalNode[],
    branches: ElectricalBranch[]
  ): CircuitPath[] {
    const paths: CircuitPath[] = [];
    const sourceNodes = nodes.filter(n => n.type === 'source');
    const loadNodes = nodes.filter(n => n.type === 'load');
    
    // Find paths from each source to each load
    sourceNodes.forEach(source => {
      loadNodes.forEach(load => {
        const path = this.findPath(source.id, load.id, nodes, branches);
        if (path) {
          paths.push(path);
        }
      });
    });
    
    return paths;
  }

  /**
   * Find a specific path between two nodes
   */
  private static findPath(
    fromNodeId: string,
    toNodeId: string,
    nodes: ElectricalNode[],
    branches: ElectricalBranch[]
  ): CircuitPath | null {
    // Simplified path finding - in practice, you'd use a proper graph algorithm
    const pathBranches = branches.filter(b => 
      b.fromNode === fromNodeId || b.toNode === toNodeId
    );
    
    if (pathBranches.length === 0) return null;
    
    const components = new Set<string>();
    const connections = new Set<string>();
    
    pathBranches.forEach(branch => {
      if (branch.connectionId) {
        connections.add(branch.connectionId);
      }
    });
    
    return {
      id: `path_${fromNodeId}_${toNodeId}`,
      components: Array.from(components),
      connections: Array.from(connections),
      totalVoltageDrop: 0,
      totalCurrent: 0,
      totalPowerLoss: 0,
      efficiency: 100,
      isCritical: false
    };
  }

  /**
   * Analyze a specific circuit path
   */
  private static analyzePath(
    path: CircuitPath,
    nodes: ElectricalNode[],
    branches: ElectricalBranch[]
  ): CircuitPath {
    let totalVoltageDrop = 0;
    let totalCurrent = 0;
    let totalPowerLoss = 0;
    
    path.connections.forEach(connId => {
      const branch = branches.find(b => b.connectionId === connId);
      if (branch) {
        totalVoltageDrop += branch.voltageDrop;
        totalCurrent = Math.max(totalCurrent, branch.current);
        totalPowerLoss += branch.powerLoss;
      }
    });
    
    // Calculate efficiency
    const inputPower = totalCurrent * (this.DEFAULT_VOLTAGE - totalVoltageDrop);
    const efficiency = inputPower > 0 ? ((inputPower - totalPowerLoss) / inputPower) * 100 : 100;
    
    return {
      ...path,
      totalVoltageDrop,
      totalCurrent,
      totalPowerLoss,
      efficiency,
      isCritical: totalVoltageDrop > 3 || efficiency < 95
    };
  }

  /**
   * Calculate total power input to the system
   */
  private static calculateTotalPowerInput(diagram: SLDDiagram): number {
    return diagram.components
      .filter(c => this.getComponentType(c) === 'source')
      .reduce((sum, component) => sum + this.getComponentPower(component), 0);
  }

  /**
   * Optimize component placement for a critical path
   */
  private static optimizePathPlacement(diagram: SLDDiagram, path: CircuitPath): void {
    // Simplified optimization - move components closer together
    const components = diagram.components.filter(c => path.components.includes(c.id));
    
    if (components.length >= 2) {
      // Calculate center point
      const centerX = components.reduce((sum, c) => sum + c.position.x, 0) / components.length;
      const centerY = components.reduce((sum, c) => sum + c.position.y, 0) / components.length;
      
      // Move components closer to center
      components.forEach(component => {
        const dx = centerX - component.position.x;
        const dy = centerY - component.position.y;
        
        component.position.x += dx * 0.1; // Move 10% closer
        component.position.y += dy * 0.1;
      });
    }
  }

  /**
   * Optimize wire sizing for high current paths
   */
  private static optimizeWireSizing(diagram: SLDDiagram, path: CircuitPath): void {
    // This would typically involve upgrading wire sizes
    // For now, we'll just add a note to the connection
    path.connections.forEach(connId => {
      const connection = diagram.connections.find(c => c.id === connId);
      if (connection && !connection.label) {
        connection.label = 'HIGH CURRENT - VERIFY WIRE SIZE';
      }
    });
  }

  /**
   * Generate recommendations based on analysis
   */
  private static generateRecommendations(
    paths: CircuitPath[],
    criticalPaths: CircuitPath[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (criticalPaths.length > 0) {
      recommendations.push(`Optimize ${criticalPaths.length} critical circuit path(s) to reduce voltage drop`);
    }
    
    const highCurrentPaths = paths.filter(p => p.totalCurrent > 50);
    if (highCurrentPaths.length > 0) {
      recommendations.push(`Verify wire sizing for ${highCurrentPaths.length} high-current path(s)`);
    }
    
    const lowEfficiencyPaths = paths.filter(p => p.efficiency < 95);
    if (lowEfficiencyPaths.length > 0) {
      recommendations.push(`Improve efficiency for ${lowEfficiencyPaths.length} circuit path(s)`);
    }
    
    const totalPowerLoss = paths.reduce((sum, p) => sum + p.totalPowerLoss, 0);
    if (totalPowerLoss > 1000) {
      recommendations.push('Consider larger wire sizes to reduce power losses');
    }
    
    return recommendations;
  }

  /**
   * Estimate connection length based on component positions
   */
  private static estimateConnectionLength(connection: SLDConnection): number {
    // This would typically calculate actual distance between components
    // For now, use a default value
    return 50; // feet
  }

  /**
   * Get component voltage
   */
  private static getComponentVoltage(component: SLDComponent): number {
    const voltageMap: Record<string, number> = {
      'pv_array': 600,
      'inverter': 240,
      'battery': 400,
      'main_panel': 240,
      'grid': 240,
      'evse_charger': 240
    };
    
    return voltageMap[component.type] || this.DEFAULT_VOLTAGE;
  }

  /**
   * Get component current
   */
  private static getComponentCurrent(component: SLDComponent): number {
    const currentMap: Record<string, number> = {
      'pv_array': 20,
      'inverter': 32,
      'battery': 30,
      'main_panel': 200,
      'grid': 200,
      'evse_charger': 48
    };
    
    return currentMap[component.type] || 0;
  }

  /**
   * Get component power
   */
  private static getComponentPower(component: SLDComponent): number {
    const voltage = this.getComponentVoltage(component);
    const current = this.getComponentCurrent(component);
    return voltage * current;
  }

  /**
   * Get component type for electrical analysis
   */
  private static getComponentType(component: SLDComponent): 'source' | 'load' | 'junction' {
    const sourceTypes = ['grid', 'pv_array', 'battery'];
    const loadTypes = ['inverter', 'evse_charger'];
    
    if (sourceTypes.includes(component.type)) {
      return 'source';
    } else if (loadTypes.includes(component.type)) {
      return 'load';
    } else {
      return 'junction';
    }
  }

  /**
   * Export load flow analysis report
   */
  static exportAnalysis(analysis: LoadFlowAnalysis, format: 'json' | 'text' | 'html'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(analysis, null, 2);
      
      case 'text':
        return this.generateTextReport(analysis);
      
      case 'html':
        return this.generateHtmlReport(analysis);
      
      default:
        return JSON.stringify(analysis);
    }
  }

  private static generateTextReport(analysis: LoadFlowAnalysis): string {
    let text = `Load Flow Analysis Report\n`;
    text += `========================\n\n`;
    
    text += `Overall Efficiency: ${analysis.efficiency.toFixed(2)}%\n`;
    text += `Critical Paths: ${analysis.criticalPaths.length}\n`;
    text += `Total Circuit Paths: ${analysis.circuitPaths.length}\n\n`;
    
    if (analysis.criticalPaths.length > 0) {
      text += `Critical Paths:\n`;
      analysis.criticalPaths.forEach((path, index) => {
        text += `${index + 1}. Path ${path.id}\n`;
        text += `   Voltage Drop: ${path.totalVoltageDrop.toFixed(2)}V\n`;
        text += `   Current: ${path.totalCurrent.toFixed(2)}A\n`;
        text += `   Efficiency: ${path.efficiency.toFixed(2)}%\n`;
      });
      text += `\n`;
    }
    
    if (analysis.recommendations.length > 0) {
      text += `Recommendations:\n`;
      analysis.recommendations.forEach(rec => {
        text += `- ${rec}\n`;
      });
    }
    
    return text;
  }

  private static generateHtmlReport(analysis: LoadFlowAnalysis): string {
    return `
      <html>
        <head>
          <title>Load Flow Analysis Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { background: #f0f0f0; padding: 10px; border-radius: 5px; }
            .critical { color: #d32f2f; }
            .warning { color: #f57c00; }
            .recommendations { background: #e3f2fd; padding: 10px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Load Flow Analysis Report</h1>
            <p><strong>Overall Efficiency:</strong> ${analysis.efficiency.toFixed(2)}%</p>
            <p><strong>Critical Paths:</strong> ${analysis.criticalPaths.length}</p>
            <p><strong>Total Paths:</strong> ${analysis.circuitPaths.length}</p>
          </div>
          
          ${analysis.criticalPaths.length > 0 ? `
            <div>
              <h2>Critical Paths</h2>
              ${analysis.criticalPaths.map((path, index) => `
                <div class="critical">
                  <h3>Path ${index + 1}: ${path.id}</h3>
                  <p>Voltage Drop: ${path.totalVoltageDrop.toFixed(2)}V</p>
                  <p>Current: ${path.totalCurrent.toFixed(2)}A</p>
                  <p>Efficiency: ${path.efficiency.toFixed(2)}%</p>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${analysis.recommendations.length > 0 ? `
            <div class="recommendations">
              <h2>Recommendations</h2>
              <ul>
                ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </body>
      </html>
    `;
  }
} 