import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://redis-service:6379';

const client = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
  },
});

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

client.on('connect', () => {
  console.log(`Connected to Redis at ${redisUrl}`);
});

client.on('ready', () => {
  console.log('Redis client ready');
});

client.on('end', () => {
  console.log('Redis connection ended');
});

// Only connect if not in test environment
if (process.env.NODE_ENV !== 'test') {
  await client.connect();
}

export default client;
