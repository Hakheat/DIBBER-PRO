import { Router } from 'express';
import { ProcessStoryRequestSchema } from '../types/index.js';
import { storyController } from '../controllers/story.controller.js';
import { storyProcessLimiter } from '../middleware/rateLimit.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';

const router = Router();

router.post(
  '/process',
  storyProcessLimiter,
  validateBody(ProcessStoryRequestSchema),
  storyController.process,
);

export const storyRoutes = router;
