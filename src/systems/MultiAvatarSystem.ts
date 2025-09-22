import { IWorld, addEntity, addComponent, defineQuery } from "bitecs";
import {
  Position,
  Avatar,
  RemoteAvatar,
  NetworkId,
  Renderable,
} from "../types/ecs";
import { RedisService } from "../services/RedisService";
import { RedisUserState } from "../types/redis";

export class MultiAvatarSystem {
  private redisService: RedisService;
  private avatarEntities: Map<string, number> = new Map();
  private lastSyncTime: number = 0;
  private syncInterval: number = 1000; // 1초마다 동기화
  private avatarQuery = defineQuery([Position, Avatar]);

  constructor(redisService: RedisService) {
    this.redisService = redisService;
  }

  async execute(world: IWorld, deltaTime: number): Promise<void> {
    const currentTime = Date.now();

    // 1초마다 Redis에서 유저 상태 동기화
    if (currentTime - this.lastSyncTime >= this.syncInterval) {
      await this.syncUsersFromRedis(world);
      this.lastSyncTime = currentTime;
    }

    // 로컬 아바타 위치를 Redis에 업데이트
    await this.updateLocalAvatarToRedis(world);
  }

  private async syncUsersFromRedis(world: IWorld): Promise<void> {
    try {
      const users = await this.redisService.getAllUsers();
      const currentUserId = this.redisService.getUserId();

      // 기존 원격 아바타들 중 더 이상 존재하지 않는 것들 제거
      const existingUserIds = new Set(users.keys());
      for (const [userId, entityId] of this.avatarEntities) {
        if (userId !== currentUserId && !existingUserIds.has(userId)) {
          this.removeAvatarEntity(world, userId, entityId);
        }
      }

      // 각 유저별 아바타 업데이트 또는 생성
      for (const [userId, state] of users) {
        // 자신의 아바타는 제외 (로컬에서 제어)
        if (userId === currentUserId) {
          continue;
        }

        let entityId = this.avatarEntities.get(userId);

        if (!entityId) {
          // 새 원격 아바타 엔티티 생성
          entityId = this.createRemoteAvatar(world, userId, state);
          this.avatarEntities.set(userId, entityId);
        } else {
          // 기존 아바타 위치 업데이트
          this.updateAvatarPosition(entityId, state);
        }
      }
    } catch (error) {
      console.error("Failed to sync users from Redis:", error);
    }
  }

  private createRemoteAvatar(
    world: IWorld,
    userId: string,
    state: RedisUserState
  ): number {
    const entity = addEntity(world);

    // 기본 컴포넌트 추가
    addComponent(world, Position, entity);
    addComponent(world, Avatar, entity);
    addComponent(world, RemoteAvatar, entity);
    addComponent(world, NetworkId, entity);
    addComponent(world, Renderable, entity);

    // 초기 상태 설정
    Position.x[entity] = state.x;
    Position.y[entity] = state.y;
    Avatar.id[entity] = state.avatarId;
    Avatar.currentDirection[entity] = state.direction;
    RemoteAvatar.isRemote[entity] = 1;
    NetworkId.userId[entity] = this.hashUserId(userId);

    console.log(
      `Created remote avatar for user ${userId} at (${state.x}, ${state.y})`
    );
    return entity;
  }

  private updateAvatarPosition(entityId: number, state: RedisUserState): void {
    Position.x[entityId] = state.x;
    Position.y[entityId] = state.y;
    Avatar.currentDirection[entityId] = state.direction;
    Avatar.id[entityId] = state.avatarId;
  }

  private removeAvatarEntity(
    world: IWorld,
    userId: string,
    entityId: number
  ): void {
    // BitECS에서는 명시적으로 엔티티를 제거하는 대신 컴포넌트를 제거하여 무효화
    // 실제 구현에서는 world.removeEntity(entityId) 같은 함수가 있을 수 있음
    this.avatarEntities.delete(userId);
    console.log(`Removed remote avatar for user ${userId}`);
  }

  private async updateLocalAvatarToRedis(world: IWorld): Promise<void> {
    try {
      // 로컬 아바타 (RemoteAvatar 컴포넌트가 없는 아바타) 찾기
      const avatarEntities = this.avatarQuery(world);

      for (const entity of avatarEntities) {
        // 원격 아바타가 아닌 경우만 Redis에 업데이트
        if (!RemoteAvatar.isRemote[entity]) {
          const x = Position.x[entity];
          const y = Position.y[entity];
          const direction = Avatar.currentDirection[entity];

          await this.redisService.updateUserPosition(x, y, direction);
          break; // 첫 번째 로컬 아바타만 처리
        }
      }
    } catch (error) {
      console.error("Failed to update local avatar to Redis:", error);
    }
  }

  private hashUserId(userId: string): number {
    // UUID를 32비트 해시로 변환 (NetworkId 컴포넌트용)
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32비트 정수로 변환
    }
    return Math.abs(hash);
  }

  getRemoteAvatarCount(): number {
    return this.avatarEntities.size;
  }

  getRemoteAvatarUserIds(): string[] {
    return Array.from(this.avatarEntities.keys());
  }

  cleanup(): void {
    this.avatarEntities.clear();
  }
}
