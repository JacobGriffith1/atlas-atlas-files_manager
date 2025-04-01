import dbClient from '../utils/db.js'
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
}

export default UsersController;