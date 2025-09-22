export interface RedisUserState {
  x: number;
  y: number;
  direction: number;
  avatarId: number;
  lastSeen: number;
}

export enum AvatarEventType {
  MOVE = 'MOVE',
  JUMP = 'JUMP'
}

export interface AvatarEvent {
  eventId: string;
  userId: string;
  eventType: AvatarEventType;
  timestamp: number;
  payload: {
    direction?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
    duration?: number;
  };
}

export interface RedisConfig {
  url: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
}