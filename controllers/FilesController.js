// controllers/FilesController.js
import { ObjectId } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import dotenv from 'dotenv';

dotenv.config();

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload(req, res) {
    // Authenticate
    const token = req.headers['x-token'];
    if (!token)
      return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId)
      return res.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user)
      return res.status(401).json({ error: 'Unauthorized' });

    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    // Validate Inputs
    if (!name)
      return res.status(400).json({ error: 'Missing name' });

    if (!type || !['folder', 'file', 'image'].includes(type))
      return res.status(400).json({ error: 'Missing type'});

    if (type !== 'folder' && !data)
      return res.status(400).json({ error: 'Missing data' });

    let parentObjectId = null;
    if (parentId !== 0) {
      try {
        parentObjectId = new ObjectId(parentId);
      } catch {
        return res.status(400).json({ error: 'Parent not found' });
      }

      const parent = await dbClient.db.collection('files').findOne({ _id: parentObjectId });
      if (!parent)
        return res.status(400).json({ error: 'Parent not found' });
      if (parent.type !== 'folder')
        return res.status(400).json({ error: 'Parent is not a folder' });
    }

    if (type === 'folder') {
      const result = await dbClient.db.collection('files'). insertOne({
        userId: user._id,
        name,
        type,
        isPublic,
        parentId: parentId === 0 ? 0 : parentObjectId,
      });

      const newFolder = {
        id: result.insertedId,
        userId: user._id,
        name,
        type,
        isPublic,
        parentId: parentId === 0 ? 0 : parentObjectId,
      };

      return res.status(201).json(newFolder);
    }

    // Ensure Storage Directory Exists
    await fs.mkdir(FOLDER_PATH, { recursive: true });

    // Save File Locally
    const fileUuid = uuidv4();
    const filePath = path.join(FOLDER_PATH, fileUuid);
    const fileData = Buffer.from(data, 'base64');
    await fs.writeFile(filePath, fileData);

    // Extend Doc with LocalPath
    const fileDocument = {
      userId: user._id,
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? 0 : parentObjectId,
      localPath: filePath,
    };

    const result = await dbClient.db.collection('files').insertOne(fileDocument);

    const newFile = {
      id: result.insertedId,
      ...fileDocument,
    };

    return res.status(201).json(newFile);
  }
}

export default FilesController;
