/**
 * Layer System for Professional SLD Canvas
 * 
 * Manages drawing layers with visibility, locking, and z-order control
 */

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  zIndex: number;
  color?: string;
  objects: Set<string>; // Object IDs in this layer
}

export interface LayerObject {
  id: string;
  layerId: string;
  type: 'component' | 'connection' | 'label' | 'annotation' | 'grid';
  data: any;
}

export class LayerSystem {
  private layers: Map<string, Layer> = new Map();
  private objects: Map<string, LayerObject> = new Map();
  private layerOrder: string[] = [];
  private activeLayerId: string | null = null;
  
  // Event callbacks
  private onLayerChange?: (layers: Layer[]) => void;
  private onActiveLayerChange?: (layerId: string | null) => void;

  constructor() {
    // Create default layers
    this.createDefaultLayers();
  }

  private createDefaultLayers(): void {
    const defaultLayers = [
      { id: 'grid', name: 'Grid', visible: true, locked: false, opacity: 0.3, zIndex: 0 },
      { id: 'connections', name: 'Connections', visible: true, locked: false, opacity: 1.0, zIndex: 10 },
      { id: 'components', name: 'Components', visible: true, locked: false, opacity: 1.0, zIndex: 20 },
      { id: 'labels', name: 'Labels', visible: true, locked: false, opacity: 1.0, zIndex: 30 },
      { id: 'annotations', name: 'Annotations', visible: true, locked: false, opacity: 1.0, zIndex: 40 },
      { id: 'dimensions', name: 'Dimensions', visible: true, locked: false, opacity: 1.0, zIndex: 50 }
    ];

    defaultLayers.forEach(layerData => {
      const layer: Layer = {
        ...layerData,
        objects: new Set()
      };
      this.layers.set(layer.id, layer);
      this.layerOrder.push(layer.id);
    });

    // Set components layer as active by default
    this.activeLayerId = 'components';
  }

  public setLayerChangeCallback(callback: (layers: Layer[]) => void): void {
    this.onLayerChange = callback;
  }

  public setActiveLayerChangeCallback(callback: (layerId: string | null) => void): void {
    this.onActiveLayerChange = callback;
  }

  public createLayer(
    id: string,
    name: string,
    options: Partial<Omit<Layer, 'id' | 'name' | 'objects'>> = {}
  ): Layer {
    if (this.layers.has(id)) {
      throw new Error(`Layer with id '${id}' already exists`);
    }

    const layer: Layer = {
      id,
      name,
      visible: true,
      locked: false,
      opacity: 1.0,
      zIndex: this.getNextZIndex(),
      objects: new Set(),
      ...options
    };

    this.layers.set(id, layer);
    this.layerOrder.push(id);
    this.sortLayersByZIndex();
    this.notifyLayerChange();

    return layer;
  }

  public deleteLayer(id: string): boolean {
    if (!this.layers.has(id)) {
      return false;
    }

    const layer = this.layers.get(id)!;
    
    // Move objects to default layer or delete them
    const defaultLayerId = 'components';
    if (layer.objects.size > 0 && this.layers.has(defaultLayerId)) {
      const defaultLayer = this.layers.get(defaultLayerId)!;
      layer.objects.forEach(objectId => {
        const obj = this.objects.get(objectId);
        if (obj) {
          obj.layerId = defaultLayerId;
          defaultLayer.objects.add(objectId);
        }
      });
    } else {
      // Delete objects if no default layer
      layer.objects.forEach(objectId => {
        this.objects.delete(objectId);
      });
    }

    this.layers.delete(id);
    this.layerOrder = this.layerOrder.filter(layerId => layerId !== id);

    // Update active layer if necessary
    if (this.activeLayerId === id) {
      this.activeLayerId = this.layerOrder.length > 0 ? this.layerOrder[0] : null;
      this.onActiveLayerChange?.(this.activeLayerId);
    }

    this.notifyLayerChange();
    return true;
  }

  public getLayer(id: string): Layer | undefined {
    return this.layers.get(id);
  }

  public getAllLayers(): Layer[] {
    return this.layerOrder.map(id => this.layers.get(id)!);
  }

  public getVisibleLayers(): Layer[] {
    return this.getAllLayers().filter(layer => layer.visible);
  }

  public updateLayer(id: string, updates: Partial<Omit<Layer, 'id' | 'objects'>>): boolean {
    const layer = this.layers.get(id);
    if (!layer) {
      return false;
    }

    const updatedLayer = { ...layer, ...updates };
    this.layers.set(id, updatedLayer);

    // Re-sort if z-index changed
    if (updates.zIndex !== undefined) {
      this.sortLayersByZIndex();
    }

    this.notifyLayerChange();
    return true;
  }

  public setLayerVisibility(id: string, visible: boolean): boolean {
    return this.updateLayer(id, { visible });
  }

  public setLayerLocked(id: string, locked: boolean): boolean {
    return this.updateLayer(id, { locked });
  }

  public setLayerOpacity(id: string, opacity: number): boolean {
    const clampedOpacity = Math.max(0, Math.min(1, opacity));
    return this.updateLayer(id, { opacity: clampedOpacity });
  }

  public moveLayerUp(id: string): boolean {
    const layer = this.layers.get(id);
    if (!layer) {
      return false;
    }

    const currentIndex = this.layerOrder.indexOf(id);
    if (currentIndex === -1 || currentIndex === this.layerOrder.length - 1) {
      return false;
    }

    // Swap with next layer
    const nextLayerId = this.layerOrder[currentIndex + 1];
    const nextLayer = this.layers.get(nextLayerId)!;

    const tempZIndex = layer.zIndex;
    layer.zIndex = nextLayer.zIndex;
    nextLayer.zIndex = tempZIndex;

    this.sortLayersByZIndex();
    this.notifyLayerChange();
    return true;
  }

