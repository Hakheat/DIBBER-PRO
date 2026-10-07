import type { NextFunction, Request, Response } from 'express';
import type { ProcessStoryRequest } from '../types/index.js';
import { storyService } from '../services/story.service.js';

export class StoryController {
  public async process(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = req.body as ProcessStoryRequest;
      const result = await storyService.processStory(payload);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const storyController = new StoryController();
