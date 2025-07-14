import type { SLDDiagram, SLDComponent, SLDConnection, SLDPosition, SLDSize } from '../types/sld';

export interface SLDCommand {
  execute(): void;
  undo(): void;
  redo(): void;
  description: string;
  timestamp: Date;
}

export interface CommandHistory {
  commands: SLDCommand[];
  currentIndex: number;
  maxHistory: number;
}

export class CommandManager {
  private history: CommandHistory = {
    commands: [],
    currentIndex: -1,
    maxHistory: 50
  };

  private diagram: SLDDiagram;

  constructor(diagram: SLDDiagram) {
    this.diagram = diagram;
  }

  executeCommand(command: SLDCommand): void {
    // Remove any commands after current index (when undoing and then executing new command)
    this.history.commands = this.history.commands.slice(0, this.history.currentIndex + 1);
    
    // Execute the command
    command.execute();
    
    // Add to history
    this.history.commands.push(command);
    this.history.currentIndex++;
    
    // Limit history size
    if (this.history.commands.length > this.history.maxHistory) {
      this.history.commands.shift();
      this.history.currentIndex--;
    }
  }

  undo(): boolean {
    if (this.history.currentIndex >= 0) {
      const command = this.history.commands[this.history.currentIndex];
      command.undo();
      this.history.currentIndex--;
      return true;
    }
    return false;
  }

  redo(): boolean {
    if (this.history.currentIndex < this.history.commands.length - 1) {
      this.history.currentIndex++;
      const command = this.history.commands[this.history.currentIndex];
      command.redo();
      return true;
    }
    return false;
  }

  canUndo(): boolean {
    return this.history.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.history.currentIndex < this.history.commands.length - 1;
  }

  getHistory(): CommandHistory {
    return { ...this.history };
  }

  clearHistory(): void {
    this.history.commands = [];
    this.history.currentIndex = -1;
  }
}

// Command implementations
export class AddComponentCommand implements SLDCommand {
  public timestamp: Date = new Date();

  constructor(
    private diagram: SLDDiagram,
    private component: SLDComponent,
    private onUpdate: (diagram: SLDDiagram) => void
  ) {}

  execute(): void {
    this.diagram.components.push(this.component);
    this.diagram.lastModified = new Date();
    this.onUpdate(this.diagram);
  }

  undo(): void {
    const index = this.diagram.components.findIndex(c => c.id === this.component.id);
    if (index !== -1) {
      this.diagram.components.splice(index, 1);
      this.diagram.lastModified = new Date();
      this.onUpdate(this.diagram);
    }
  }

  redo(): void {
    this.execute();
  }

  get description(): string {
    return `Add ${this.component.name || this.component.type}`;
  }
}

export class RemoveComponentCommand implements SLDCommand {
  public timestamp: Date = new Date();
  private originalIndex: number = -1;

  constructor(
    private diagram: SLDDiagram,
    private componentId: string,
    private onUpdate: (diagram: SLDDiagram) => void
  ) {}

  execute(): void {
    const index = this.diagram.components.findIndex(c => c.id === this.componentId);
    if (index !== -1) {
      this.originalIndex = index;
      this.diagram.components.splice(index, 1);
      this.diagram.lastModified = new Date();
      this.onUpdate(this.diagram);
    }
  }

  undo(): void {
    if (this.originalIndex !== -1) {
      const component = this.diagram.components.find(c => c.id === this.componentId);
      if (component) {
        this.diagram.components.splice(this.originalIndex, 0, component);
        this.diagram.lastModified = new Date();
        this.onUpdate(this.diagram);
      }
    }
  }

  redo(): void {
    this.execute();
  }

  get description(): string {
    const component = this.diagram.components.find(c => c.id === this.componentId);
    return `Remove ${component?.name || component?.type || 'component'}`;
  }
}

export class MoveComponentCommand implements SLDCommand {
  public timestamp: Date = new Date();
  private originalPosition: SLDPosition;

