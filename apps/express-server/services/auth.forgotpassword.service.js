import redisClient from '../lib/redis.js';

const forgotPassword = async () => {
  // Store test value in Redis
  await redisClient.setEx('test:redis', 60, 'working');

  return { success: true, message: 'Redis test working' };
};

export default forgotPassword;
