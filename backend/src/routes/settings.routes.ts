import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller.js';

export const settingsRoutes = Router();

settingsRoutes.get('/', (req, res) => settingsController.getSettings(req, res));
settingsRoutes.post('/', (req, res) => settingsController.updateSettings(req, res));
