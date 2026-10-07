import type { NextFunction, Request, Response } from 'express';
import type { SpeakRequest } from '../types/index.js';
import { ttsService } from '../services/tts.service.js';

export class TTSController {
  public async speak(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = req.body as SpeakRequest;
      const { audio, contentType } = await ttsService.speak(payload);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', audio.length);
      res.setHeader('Cache-Control', 'no-cache');
      const filename = contentType === 'audio/wav' ? 'speech.wav' : 'speech.mp3';
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

      res.status(200).send(audio);
    } catch (err) {
      next(err);
    }
  }

  public async listVoices(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const voices = await ttsService.listVoices();
      res.status(200).json({ voices });
    } catch (err) {
      next(err);
    }
  }
}

export const ttsController = new TTSController();
