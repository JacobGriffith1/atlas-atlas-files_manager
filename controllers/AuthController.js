// controllers/AuthController.js
import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';
import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [email, password] = credentials.split(':');

      if (!email || !password) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const hashedPassword = sha1(password);

      const user = await dbClient.db.collection('users').findOne({ email, password: hashedPassword });

      if (!user) {
        console.log('User not found for:', { email, hashedPassword });
        return res.status(401).json({ error: 'Unauthorized ' });
      }

      const token = uuidv4();

      await redisClient.set(`auth_${token}`, user._id.toString(), 'EX', 86400);

      return res.status(200).json({ token });

    } catch (err) {
      console.error('Error in getConnect:');
      console.error('Type:', typeof err);
      console.error('Value:', err);
      console.error('Stack:', err?.stack);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getDisconnect(req, res) {
    // Retrieve the token from the header "X-Token"
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const key = `auth_${token}`;
      const userId = await redisClient.get(key);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      await redisClient.del(key);
      return res.status(204).send();
    } catch (err) {
      console.error('Error in getDisconnect:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default AuthController;