  constructor(
    private diagram: SLDDiagram,
    private componentId: string,
    private newPosition: SLDPosition,
    private onUpdate: (diagram: SLDDiagram) => void
  ) {
    const component = this.diagram.components.find(c => c.id === this.componentId);
    this.originalPosition = component ? { ...component.position } : { x: 0, y: 0 };
  }

  execute(): void {
    const component = this.diagram.components.find(c => c.id === this.componentId);
    if (component) {
      component.position = { ...this.newPosition };
      this.diagram.lastModified = new Date();
      this.onUpdate(this.diagram);
    }
  }

  undo(): void {
    const component = this.diagram.components.find(c => c.id === this.componentId);
    if (component) {
      component.position = { ...this.originalPosition };
      this.diagram.lastModified = new Date();
      this.onUpdate(this.diagram);
    }
  }

  redo(): void {
    this.execute();
  }

  get description(): string {
    return `Move component to (${this.newPosition.x}, ${this.newPosition.y})`;
  }
}

export class ResizeComponentCommand implements SLDCommand {
  public timestamp: Date = new Date();
  private originalSize: SLDSize;

  constructor(
    private diagram: SLDDiagram,
    private componentId: string,
    private newSize: SLDSize,
    private onUpdate: (diagram: SLDDiagram) => void
  ) {
    const component = this.diagram.components.find(c => c.id === this.componentId);
    this.originalSize = component ? { ...component.size } : { width: 0, height: 0 };
  }

  execute(): void {
    const component = this.diagram.components.find(c => c.id === this.componentId);
    if (component) {
      component.size = { ...this.newSize };
      this.diagram.lastModified = new Date();
      this.onUpdate(this.diagram);
    }
  }

  undo(): void {
    const component = this.diagram.components.find(c => c.id === this.componentId);
    if (component) {
      component.size = { ...this.originalSize };
      this.diagram.lastModified = new Date();
      this.onUpdate(this.diagram);
    }
  }

  redo(): void {
    this.execute();
  }

  get description(): string {
    return `Resize component to ${this.newSize.width}×${this.newSize.height}`;
  }
}

export class AddConnectionCommand implements SLDCommand {
  public timestamp: Date = new Date();

  constructor(
    private diagram: SLDDiagram,
    private connection: SLDConnection,
    private onUpdate: (diagram: SLDDiagram) => void
  ) {}

  execute(): void {
    this.diagram.connections.push(this.connection);
    this.diagram.lastModified = new Date();
    this.onUpdate(this.diagram);
  }

  undo(): void {
    const index = this.diagram.connections.findIndex(c => c.id === this.connection.id);
    if (index !== -1) {
      this.diagram.connections.splice(index, 1);
      this.diagram.lastModified = new Date();
      this.onUpdate(this.diagram);
    }
  }

  redo(): void {
    this.execute();
  }

  get description(): string {
    return `Add connection ${this.connection.wireType}`;
  }
}

export class UpdateComponentPropertyCommand implements SLDCommand {
  public timestamp: Date = new Date();
  private originalValue: any;

  constructor(
    private diagram: SLDDiagram,
    private componentId: string,
    private property: string,
    private newValue: any,
    private onUpdate: (diagram: SLDDiagram) => void
  ) {
    const component = this.diagram.components.find(c => c.id === this.componentId);
    this.originalValue = component ? (component as any)[property] : undefined;
  }

  execute(): void {
    const component = this.diagram.components.find(c => c.id === this.componentId);
    if (component) {
      (component as any)[this.property] = this.newValue;
      this.diagram.lastModified = new Date();
      this.onUpdate(this.diagram);
    }
  }

  undo(): void {
    const component = this.diagram.components.find(c => c.id === this.componentId);
    if (component) {
      (component as any)[this.property] = this.originalValue;
      this.diagram.lastModified = new Date();
      this.onUpdate(this.diagram);
    }
  }

  redo(): void {
    this.execute();
  }

  get description(): string {
    return `Update ${this.property} to ${this.newValue}`;
  }
} 