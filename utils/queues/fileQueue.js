// utils/queues/fileQueue.js
import Queue from 'bull';
import dotenv from 'dotenv';

dotenv.config();

const fileQueue = new Queue('fileQueue', process.env.REDIS_URL || 'redis://127.0.0.1:6379');
export default fileQueue;