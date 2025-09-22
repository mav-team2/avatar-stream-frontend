import { IWorld, defineQuery } from 'bitecs';
import { Position, Avatar, Movement, EventQueue } from '../types/ecs';
import { AvatarEvent, AvatarEventType } from '../types/redis';
import { AvatarDirection } from '../types/avatar';
import { RedisService } from '../services/RedisService';

interface ActiveEvent {
  event: AvatarEvent;
  startTime: number;
  duration: number;
  startX: number;
  startY: number;
  targetX?: number;
  targetY?: number;
}

export class EventSystem {
  private redisService: RedisService;
  private eventQueues: Map<number, AvatarEvent[]> = new Map();
  private activeEvents: Map<number, ActiveEvent> = new Map();
  private avatarQuery = defineQuery([Position, Avatar]);

  constructor(redisService: RedisService) {
    this.redisService = redisService;
  }

  async initialize(): Promise<void> {
    // Redis 이벤트 구독
    await this.redisService.subscribeToEvents((event: AvatarEvent) => {
      this.handleIncomingEvent(event);
    });
  }

  private handleIncomingEvent(event: AvatarEvent): void {
    // 현재 사용자의 이벤트인지 확인
    const currentUserId = this.redisService.getUserId();
    if (event.userId !== currentUserId) {
      return; // 다른 사용자의 이벤트는 무시 (이미 MultiAvatarSystem에서 처리됨)
    }

    // 이벤트를 큐에 추가 (로컬 아바타용)
    // 실제로는 엔티티 ID를 찾아야 하지만, 여기서는 단순화
    console.log('Received event for local avatar:', event);
  }

  addEvent(entity: number, event: AvatarEvent): void {
    if (!this.eventQueues.has(entity)) {
      this.eventQueues.set(entity, []);
    }
    this.eventQueues.get(entity)!.push(event);
  }

  execute(world: IWorld, deltaTime: number): void {
    const entities = this.avatarQuery(world);

    for (const entity of entities) {
      // 활성 이벤트 처리
      this.processActiveEvent(entity, deltaTime);

      // 새 이벤트 처리
      this.processEventQueue(entity);
    }
  }

  private processActiveEvent(entity: number, deltaTime: number): void {
    const activeEvent = this.activeEvents.get(entity);
    if (!activeEvent) return;

    const elapsed = Date.now() - activeEvent.startTime;
    const progress = Math.min(elapsed / activeEvent.duration, 1.0);

    switch (activeEvent.event.eventType) {
      case AvatarEventType.MOVE:
        this.processMoveEvent(entity, activeEvent, progress);
        break;
      case AvatarEventType.JUMP:
        this.processJumpEvent(entity, activeEvent, progress);
        break;
    }

    // 이벤트 완료 확인
    if (progress >= 1.0) {
      this.completeEvent(entity);
    }
  }

  private processMoveEvent(entity: number, activeEvent: ActiveEvent, progress: number): void {
    if (!activeEvent.targetX || !activeEvent.targetY) return;

    // 선형 보간으로 이동
    const currentX = activeEvent.startX + (activeEvent.targetX - activeEvent.startX) * progress;
    const currentY = activeEvent.startY + (activeEvent.targetY - activeEvent.startY) * progress;

    Position.x[entity] = currentX;
    Position.y[entity] = currentY;

    // 방향 설정
    const direction = this.getDirectionFromMovement(
      activeEvent.targetX - activeEvent.startX,
      activeEvent.targetY - activeEvent.startY
    );
    Avatar.currentDirection[entity] = direction;
  }

  private processJumpEvent(entity: number, activeEvent: ActiveEvent, progress: number): void {
    // 점프 애니메이션 (포물선 궤적)
    const jumpHeight = 50; // 점프 높이
    const baseY = activeEvent.startY;

    // 포물선 계산 (y = -4h * (x - 0.5)^2 + h)
    const jumpOffset = -4 * jumpHeight * Math.pow(progress - 0.5, 2) + jumpHeight;

    Position.x[entity] = activeEvent.startX;
    Position.y[entity] = baseY - jumpOffset; // Y축이 아래로 증가한다고 가정
  }

  private processEventQueue(entity: number): void {
    // 활성 이벤트가 있으면 새 이벤트 처리하지 않음
    if (this.activeEvents.has(entity)) return;

    const queue = this.eventQueues.get(entity);
    if (!queue || queue.length === 0) return;

    const event = queue.shift()!;
    this.startEvent(entity, event);
  }

  private startEvent(entity: number, event: AvatarEvent): void {
    const currentX = Position.x[entity];
    const currentY = Position.y[entity];

    let duration = 1000; // 기본 1초
    let targetX = currentX;
    let targetY = currentY;

    switch (event.eventType) {
      case AvatarEventType.MOVE:
        duration = 500; // 이동은 0.5초
        const moveDistance = 50; // 픽셀

        switch (event.payload.direction) {
          case 'UP':
            targetY = currentY - moveDistance;
            break;
          case 'DOWN':
            targetY = currentY + moveDistance;
            break;
          case 'LEFT':
            targetX = currentX - moveDistance;
            break;
          case 'RIGHT':
            targetX = currentX + moveDistance;
            break;
        }
        break;

      case AvatarEventType.JUMP:
        duration = event.payload.duration || 800; // 점프 지속시간
        break;
    }

    const activeEvent: ActiveEvent = {
      event,
      startTime: Date.now(),
      duration,
      startX: currentX,
      startY: currentY,
      targetX,
      targetY
    };

    this.activeEvents.set(entity, activeEvent);
    console.log(`Started ${event.eventType} event for entity ${entity}`);
  }

  private completeEvent(entity: number): void {
    const activeEvent = this.activeEvents.get(entity);
    if (!activeEvent) return;

    // 최종 위치 설정
    if (activeEvent.targetX !== undefined && activeEvent.targetY !== undefined) {
      Position.x[entity] = activeEvent.targetX;
      Position.y[entity] = activeEvent.targetY;
    }

    this.activeEvents.delete(entity);
    console.log(`Completed ${activeEvent.event.eventType} event for entity ${entity}`);
  }

  private getDirectionFromMovement(deltaX: number, deltaY: number): AvatarDirection {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? AvatarDirection.RIGHT : AvatarDirection.LEFT;
    } else if (deltaY !== 0) {
      return deltaY > 0 ? AvatarDirection.FRONT : AvatarDirection.BACK;
    }
    return AvatarDirection.CENTER;
  }

  // 외부에서 이벤트 추가용
  addMoveEvent(entity: number, direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): void {
    const event: AvatarEvent = {
      eventId: `move_${Date.now()}_${Math.random()}`,
      userId: this.redisService.getUserId(),
      eventType: AvatarEventType.MOVE,
      timestamp: Date.now(),
      payload: { direction }
    };

    this.addEvent(entity, event);
  }

  addJumpEvent(entity: number, duration: number = 800): void {
    const event: AvatarEvent = {
      eventId: `jump_${Date.now()}_${Math.random()}`,
      userId: this.redisService.getUserId(),
      eventType: AvatarEventType.JUMP,
      timestamp: Date.now(),
      payload: { duration }
    };

    this.addEvent(entity, event);
  }

  getActiveEventCount(): number {
    return this.activeEvents.size;
  }

  getQueuedEventCount(): number {
    let total = 0;
    for (const queue of this.eventQueues.values()) {
      total += queue.length;
    }
    return total;
  }

  cleanup(): void {
    this.eventQueues.clear();
    this.activeEvents.clear();
  }
}