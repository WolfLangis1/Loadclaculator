/**
 * Text Annotation Tool - Various text styles and formatting
 */

import { BaseTool, Point } from './DrawingToolSystem';

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  backgroundColor?: string;
  alignment: 'left' | 'center' | 'right';
  verticalAlignment: 'top' | 'middle' | 'bottom';
}

export interface TextObject {
  id: string;
  text: string;
  position: Point;
  style: TextStyle;
  bounds: { width: number; height: number };
  rotation: number;
  editable: boolean;
}

export class TextTool extends BaseTool {
  public id = 'text';
  public name = 'Text';
  public icon = 'T';
  public cursor = 'text';
  public category = 'annotation' as const;
  public shortcut = 't';

  private defaultStyle: TextStyle = {
    fontFamily: 'Arial, sans-serif',
    fontSize: 12,
    fontWeight: 'normal',
    fontStyle: 'normal',
    color: '#000000',
    alignment: 'left',
    verticalAlignment: 'top'
  };

  private currentText: TextObject | null = null;
  private isEditing = false;
  private textInput: HTMLInputElement | null = null;

  protected onActivate(): void {
    document.body.style.cursor = 'text';
  }

  protected onDeactivate(): void {
    document.body.style.cursor = '';
    this.finishTextEditing();
  }

  public onMouseDown(point: Point, event: MouseEvent): void {
    // Check if clicking on existing text
    const existingText = this.findTextAtPoint(point);
    
    if (existingText && event.detail === 2) {
      // Double-click to edit existing text
      this.editText(existingText);
    } else if (!this.isEditing) {
      // Create new text
      this.createNewText(point);
    } else {
      // Finish current text editing
      this.finishTextEditing();
    }
  }

  public onMouseMove(point: Point, event: MouseEvent): void {
    this.state.currentPoint = point;
    
    // Update cursor based on what's under the mouse
    const textAtPoint = this.findTextAtPoint(point);
    if (textAtPoint) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'text';
    }
  }

  public onMouseUp(point: Point, event: MouseEvent): void {
    // Text tool doesn't need mouse up handling
  }

  public onDoubleClick(point: Point, event: MouseEvent): void {
    const existingText = this.findTextAtPoint(point);
    if (existingText) {
      this.editText(existingText);
    }
  }

  public onKeyDown(event: KeyboardEvent): void {
    if (this.isEditing && this.textInput) {
      switch (event.key) {
        case 'Enter':
          if (!event.shiftKey) {
            event.preventDefault();
            this.finishTextEditing();
          }
          break;
        
        case 'Escape':
          event.preventDefault();
          this.cancelTextEditing();
          break;
      }
    } else {
      // Handle text style shortcuts
      switch (event.key.toLowerCase()) {
        case 'b':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.toggleBold();
          }
          break;
        
        case 'i':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.toggleItalic();
          }
          break;
      }
    }
  }

  private createNewText(position: Point): void {
    const textId = this.generateTextId();
    
    this.currentText = {
      id: textId,
      text: '',
      position,
      style: { ...this.defaultStyle },
      bounds: { width: 100, height: 20 },
      rotation: 0,
      editable: true
    };

    this.startTextEditing(position);
  }

  private editText(textObject: TextObject): void {
    this.currentText = textObject;
    this.startTextEditing(textObject.position, textObject.text);
  }

  private startTextEditing(position: Point, initialText: string = ''): void {
    this.isEditing = true;
    
    // Create text input element
    this.textInput = document.createElement('input');
    this.textInput.type = 'text';
    this.textInput.value = initialText;
    this.textInput.style.position = 'absolute';
    this.textInput.style.left = `${position.x}px`;
    this.textInput.style.top = `${position.y}px`;
    this.textInput.style.zIndex = '1000';
    this.textInput.style.border = '1px solid #2563eb';
    this.textInput.style.background = 'white';
    this.textInput.style.fontFamily = this.defaultStyle.fontFamily;
    this.textInput.style.fontSize = `${this.defaultStyle.fontSize}px`;
    this.textInput.style.fontWeight = this.defaultStyle.fontWeight;
    this.textInput.style.fontStyle = this.defaultStyle.fontStyle;
    this.textInput.style.color = this.defaultStyle.color;
    
    // Add to DOM
    document.body.appendChild(this.textInput);
    
    // Focus and select
    this.textInput.focus();
    this.textInput.select();
    
    // Handle input events
    this.textInput.addEventListener('blur', () => {
      this.finishTextEditing();
    });
    
    this.textInput.addEventListener('keydown', (e) => {
      e.stopPropagation();
    });
  }

  private finishTextEditing(): void {
    if (!this.isEditing || !this.textInput || !this.currentText) return;
    
    const text = this.textInput.value.trim();
    
    if (text) {
      // Update text object
      this.currentText.text = text;
      this.currentText.bounds = this.calculateTextBounds(text, this.currentText.style);
      
      // Create or update the text object
      this.toolSystem?.createGeometry({
        ...this.currentText,
        type: 'text'
      });
    }
    
    this.cleanupTextInput();
  }

  private cancelTextEditing(): void {
    this.cleanupTextInput();
  }

  private cleanupTextInput(): void {
    if (this.textInput) {
      document.body.removeChild(this.textInput);
      this.textInput = null;
    }
    
    this.isEditing = false;
    this.currentText = null;
  }

  private findTextAtPoint(point: Point): TextObject | null {
    // This would integrate with the HitTestSystem
    // For now, return null as placeholder
    return null;
  }

  private calculateTextBounds(text: string, style: TextStyle): { width: number; height: number } {
    // Create temporary canvas to measure text
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return { width: text.length * 8, height: style.fontSize };
    }
    
    ctx.font = `${style.fontWeight} ${style.fontStyle} ${style.fontSize}px ${style.fontFamily}`;
    const metrics = ctx.measureText(text);
    
    return {
      width: metrics.width,
      height: style.fontSize * 1.2 // Add some line height
    };
  }

  private generateTextId(): string {
    return `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Text formatting methods
  private toggleBold(): void {
    if (this.currentText) {
      this.currentText.style.fontWeight = 
        this.currentText.style.fontWeight === 'bold' ? 'normal' : 'bold';
      this.updateTextStyle();
    } else {
      this.defaultStyle.fontWeight = 
        this.defaultStyle.fontWeight === 'bold' ? 'normal' : 'bold';
    }
  }

  private toggleItalic(): void {
    if (this.currentText) {
      this.currentText.style.fontStyle = 
        this.currentText.style.fontStyle === 'italic' ? 'normal' : 'italic';
      this.updateTextStyle();
    } else {
      this.defaultStyle.fontStyle = 
        this.defaultStyle.fontStyle === 'italic' ? 'normal' : 'italic';
    }
  }

  private updateTextStyle(): void {
    if (this.textInput && this.currentText) {
      this.textInput.style.fontWeight = this.currentText.style.fontWeight;
      this.textInput.style.fontStyle = this.currentText.style.fontStyle;
    }
  }

  public setTextStyle(style: Partial<TextStyle>): void {
    this.defaultStyle = { ...this.defaultStyle, ...style };
    
    if (this.currentText) {
      this.currentText.style = { ...this.currentText.style, ...style };
      this.updateTextStyle();
    }
  }

  public getTextStyle(): TextStyle {
    return { ...this.defaultStyle };
  }
}