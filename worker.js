// worker.js
import { ObjectId } from "mongodb";
import imageThumbnail from 'image-thumbnail';
import fs from 'fs/promises';
import fileQueue from './utils/queues/fileQueue.js';
import dbClient from './utils/db.js';

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const file = await dbClient.db.collection('files').findOne({
    _id: new ObjectId(fileId),
    userId: new ObjectId(userId),
  });

  if (!file) throw new Error('File not found');
  if (file.type !== 'image')
    return;

  const sizes = [500, 250, 100];
  for (const size of sizes) {
    const options = { width: size };
    const thumbnail = await imageThumbnail(file.localPath, options);
    const thumbPath = `${file.localPath}_${size}`;
    await fs.writeFile(thumbPath, thumbnail);
  }
});