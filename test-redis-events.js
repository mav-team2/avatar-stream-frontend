const { createClient } = require('redis');

async function testRedisEvents() {
  const client = createClient({
    url: 'redis://localhost:6379'
  });

  try {
    await client.connect();
    console.log('✅ Connected to Redis');

    // 테스트 이벤트들
    const events = [
      {
        eventId: `move_${Date.now()}_1`,
        userId: 'test-user-external',
        eventType: 'MOVE',
        timestamp: Date.now(),
        payload: { direction: 'RIGHT' }
      },
      {
        eventId: `jump_${Date.now()}_2`,
        userId: 'test-user-external',
        eventType: 'JUMP',
        timestamp: Date.now() + 1000,
        payload: { duration: 800 }
      },
      {
        eventId: `move_${Date.now()}_3`,
        userId: 'test-user-external',
        eventType: 'MOVE',
        timestamp: Date.now() + 2000,
        payload: { direction: 'UP' }
      }
    ];

    console.log('🚀 Sending test events...');

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      setTimeout(async () => {
        const result = await client.publish('channel:avatar:events', JSON.stringify(event));
        console.log(`📡 Event ${i + 1} sent: ${event.eventType} ${event.payload.direction || ''} (subscribers: ${result})`);

        if (i === events.length - 1) {
          await client.disconnect();
          console.log('🏁 Test completed');
        }
      }, i * 2000); // 2초 간격으로 전송
    }

  } catch (error) {
    console.error('❌ Redis connection error:', error);
    process.exit(1);
  }
}

// 스크립트 실행
console.log('🎮 Redis Event Tester Started');
testRedisEvents();