// controllers/FilesController.js
import { ObjectId } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import dotenv from 'dotenv';
import { getUserFromToken, getUserDocument } from '../utils/auth';
import { getFileByIdAndUser, formatFileResponse } from '../utils/file';

dotenv.config();

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload(req, res) {
    // Authenticate
    const userId = await getUserFromToken(req);
    if (!userId)
      return res.status(401).json({ error: 'Unauthorized' });

    const user = await getUserDocument(userId);
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
      const result = await dbClient.db.collection('files').insertOne({
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

    const newFile = await dbClient.db.collection('files').findOne({ _id: result.insertedId });
    return res.status(201).json(formatFileResponse(newFile));
  }

  static async getShow(req, res) {
    const userId = await getUserFromToken(req);
    if (!userId)
      return res.status(401).json({ error: 'Unauthorized' });

    const file = await getFileByIdAndUser(req.params.id, userId);
    if (!file)
      return res.status(404).json({ error: 'Not found' });

    return res.status(200).json(formatFileResponse(file));
  }

  static async getIndex(req, res) {
    const userId = await getUserFromToken(req);
    if (!userId)
      return res.status(401).json({ error: 'Unauthorized' });

    // Parse/Normalize query params
    const parentId = req.query.parentId || 0;
    const page = parseInt(req.query.page, 10) || 0;

    // Build MongoDB filter for user files
    const matchQuery = {
      userId: new ObjectId(userId),
      parentId: parentId === 0 ? 0 : new ObjectId(parentId),
    };

    // Fetch paginated files using aggregation
    const files = await dbClient.db.collection('files')
    .aggregate([
      { $match: matchQuery },
      { $skip: page * 20 },
      { $limit: 20 },
    ])
    .toArray();

    // Format response
    const fileList = files.map(formatFileResponse);

    return res.status(200).json(fileList);
  }

  static async putPublish(req, res) {
    const userId = await getUserFromToken(req);
    if (!userId)
      return res.status(401).json({ error: 'Unauthorized' });

    const fileId = req.params.id;
    try {
      const file = await getFileByIdAndUser(fileId, userId);

    if (!file)
      return res.status(404).json({ error: 'Not found' });

    await dbClient.db.collection('files').updateOne(
      { _id: new ObjectId(fileId) },
      { $set: { isPublic: true } }
    );

    return res.status(200).json(formatFileResponse(file));

    } catch {
      return res.status(404).json({ error: 'Not found' });
    }
  }

  static async putUnpublish(req, res) {
    const userId = await getUserFromToken(req);
    if (!userId)
      return res.status(401).json({ error: 'Unauthorized' });

    const fileId = req.params.id;
    try {
      const file = await getFileByIdAndUser(fileId, userId);

      if (!file)
        return res.status(404).json({ error: 'Not found' });

      await dbClient.db.collection('files').updateOne(
        { _id: new ObjectId(fileId) },
        { $set: { isPublic: false } }
      );

      return res.status(200).json(formatFileResponse(file));

    } catch {
      return res.status(404).json({ error: 'Not found' });
    }
  }
}

export default FilesController;
