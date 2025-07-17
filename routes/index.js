// routes/index.js
import express from 'express';
import AppController from '../controllers/AppController.js';
import UsersController from '../controllers/UsersController.js';
import AuthController from '../controllers/AuthController.js';
import FilesController from '../controllers/FilesController.js';

const router = express.Router();

// App Status
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

// Users
router.post('/users', UsersController.postNew);
router.get('/users/me', UsersController.getMe);

// Auth
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);

// Files
router.post('/files', FilesController.postUpload);  // Create File/Folder
router.get('/files', FilesController.getIndex);     // List Files
router.get('/files/:id', FilesController.getShow);  // Get File Metadata

export default router;