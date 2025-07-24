// utils/file.js
import { ObjectId } from "mongodb";
import dbClient from "./db.js";

/**
 * Retrieves a file document by ID and verifies user ownership.
 * @param {string} fileId - The ID of the file.
 * @param {string} userId - The ID of the authenticated user.
 * @returns {Promise<Object|null>} The file documet or null if not found.
 */
export async function getFileByIdAndUser(fileId, userId) {
  try {
    return await dbClient.db.collection('files').findOne({
      _id: new ObjectId(fileId),
      userId: new ObjectId(userId),
    });
  } catch {
    return null;
  }
}

/**
 * Formats a file document for API responses.
 * @param {Object} - File.
 * @returns {Object} - Formatted response object.
 */
export function formatFileResponse(file) {
  return {
    id: file._id,
    userId: file.userId,
    name: file.name,
    type: file.type,
    isPublic: file.isPublic,
    parentId: file.parentId,
    ...(file.localPath && { localPath: file.localPath }),
  };
}