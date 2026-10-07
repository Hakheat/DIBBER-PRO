import dotenv from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

// Load .env from backend directory or project root
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .default('4000'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Anthropic Claude
  ANTHROPIC_API_KEY: z.string().optional(),
  CLAUDE_MODEL: z.string().default('claude-3-5-sonnet-20241022'),

  // Google Gemini
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-pro'),

  // TTS Providers
  TTS_PROVIDER: z.enum(['elevenlabs', 'azure', 'google']).default('elevenlabs'),
  ELEVENLABS_API_KEY: z.string().optional(),
  AZURE_SPEECH_KEY: z.string().optional(),
  AZURE_SPEECH_REGION: z.string().optional().default('eastus'),
  GOOGLE_TTS_API_KEY: z.string().optional(),

  // Limits
  MAX_STORY_CHARS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .default('50000'),
  MAX_UPLOAD_MB: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .default('50'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Environment validation failed:', parsed.error.format());
  throw new Error(`Invalid environment configuration: ${JSON.stringify(parsed.error.format())}`);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
