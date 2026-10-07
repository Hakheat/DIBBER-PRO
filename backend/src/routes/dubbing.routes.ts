import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { dubbingController } from '../controllers/dubbing.controller.js';

const uploadDir = path.join(process.cwd(), 'temp', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // Up to 500MB per video
    files: 10, // Up to 10 videos in a batch
  },
});

const dubbingRoutes = Router();

// Direct Video-to-Text Transcription
dubbingRoutes.post('/transcribe', upload.single('video'), (req, res, next) => {
  dubbingController.transcribeVideo(req, res, next);
});

// Auto-Fit Video Audio Silence Analysis & Detection
dubbingRoutes.post('/detect-silence', upload.single('video'), (req, res, next) => {
  dubbingController.detectSilence(req, res, next);
});

// Batch upload and enqueue
dubbingRoutes.post('/batch', upload.array('videos', 10), (req, res, next) => {
  dubbingController.uploadBatch(req, res, next);
});

// Job management endpoints
dubbingRoutes.get('/jobs', (req, res, next) => dubbingController.getJobs(req, res, next));
dubbingRoutes.get('/jobs/:id', (req, res, next) => dubbingController.getJob(req, res, next));
dubbingRoutes.get('/jobs/:id/video', (req, res, next) => dubbingController.downloadVideo(req, res, next));
dubbingRoutes.get('/jobs/:id/subtitles', (req, res, next) => dubbingController.downloadSubtitles(req, res, next));
dubbingRoutes.post('/jobs/:id/retry', (req, res, next) => dubbingController.retryJob(req, res, next));
dubbingRoutes.delete('/jobs/:id', (req, res, next) => dubbingController.deleteJob(req, res, next));

export { dubbingRoutes };
