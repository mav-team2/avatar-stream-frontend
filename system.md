# Redis 기반 아바타 제어 시스템 설계

## 🎯 요구사항 명세

### 기본 요구사항
- 20명 동시 사용자
- 외부 클라이언트에서 Redis를 통한 아바타 제어
- 이동(MOVE) + 점프(JUMP) 두 가지 움직임
- 이벤트 중복 시 큐잉 처리
- 멀티 유저 아바타 렌더링 (모든 접속자 아바타 표시)

### 현재 시스템 구조
- BitECS 기반 Entity-Component-System
- React + TypeScript
- Docker Compose에 Redis 준비됨

## 🏗️ Redis 아키텍처 설계

### 1. 데이터 구조

```redis
# 접속 유저 관리 (TTL 30분)
users:online → {uuid1, uuid2, uuid3...}
EXPIRE users:online 1800

# 유저별 상태 (TTL 30분)
user:{uuid}:state → {
  x: 400, y: 300,
  direction: 0,
  avatarId: 1,
  lastSeen: timestamp
}
EXPIRE user:{uuid}:state 1800

# 유저별 이벤트 큐 (List)
user:{uuid}:events → [event1, event2, event3...]

# 글로벌 이벤트 알림 (Pub/Sub)
channel:avatar:events
```

### 2. 이벤트 구조

```typescript
enum AvatarEventType {
  MOVE = 'MOVE',
  JUMP = 'JUMP'
}

interface AvatarEvent {
  eventId: string;
  userId: string;
  eventType: AvatarEventType;
  timestamp: number;
  payload: {
    // MOVE: direction (UP/DOWN/LEFT/RIGHT)
    // JUMP: duration
    direction?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
    duration?: number;
  };
}
```

### 3. 이벤트 흐름

```
외부 클라이언트 → Redis Pub/Sub → 웹 게임 → 아바타 움직임 → 좌표 업데이트 → Redis Hash
```

## 🛡️ 보안 & 성능 고려사항

### 보안 (Security)
- **✅ Redis AUTH**: 프로덕션에서 `requirepass` 설정
- **✅ 입력 검증**: 이벤트 데이터 스키마 검증 필수
- **✅ Rate Limiting**: 유저당 초당 최대 이벤트 수 제한 (예: 10/sec)
- **✅ UUID 검증**: 유효한 UUID 형식만 허용
- **⚠️ Connection Pooling**: Redis 연결 재사용으로 성능 최적화

### 성능 (Performance)
- **📊 20명 동시 사용자**: 충분한 여유 (Redis 10K+ ops/sec 가능)
- **🚀 TTL 설정**: 비활성 유저 자동 정리 (예: 30분)
- **💾 메모리 최적화**: Hash 압축, 불필요한 데이터 정리
- **⚡ 배치 처리**: 다중 아바타 업데이트 시 파이프라인 사용

## 🚀 권장 구현 단계

```
Phase 1: Redis 연결 + 기본 이벤트 수신
Phase 2: 멀티 유저 아바타 렌더링
Phase 3: 이벤트 큐잉 + 애니메이션
Phase 4: 성능 최적화 + 에러 처리
```

## 🔥 핵심 아키텍처 포인트

- **이벤트 소비**: Web 클라이언트가 Redis Pub/Sub 구독
- **상태 동기화**: 주기적으로 모든 유저 상태 조회 (1초마다)
- **큐 처리**: 각 유저 이벤트를 순차적으로 실행
- **멀티플레이어**: Redis에서 모든 접속 유저 UUID + 좌표 조회하여 렌더링