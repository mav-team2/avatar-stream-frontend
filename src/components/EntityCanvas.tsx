import React, { useRef, useEffect, useCallback } from 'react';
import { createWorld, addEntity, addComponent, IWorld } from 'bitecs';
import { Position, Scale, Rotation, Sprite, Renderable } from '../types/ecs';
import { RenderSystem } from '../systems/RenderSystem';

export interface EntityData {
  x: number;
  y: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  imageId: number;
  width: number;
  height: number;
  sourceX?: number;
  sourceY?: number;
  sourceWidth?: number;
  sourceHeight?: number;
}

export interface EntityCanvasProps {
  entities: EntityData[];
  images: Map<number, HTMLImageElement>;
  className?: string;
  style?: React.CSSProperties;
}

export const EntityCanvas: React.FC<EntityCanvasProps> = ({
  entities,
  images,
  className,
  style
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<IWorld | null>(null);
  const renderSystemRef = useRef<RenderSystem | null>(null);
  const entitiesRef = useRef<number[]>([]);

  const initializeWorld = useCallback(() => {
    if (!canvasRef.current) return;

    worldRef.current = createWorld();
    renderSystemRef.current = new RenderSystem(canvasRef.current);

    images.forEach((image, id) => {
      renderSystemRef.current!.addImageAsset(id, image);
    });
  }, [images]);

  const createEntity = useCallback((entityData: EntityData): number => {
    if (!worldRef.current) return -1;

    const eid = addEntity(worldRef.current);

    addComponent(worldRef.current, Position, eid);
    Position.x[eid] = entityData.x;
    Position.y[eid] = entityData.y;

    addComponent(worldRef.current, Scale, eid);
    Scale.x[eid] = entityData.scaleX || 1;
    Scale.y[eid] = entityData.scaleY || 1;

    addComponent(worldRef.current, Rotation, eid);
    Rotation.angle[eid] = entityData.rotation || 0;

    addComponent(worldRef.current, Sprite, eid);
    Sprite.imageId[eid] = entityData.imageId;
    Sprite.width[eid] = entityData.width;
    Sprite.height[eid] = entityData.height;
    Sprite.sourceX[eid] = entityData.sourceX || 0;
    Sprite.sourceY[eid] = entityData.sourceY || 0;
    Sprite.sourceWidth[eid] = entityData.sourceWidth || 0;
    Sprite.sourceHeight[eid] = entityData.sourceHeight || 0;

    addComponent(worldRef.current, Renderable, eid);

    return eid;
  }, []);

  const updateEntities = useCallback(() => {
    if (!worldRef.current || !renderSystemRef.current) return;

    // Clear previous entities - in a real implementation you'd want more sophisticated entity management
    entitiesRef.current = [];

    entitiesRef.current = entities.map(createEntity).filter(eid => eid !== -1);
  }, [entities, createEntity]);

  const render = useCallback(() => {
    if (!worldRef.current || !renderSystemRef.current) return;
    renderSystemRef.current.execute(worldRef.current);
  }, []);

  const animate = useCallback(() => {
    render();
    requestAnimationFrame(animate);
  }, [render]);

  useEffect(() => {
    initializeWorld();
    return () => {
      worldRef.current = null;
      renderSystemRef.current = null;
      entitiesRef.current = [];
    };
  }, [initializeWorld]);

  useEffect(() => {
    updateEntities();
  }, [updateEntities]);

  useEffect(() => {
    if (renderSystemRef.current) {
      images.forEach((image, id) => {
        renderSystemRef.current!.addImageAsset(id, image);
      });
    }
  }, [images]);

  useEffect(() => {
    const animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        ...style
      }}
    />
  );
};