  public moveLayerDown(id: string): boolean {
    const layer = this.layers.get(id);
    if (!layer) {
      return false;
    }

    const currentIndex = this.layerOrder.indexOf(id);
    if (currentIndex === -1 || currentIndex === 0) {
      return false;
    }

    // Swap with previous layer
    const prevLayerId = this.layerOrder[currentIndex - 1];
    const prevLayer = this.layers.get(prevLayerId)!;

    const tempZIndex = layer.zIndex;
    layer.zIndex = prevLayer.zIndex;
    prevLayer.zIndex = tempZIndex;

    this.sortLayersByZIndex();
    this.notifyLayerChange();
    return true;
  }

  public setActiveLayer(id: string | null): boolean {
    if (id !== null && !this.layers.has(id)) {
      return false;
    }

    this.activeLayerId = id;
    this.onActiveLayerChange?.(id);
    return true;
  }

  public getActiveLayer(): Layer | null {
    return this.activeLayerId ? this.layers.get(this.activeLayerId) || null : null;
  }

  public addObject(object: LayerObject): boolean {
    const layer = this.layers.get(object.layerId);
    if (!layer) {
      return false;
    }

    if (layer.locked) {
      return false;
    }

    this.objects.set(object.id, object);
    layer.objects.add(object.id);
    return true;
  }

  public removeObject(objectId: string): boolean {
    const object = this.objects.get(objectId);
    if (!object) {
      return false;
    }

    const layer = this.layers.get(object.layerId);
    if (layer) {
      layer.objects.delete(objectId);
    }

    this.objects.delete(objectId);
    return true;
  }

  public moveObjectToLayer(objectId: string, targetLayerId: string): boolean {
    const object = this.objects.get(objectId);
    const targetLayer = this.layers.get(targetLayerId);

    if (!object || !targetLayer || targetLayer.locked) {
      return false;
    }

    // Remove from current layer
    const currentLayer = this.layers.get(object.layerId);
    if (currentLayer) {
      currentLayer.objects.delete(objectId);
    }

    // Add to target layer
    object.layerId = targetLayerId;
    targetLayer.objects.add(objectId);

    return true;
  }

  public getObject(objectId: string): LayerObject | undefined {
    return this.objects.get(objectId);
  }

  public getObjectsInLayer(layerId: string): LayerObject[] {
    const layer = this.layers.get(layerId);
    if (!layer) {
      return [];
    }

    return Array.from(layer.objects)
      .map(id => this.objects.get(id))
      .filter((obj): obj is LayerObject => obj !== undefined);
  }

  public getVisibleObjects(): LayerObject[] {
    const visibleObjects: LayerObject[] = [];
    
    // Get objects from visible layers in z-order
    for (const layerId of this.layerOrder) {
      const layer = this.layers.get(layerId)!;
      if (layer.visible) {
        const layerObjects = this.getObjectsInLayer(layerId);
        visibleObjects.push(...layerObjects);
      }
    }

    return visibleObjects;
  }

  public getObjectLayer(objectId: string): Layer | undefined {
    const object = this.objects.get(objectId);
    return object ? this.layers.get(object.layerId) : undefined;
  }

  public isObjectVisible(objectId: string): boolean {
    const layer = this.getObjectLayer(objectId);
    return layer ? layer.visible : false;
  }

  public isObjectLocked(objectId: string): boolean {
    const layer = this.getObjectLayer(objectId);
    return layer ? layer.locked : false;
  }

  public getObjectOpacity(objectId: string): number {
    const layer = this.getObjectLayer(objectId);
    return layer ? layer.opacity : 1.0;
  }

  private getNextZIndex(): number {
    let maxZIndex = 0;
    for (const layer of this.layers.values()) {
      maxZIndex = Math.max(maxZIndex, layer.zIndex);
    }
    return maxZIndex + 10;
  }

  private sortLayersByZIndex(): void {
    this.layerOrder.sort((a, b) => {
      const layerA = this.layers.get(a)!;
      const layerB = this.layers.get(b)!;
      return layerA.zIndex - layerB.zIndex;
    });
  }

  private notifyLayerChange(): void {
    this.onLayerChange?.(this.getAllLayers());
  }

  public exportLayerConfiguration(): any {
    return {
      layers: Array.from(this.layers.entries()).map(([id, layer]) => ({
        id,
        name: layer.name,
        visible: layer.visible,
        locked: layer.locked,
        opacity: layer.opacity,
        zIndex: layer.zIndex,
        color: layer.color
      })),
      layerOrder: [...this.layerOrder],
      activeLayerId: this.activeLayerId
    };
  }

  public importLayerConfiguration(config: any): void {
    // Clear existing layers (except objects)
    this.layers.clear();
    this.layerOrder = [];

    // Import layers
    if (config.layers) {
      config.layers.forEach((layerData: any) => {
        const layer: Layer = {
          ...layerData,
          objects: new Set()
        };
        this.layers.set(layer.id, layer);
      });
    }

    // Import layer order
    if (config.layerOrder) {
      this.layerOrder = [...config.layerOrder];
    }

    // Import active layer
    if (config.activeLayerId) {
      this.activeLayerId = config.activeLayerId;
    }

    // Reassign objects to layers
    for (const object of this.objects.values()) {
      const layer = this.layers.get(object.layerId);
      if (layer) {
        layer.objects.add(object.id);
      }
    }

    this.notifyLayerChange();
    this.onActiveLayerChange?.(this.activeLayerId);
  }

  public dispose(): void {
    this.layers.clear();
    this.objects.clear();
    this.layerOrder = [];
    this.activeLayerId = null;
  }
}