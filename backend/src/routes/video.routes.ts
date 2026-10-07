import { Router } from 'express';
import { videoController } from '../controllers/video.controller.js';
import { videoLimiter } from '../middleware/rateLimit.middleware.js';

const videoRoutes = Router();

// Video endpoints
videoRoutes.post('/info', videoLimiter, (req, res, next) => videoController.getInfo(req, res, next));
videoRoutes.post('/download/prepare', videoLimiter, (req, res, next) => videoController.prepare(req, res, next));
videoRoutes.get('/download/status/:jobId', (req, res, next) => videoController.getStatus(req, res, next));
videoRoutes.get('/download/file/:jobId', (req, res, next) => videoController.getFile(req, res, next));
videoRoutes.post('/download', videoLimiter, (req, res, next) => videoController.download(req, res, next));
videoRoutes.get('/download', videoLimiter, (req, res, next) => videoController.download(req, res, next));

export { videoRoutes };
