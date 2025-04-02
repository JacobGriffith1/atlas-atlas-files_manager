import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';
import { ObjectId } from 'mongodb';
import sha1 from 'sha1';

class UsersController {
    static async postNew(req, res) {
        const { email, password } = req.body;

        // Check for missing email
        if (!email) {
            return res.status(400).json({ error: 'Missing email' });
        }

        // Check for missing password
        if (!password) {
            return res.status(400).json({ error: 'Missing password' });
        }

        // Check if user already exists
        const existingUser = await dbClient.db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Already exist'})
        }

        // Hash password using SHA1
        const hashedPassword = sha1(password);

        // Insert new user
        const result = await dbClient.db.collection('users').insertOne({
            email,
            password: hashedPassword,
        });

        // Return response with user ID and email
        return res.status(201).json({ id: result.insertedId, email });
    }

    static async getMe(req, res) {
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
            const user = await dbClient.db.collection('users').findOne(
                { _id: new ObjectId(userId) },
                { projection: {email: 1 } }
            );
            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            return res.status(200).json({ id: user._id, email: user.email });
        } catch (err) {
            console.error('Error in getMe:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default UsersController;