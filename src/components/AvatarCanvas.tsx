import React, { useRef, useEffect, useCallback } from 'react';
import { createWorld, addEntity, addComponent, IWorld } from 'bitecs';
import { Position, Scale, Rotation, Avatar, Movement, Input, Renderable, EventQueue } from '../types/ecs';
import { RenderSystem } from '../systems/RenderSystem';
import { AvatarSystem } from '../systems/AvatarSystem';
import { InputSystem } from '../systems/InputSystem';
import { MultiAvatarSystem } from '../systems/MultiAvatarSystem';
import { EventSystem } from '../systems/EventSystem';
import { RedisService } from '../services/RedisService';
import { AvatarDirection } from '../types/avatar';
import { useAvatarAssets } from '../hooks/useAvatarAssets';

export interface AvatarCanvasProps {
  avatarId: number;
  initialX?: number;
  initialY?: number;
  moveSpeed?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const AvatarCanvas: React.FC<AvatarCanvasProps> = ({
  avatarId,
  initialX = 400,
  initialY = 300,
  moveSpeed = 200,
  className,
  style
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<IWorld | null>(null);
  const renderSystemRef = useRef<RenderSystem | null>(null);
  const avatarSystemRef = useRef<AvatarSystem | null>(null);
  const inputSystemRef = useRef<InputSystem | null>(null);
  const multiAvatarSystemRef = useRef<MultiAvatarSystem | null>(null);
  const eventSystemRef = useRef<EventSystem | null>(null);
  const redisServiceRef = useRef<RedisService | null>(null);
  const avatarEntityRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const { images, loading, error } = useAvatarAssets(avatarId);

  const initializeWorld = useCallback(async () => {
    if (!canvasRef.current || loading || images.size === 0) return;

    worldRef.current = createWorld();
    renderSystemRef.current = new RenderSystem(canvasRef.current);
    avatarSystemRef.current = new AvatarSystem();
    inputSystemRef.current = new InputSystem();

    // Redis 서비스 초기화
    redisServiceRef.current = new RedisService();
    try {
      await redisServiceRef.current.connect();
      console.log('Connected to Redis successfully');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      // Redis 연결 실패 시에도 로컬 게임은 계속 진행
    }

    // 멀티 아바타 및 이벤트 시스템 초기화
    if (redisServiceRef.current) {
      multiAvatarSystemRef.current = new MultiAvatarSystem(redisServiceRef.current);
      eventSystemRef.current = new EventSystem(redisServiceRef.current);
      await eventSystemRef.current.initialize();
    }

    // 아바타 이미지 에셋 추가
    images.forEach((image, key) => {
      const [avatarIdStr, directionStr] = key.split('_');
      const direction = parseInt(directionStr) as AvatarDirection;
      renderSystemRef.current!.addAvatarAsset(parseInt(avatarIdStr), direction, image);
    });

    // 아바타 엔티티 생성
    const avatarEntity = addEntity(worldRef.current);

    addComponent(worldRef.current, Position, avatarEntity);
    Position.x[avatarEntity] = initialX;
    Position.y[avatarEntity] = initialY;

    addComponent(worldRef.current, Scale, avatarEntity);
    Scale.x[avatarEntity] = 1;
    Scale.y[avatarEntity] = 1;

    addComponent(worldRef.current, Rotation, avatarEntity);
    Rotation.angle[avatarEntity] = 0;

    addComponent(worldRef.current, Avatar, avatarEntity);
    Avatar.id[avatarEntity] = avatarId;
    Avatar.currentDirection[avatarEntity] = AvatarDirection.CENTER;

    addComponent(worldRef.current, Movement, avatarEntity);
    Movement.velocity[avatarEntity] = moveSpeed;
    Movement.targetX[avatarEntity] = initialX;
    Movement.targetY[avatarEntity] = initialY;
    Movement.isMoving[avatarEntity] = 0;

    addComponent(worldRef.current, Input, avatarEntity);
    Input.up[avatarEntity] = 0;
    Input.down[avatarEntity] = 0;
    Input.left[avatarEntity] = 0;
    Input.right[avatarEntity] = 0;

    addComponent(worldRef.current, EventQueue, avatarEntity);
    addComponent(worldRef.current, Renderable, avatarEntity);

    avatarEntityRef.current = avatarEntity;
  }, [avatarId, initialX, initialY, moveSpeed, images, loading]);

  const gameLoop = useCallback(async (currentTime: number) => {
    if (!worldRef.current || !renderSystemRef.current || !avatarSystemRef.current || !inputSystemRef.current) {
      return;
    }

    const deltaTime = (currentTime - lastTimeRef.current) / 1000;
    lastTimeRef.current = currentTime;

    // 시스템 실행
    inputSystemRef.current.execute(worldRef.current);
    avatarSystemRef.current.execute(worldRef.current, deltaTime);

    // Redis 연동 시스템 실행
    if (multiAvatarSystemRef.current) {
      await multiAvatarSystemRef.current.execute(worldRef.current, deltaTime);
    }

    if (eventSystemRef.current) {
      eventSystemRef.current.execute(worldRef.current, deltaTime);
    }

    renderSystemRef.current.execute(worldRef.current);

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  const startGameLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const cleanup = useCallback(async () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (inputSystemRef.current) {
      inputSystemRef.current.destroy();
    }
    if (multiAvatarSystemRef.current) {
      multiAvatarSystemRef.current.cleanup();
    }
    if (eventSystemRef.current) {
      eventSystemRef.current.cleanup();
    }
    if (redisServiceRef.current) {
      await redisServiceRef.current.disconnect();
    }
    worldRef.current = null;
    renderSystemRef.current = null;
    avatarSystemRef.current = null;
    inputSystemRef.current = null;
    multiAvatarSystemRef.current = null;
    eventSystemRef.current = null;
    redisServiceRef.current = null;
    avatarEntityRef.current = null;
  }, []);

  useEffect(() => {
    const init = async () => {
      await initializeWorld();
    };
    init();
  }, [initializeWorld]);

  useEffect(() => {
    if (worldRef.current && !loading && images.size > 0) {
      startGameLoop();
    }

    return cleanup;
  }, [startGameLoop, cleanup, loading, images.size]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        ...style
      }}>
        Loading avatar...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        color: 'red',
        ...style
      }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          pointerEvents: 'none'
        }}
      />
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        color: 'white',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '14px',
        fontFamily: 'monospace'
      }}>
        Multi-Avatar Canvas (Redis Connected)
        <br />Use WASD or Arrow Keys to move
        <br />Press Space to jump
      </div>

      <div style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        color: 'white',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        Connected Users: {multiAvatarSystemRef.current?.getRemoteAvatarCount() || 0}
        <br />Events: {eventSystemRef.current?.getQueuedEventCount() || 0} queued, {eventSystemRef.current?.getActiveEventCount() || 0} active
      </div>
    </div>
  );
};