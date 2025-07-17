// utils/redis.js
import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient();

    this.client.on('error', (err) => console.error('Redis Client Error:', err));

    // Explicitly connect to Redis
    this.client.connect().then(() => {
      console.log('Redis client connected successfully');
    }).catch((err) => {
      console.error('Failed to connect to Redis:', err);
    });
  }

  isAlive() {
    return this.client.isReady; // Ensures the client is ready before using it
  }

  async get(key) {
    return this.client.get(key);
  }

  async set(key, value, duration) {
    return this.client.setEx(key, duration, value);
  }

  async del(key) {
    return this.client.del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
