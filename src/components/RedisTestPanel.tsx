import React, { useState } from 'react';
import { RedisService } from '../services/RedisService';
import { AvatarEventType } from '../types/redis';

interface RedisTestPanelProps {
  redisService: RedisService | null;
}

export const RedisTestPanel: React.FC<RedisTestPanelProps> = ({ redisService }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [eventCount, setEventCount] = useState(0);

  const sendTestEvent = async (eventType: AvatarEventType, payload: any) => {
    if (!redisService?.isClientConnected()) {
      alert('Redis not connected!');
      return;
    }

    try {
      // Redis Pub/Sub으로 이벤트 발송
      const event = {
        eventId: `test_${Date.now()}_${Math.random()}`,
        userId: redisService.getUserId(),
        eventType,
        timestamp: Date.now(),
        payload
      };

      // 실제로는 Redis client를 통해 발송해야 하지만,
      // 여기서는 이벤트 시스템에 직접 추가하는 방식으로 테스트
      console.log('🧪 Test event sent:', event);
      setEventCount(prev => prev + 1);
    } catch (error) {
      console.error('Failed to send test event:', error);
    }
  };

  const createTestUser = async () => {
    if (!redisService?.isClientConnected()) {
      alert('Redis not connected!');
      return;
    }

    // 테스트 유저 생성 (임의 위치)
    const testUserId = `test-user-${Date.now()}`;
    const x = Math.random() * 600 + 100;
    const y = Math.random() * 400 + 100;

    console.log(`🧪 Creating test user ${testUserId} at (${x}, ${y})`);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      width: 250,
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: 15,
      borderRadius: 8,
      fontSize: 12,
      fontFamily: 'monospace',
      zIndex: 1000
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: 14 }}>🧪 Redis Test Panel</h3>

      <div style={{ marginBottom: 10 }}>
        Status: <span style={{ color: redisService?.isClientConnected() ? '#4ade80' : '#ef4444' }}>
          {redisService?.isClientConnected() ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div style={{ marginBottom: 15 }}>
        Events sent: {eventCount}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => sendTestEvent(AvatarEventType.MOVE, { direction: 'RIGHT' })}
          style={buttonStyle}
        >
          📍 Move Right
        </button>

        <button
          onClick={() => sendTestEvent(AvatarEventType.MOVE, { direction: 'LEFT' })}
          style={buttonStyle}
        >
          📍 Move Left
        </button>

        <button
          onClick={() => sendTestEvent(AvatarEventType.MOVE, { direction: 'UP' })}
          style={buttonStyle}
        >
          📍 Move Up
        </button>

        <button
          onClick={() => sendTestEvent(AvatarEventType.MOVE, { direction: 'DOWN' })}
          style={buttonStyle}
        >
          📍 Move Down
        </button>

        <button
          onClick={() => sendTestEvent(AvatarEventType.JUMP, { duration: 800 })}
          style={buttonStyle}
        >
          🦘 Jump
        </button>

        <button
          onClick={createTestUser}
          style={{ ...buttonStyle, backgroundColor: '#7c3aed' }}
        >
          👤 Add Test User
        </button>
      </div>

      <div style={{ marginTop: 15, fontSize: 11, color: '#888' }}>
        Use this panel to test Redis events.<br />
        Watch console for detailed logs.
      </div>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  padding: '6px 10px',
  backgroundColor: '#374151',
  border: 'none',
  borderRadius: 4,
  color: 'white',
  cursor: 'pointer',
  fontSize: 11,
  transition: 'background-color 0.2s',
};