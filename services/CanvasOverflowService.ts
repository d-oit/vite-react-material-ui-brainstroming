export interface CanvasSize {
  width: number;
  height: number;
}

export interface CanvasElement {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OverflowResult {
  overflow: boolean;
  scroll: {
    x: number;
    y: number;
  };
  zoom: number;
}

export class CanvasOverflowService {
  private canvas: CanvasSize;
  private elements: CanvasElement[];
  private minZoom: number = 0.1;
  private maxZoom: number = 3.0;
  private currentZoom: number = 1.0;

  constructor(canvas: CanvasSize) {
    this.canvas = canvas;
    this.elements = [];
  }

  public updateElements(elements: CanvasElement[]): OverflowResult {
    this.elements = elements;
    return this.calculateOverflow();
  }

  public setZoom(zoom: number): OverflowResult {
    this.currentZoom = Math.min(Math.max(zoom, this.minZoom), this.maxZoom);
    return this.calculateOverflow();
  }

  private calculateOverflow(): OverflowResult {
    if (this.elements.length === 0) {
      return {
        overflow: false,
        scroll: { x: 0, y: 0 },
        zoom: this.currentZoom
      };
    }

    // Calculate content bounds considering zoom level
    const bounds = this.calculateContentBounds();
    const scaledBounds = {
      minX: bounds.minX * this.currentZoom,
      maxX: bounds.maxX * this.currentZoom,
      minY: bounds.minY * this.currentZoom,
      maxY: bounds.maxY * this.currentZoom
    };

    // Check for overflow
    const contentWidth = scaledBounds.maxX - scaledBounds.minX;
    const contentHeight = scaledBounds.maxY - scaledBounds.minY;
    const overflow = contentWidth > this.canvas.width || contentHeight > this.canvas.height;

    // Calculate scroll values if there's overflow
    const scroll = {
      x: overflow ? Math.max(0, -scaledBounds.minX) : 0,
      y: overflow ? Math.max(0, -scaledBounds.minY) : 0
    };

    return {
      overflow,
      scroll,
      zoom: this.currentZoom
    };
  }

  private calculateContentBounds() {
    const bounds = {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY
    };

    this.elements.forEach(element => {
      // Handle negative coordinates
      bounds.minX = Math.min(bounds.minX, element.x);
      bounds.maxX = Math.max(bounds.maxX, element.x + element.width);
      bounds.minY = Math.min(bounds.minY, element.y);
      bounds.maxY = Math.max(bounds.maxY, element.y + element.height);
    });

    // If no elements, return zero bounds
    if (bounds.minX === Number.POSITIVE_INFINITY) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    return bounds;
  }

  public getVisibleElements(): CanvasElement[] {
    const visibleArea = {
      x: -this.calculateOverflow().scroll.x / this.currentZoom,
      y: -this.calculateOverflow().scroll.y / this.currentZoom,
      width: this.canvas.width / this.currentZoom,
      height: this.canvas.height / this.currentZoom
    };

    return this.elements.filter(element => this.isElementVisible(element, visibleArea));
  }

  private isElementVisible(element: CanvasElement, visibleArea: CanvasElement): boolean {
    return !(element.x + element.width < visibleArea.x ||
             element.x > visibleArea.x + visibleArea.width ||
             element.y + element.height < visibleArea.y ||
             element.y > visibleArea.y + visibleArea.height);
  }
}