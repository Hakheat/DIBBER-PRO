import { z } from 'zod';

export const CloneVoiceRequestSchema = z.object({
  name: z.string().trim().min(2, 'Voice name must be at least 2 characters').max(50),
  consent: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === 'true')
    .refine((val) => val === true, {
      message: 'You must provide consent acknowledging voice ownership or permission.',
    }),
});

export type CloneVoiceRequest = z.infer<typeof CloneVoiceRequestSchema>;

export const ClonedVoiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  createdAt: z.string(),
  previewUrl: z.string().optional(),
  gender: z.enum(['female', 'male']).optional(),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
  sampleText: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type ClonedVoice = z.infer<typeof ClonedVoiceSchema>;

export const CloneVoiceResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
});

export type CloneVoiceResponse = z.infer<typeof CloneVoiceResponseSchema>;

export const DeleteVoiceResponseSchema = z.object({
  deleted: z.literal(true),
});

export type DeleteVoiceResponse = z.infer<typeof DeleteVoiceResponseSchema>;
