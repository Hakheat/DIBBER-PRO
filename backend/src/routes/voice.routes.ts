import { Router } from 'express';
import { voiceController } from '../controllers/voice.controller.js';
import { voiceCloneLimiter } from '../middleware/rateLimit.middleware.js';
import { uploadVoiceSample } from '../middleware/upload.middleware.js';

const router = Router();

router.post('/clone', voiceCloneLimiter, uploadVoiceSample, voiceController.clone);
router.get('/', voiceController.list);
router.delete('/:id', voiceController.delete);

export const voiceRoutes = router;
