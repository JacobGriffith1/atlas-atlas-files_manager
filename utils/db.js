import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/files_manager"; // Ensure correct database name

class DBClient {
  constructor() {
    this.client = new MongoClient(uri);

    this.client.connect()
      .then(() => {
        console.log('Connected to MongoDB');
        this.db = this.client.db();
      })
      .catch((err) => console.error('MongoDB connection error:', err));
  }

  isAlive() {
    return this.client && this.client.topology && this.client.topology.isConnected();
  }

  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;
