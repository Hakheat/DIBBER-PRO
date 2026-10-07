import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { prisma } from '../db/prisma.js';

export class SettingsController {
  public async getSettings(_req: Request, res: Response): Promise<void> {
    try {
      const apiKeySetting = await prisma.settings.findUnique({
        where: { key: 'geminiApiKey' }
      });
      const modelSetting = await prisma.settings.findUnique({
        where: { key: 'geminiModel' }
      });
      
      const currentGeminiKey = apiKeySetting?.value || env.GEMINI_API_KEY;
      const currentGeminiModel = modelSetting?.value || env.GEMINI_MODEL || 'gemini-1.5-flash';
      
      res.status(200).json({
        geminiApiKey: currentGeminiKey ? '********' : '',
        geminiModel: currentGeminiModel,
      });
    } catch (err) {
      console.error('Failed to get settings:', err);
      res.status(500).json({ error: { message: 'Failed to get settings' } });
    }
  }

  public async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const { geminiApiKey, geminiModel } = req.body;

      if (geminiApiKey !== undefined && geminiApiKey !== '********') {
        // Save to Database
        await prisma.settings.upsert({
          where: { key: 'geminiApiKey' },
          update: { value: geminiApiKey },
          create: { key: 'geminiApiKey', value: geminiApiKey },
        });

        // Also update runtime process env for immediate access
        process.env.GEMINI_API_KEY = geminiApiKey;
      }

      if (geminiModel !== undefined) {
        await prisma.settings.upsert({
          where: { key: 'geminiModel' },
          update: { value: geminiModel },
          create: { key: 'geminiModel', value: geminiModel },
        });
        process.env.GEMINI_MODEL = geminiModel;
      }

      res.status(200).json({ success: true, message: 'Settings saved to Database successfully' });
    } catch (err) {
      console.error('Failed to update settings in DB:', err);
      res.status(500).json({ error: { message: 'Failed to save settings' } });
    }
  }
}

export const settingsController = new SettingsController();
