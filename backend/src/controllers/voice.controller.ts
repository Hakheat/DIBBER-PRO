import type { NextFunction, Request, Response } from 'express';
import { CloneVoiceRequestSchema } from '../types/index.js';
import { voiceService } from '../services/voice.service.js';
import { AppError } from '../utils/AppError.js';

export class VoiceController {
  public async clone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError('No audio sample file was uploaded', 400, 'SAMPLE_REQUIRED');
      }

      // Validate body fields with Zod
      const parsed = await CloneVoiceRequestSchema.parseAsync({
        name: req.body.name,
        consent: req.body.consent,
      });

      const result = await voiceService.cloneVoice({
        name: parsed.name,
        consent: parsed.consent,
        samplePath: req.file.path,
        providerName: req.body.provider,
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const voices = voiceService.getClonedVoices();
      res.status(200).json(voices);
    } catch (err) {
      next(err);
    }
  }

  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError('Voice ID is required', 400, 'ID_REQUIRED');
      }

      const result = await voiceService.deleteClonedVoice(id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const voiceController = new VoiceController();
