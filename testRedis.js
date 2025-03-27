import redisClient from './utils/redis.js';

(async () => {
  console.log('Checking Redis connection:', redisClient.isAlive());

  // Test setting a value
  await redisClient.set('testKey', 'Hello, Redis!', 10);
  console.log('Value set in Redis.');

  // Test getting the value
  const value = await redisClient.get('testKey');
  console.log('Retrieved from Redis:', value);

  // Test deleting the key
  await redisClient.del('testKey');
  console.log('Key deleted.');

  // Test if key is really deleted
  const deletedValue = await redisClient.get('testKey');
  console.log('After deletion, value:', deletedValue); // Should be null
})();
