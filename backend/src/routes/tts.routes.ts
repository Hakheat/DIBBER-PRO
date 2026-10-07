import { Router } from 'express';
import { SpeakRequestSchema } from '../types/index.js';
import { ttsController } from '../controllers/tts.controller.js';
import { ttsLimiter } from '../middleware/rateLimit.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';

const router = Router();

router.post(
  '/speak',
  ttsLimiter,
  validateBody(SpeakRequestSchema),
  ttsController.speak,
);

router.get('/voices', ttsController.listVoices);

export const ttsRoutes = router;
