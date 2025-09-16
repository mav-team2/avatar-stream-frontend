import { defineQuery, IWorld } from 'bitecs';
import { Position, Scale, Rotation, Sprite, Renderable } from '../types/ecs';

export interface ImageAsset {
  id: number;
  image: HTMLImageElement;
}

export class RenderSystem {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private query = defineQuery([Position, Sprite, Renderable]);
  private imageAssets = new Map<number, HTMLImageElement>();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.context = context;

    this.setupCanvas();
  }

  private setupCanvas() {
    const updateCanvasSize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
  }

  addImageAsset(id: number, image: HTMLImageElement) {
    this.imageAssets.set(id, image);
  }

  removeImageAsset(id: number) {
    this.imageAssets.delete(id);
  }

  execute(world: IWorld) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const entities = this.query(world);

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      this.renderEntity(eid);
    }
  }

  private renderEntity(eid: number) {
    const image = this.imageAssets.get(Sprite.imageId[eid]);
    if (!image) return;

    this.context.save();

    const x = Position.x[eid];
    const y = Position.y[eid];
    const scaleX = Scale.x[eid] || 1;
    const scaleY = Scale.y[eid] || 1;
    const rotation = Rotation.angle[eid] || 0;

    this.context.translate(x, y);
    this.context.rotate(rotation);
    this.context.scale(scaleX, scaleY);

    const width = Sprite.width[eid];
    const height = Sprite.height[eid];
    const sourceX = Sprite.sourceX[eid] || 0;
    const sourceY = Sprite.sourceY[eid] || 0;
    const sourceWidth = Sprite.sourceWidth[eid] || image.width;
    const sourceHeight = Sprite.sourceHeight[eid] || image.height;

    this.context.drawImage(
      image,
      sourceX, sourceY, sourceWidth, sourceHeight,
      -width / 2, -height / 2, width, height
    );

    this.context.restore();
  }
}