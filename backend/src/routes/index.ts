import { Router } from 'express';
import { storyRoutes } from './story.routes.js';
import { ttsRoutes } from './tts.routes.js';
import { voiceRoutes } from './voice.routes.js';
import { videoRoutes } from './video.routes.js';
import { dubbingRoutes } from './dubbing.routes.js';
import { settingsRoutes } from './settings.routes.js';

const apiRouter = Router();

// GET /api/health
apiRouter.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Mounted sub-routes under /api
apiRouter.use('/story', storyRoutes);
apiRouter.use('/tts', ttsRoutes);
apiRouter.use('/voice', voiceRoutes);
apiRouter.use('/video', videoRoutes);
apiRouter.use('/dubbing', dubbingRoutes);
apiRouter.use('/settings', settingsRoutes);

export { apiRouter };
