import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { ALLOWED_AUDIO_EXTENSIONS, ALLOWED_AUDIO_MIME_TYPES } from '../types/index.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const uploadDir = path.resolve(process.cwd(), 'temp', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `sample-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const ext = path.extname(file.originalname).toLowerCase() as (typeof ALLOWED_AUDIO_EXTENSIONS)[number];
  const mime = file.mimetype.toLowerCase() as (typeof ALLOWED_AUDIO_MIME_TYPES)[number];

  const isExtValid = ALLOWED_AUDIO_EXTENSIONS.includes(ext);
  const isMimeValid = ALLOWED_AUDIO_MIME_TYPES.includes(mime);

  if (isExtValid || isMimeValid) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid audio file format. Supported formats: ${ALLOWED_AUDIO_EXTENSIONS.join(', ')}`,
        400,
        'INVALID_FILE_TYPE',
      ),
    );
  }
};

export const uploadVoiceSample = multer({
  storage,
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024,
  },
  fileFilter,
}).single('sample');
