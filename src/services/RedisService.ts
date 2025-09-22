import { createClient, RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { RedisUserState, AvatarEvent, RedisConfig } from '../types/redis';

export class RedisService {
  private client: RedisClientType;
  private subscriber: RedisClientType | null = null;
  private userId: string;
  private isConnected: boolean = false;

  constructor(config: RedisConfig = { url: 'redis://localhost:6379' }) {
    this.client = createClient({
      url: config.url,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
      },
    });
    this.userId = uuidv4();

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });

    this.client.on('disconnect', () => {
      console.log('Redis Client Disconnected');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.isConnected = true;
      await this.joinUser();
      console.log(`User ${this.userId} connected to Redis`);
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.leaveUser();
      }

      if (this.subscriber) {
        await this.subscriber.disconnect();
        this.subscriber = null;
      }

      await this.client.disconnect();
      this.isConnected = false;
      console.log(`User ${this.userId} disconnected from Redis`);
    } catch (error) {
      console.error('Failed to disconnect from Redis:', error);
    }
  }

  private async joinUser(): Promise<void> {
    if (!this.isConnected) return;

    try {
      // 접속 유저 등록
      await this.client.sAdd('users:online', this.userId);

      // 초기 위치 설정
      await this.client.hSet(`user:${this.userId}:state`, {
        x: '400',
        y: '300',
        direction: '0',
        avatarId: '1',
        lastSeen: Date.now().toString()
      });

      // TTL 설정 (30분)
      await this.client.expire(`user:${this.userId}:state`, 1800);
    } catch (error) {
      console.error('Failed to join user:', error);
      throw error;
    }
  }

  private async leaveUser(): Promise<void> {
    if (!this.isConnected) return;

    try {
      // 접속 유저 목록에서 제거
      await this.client.sRem('users:online', this.userId);

      // 유저 상태 삭제
      await this.client.del(`user:${this.userId}:state`);

      // 이벤트 큐 삭제
      await this.client.del(`user:${this.userId}:events`);
    } catch (error) {
      console.error('Failed to leave user:', error);
    }
  }

  async subscribeToEvents(callback: (event: AvatarEvent) => void): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      this.subscriber = this.client.duplicate();
      await this.subscriber.connect();

      await this.subscriber.subscribe('channel:avatar:events', (message) => {
        try {
          const event = JSON.parse(message) as AvatarEvent;
          callback(event);
        } catch (error) {
          console.error('Failed to parse event:', error);
        }
      });

      console.log('Subscribed to avatar events');
    } catch (error) {
      console.error('Failed to subscribe to events:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<Map<string, RedisUserState>> {
    if (!this.isConnected) {
      return new Map();
    }

    try {
      const userIds = await this.client.sMembers('users:online');
      const users = new Map<string, RedisUserState>();

      for (const userId of userIds) {
        const state = await this.client.hGetAll(`user:${userId}:state`);
        if (state.x && state.y) {
          users.set(userId, {
            x: parseInt(state.x),
            y: parseInt(state.y),
            direction: parseInt(state.direction),
            avatarId: parseInt(state.avatarId),
            lastSeen: parseInt(state.lastSeen)
          });
        }
      }

      return users;
    } catch (error) {
      console.error('Failed to get all users:', error);
      return new Map();
    }
  }

  async updateUserPosition(x: number, y: number, direction: number): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.hSet(`user:${this.userId}:state`, {
        x: x.toString(),
        y: y.toString(),
        direction: direction.toString(),
        lastSeen: Date.now().toString()
      });

      // TTL 갱신
      await this.client.expire(`user:${this.userId}:state`, 1800);
    } catch (error) {
      console.error('Failed to update user position:', error);
    }
  }

  async getEventQueue(userId?: string): Promise<AvatarEvent[]> {
    const targetUserId = userId || this.userId;

    if (!this.isConnected) {
      return [];
    }

    try {
      const events = await this.client.lRange(`user:${targetUserId}:events`, 0, -1);
      return events.map(eventStr => JSON.parse(eventStr) as AvatarEvent);
    } catch (error) {
      console.error('Failed to get event queue:', error);
      return [];
    }
  }

  async popEvent(userId?: string): Promise<AvatarEvent | null> {
    const targetUserId = userId || this.userId;

    if (!this.isConnected) {
      return null;
    }

    try {
      const eventStr = await this.client.lPop(`user:${targetUserId}:events`);
      return eventStr ? JSON.parse(eventStr) as AvatarEvent : null;
    } catch (error) {
      console.error('Failed to pop event:', error);
      return null;
    }
  }

  getUserId(): string {
    return this.userId;
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }

  async cleanup(): Promise<void> {
    try {
      // 비활성 유저 정리 (5분 이상 업데이트 없음)
      const cutoffTime = Date.now() - 5 * 60 * 1000;
      const userIds = await this.client.sMembers('users:online');

      for (const userId of userIds) {
        const state = await this.client.hGetAll(`user:${userId}:state`);
        if (state.lastSeen && parseInt(state.lastSeen) < cutoffTime) {
          await this.client.sRem('users:online', userId);
          await this.client.del(`user:${userId}:state`);
          await this.client.del(`user:${userId}:events`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup inactive users:', error);
    }
  }
}