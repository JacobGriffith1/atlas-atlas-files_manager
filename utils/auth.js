// utils/auth.js
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from './db';

export async function getUserFromToken(req) {
  const token = req.headers['x-token'];
  if (!token) 
    return null;

  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) 
    return null;
  
  return new ObjectId(userId);
}

export async function getUserDocument(userId) {
  if (!userId) return null;
  return dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
}