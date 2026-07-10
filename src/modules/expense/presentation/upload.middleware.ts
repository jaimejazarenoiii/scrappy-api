import type { RequestHandler } from 'express';
import multer from 'multer';
import { ValidationAppError } from '../../../shared/errors/http-exceptions.js';
import {
  ALLOWED_PHOTO_MIME_TYPES,
  MAX_PHOTO_SIZE_BYTES,
} from '../../transaction/domain/attachment-constraints.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_PHOTO_MIME_TYPES.includes(file.mimetype)) {
      cb(new ValidationAppError('Unsupported file type. Allowed types: JPEG, PNG, WEBP.'));
      return;
    }
    cb(null, true);
  },
});

export const uploadExpensePhoto: RequestHandler = (req, res, next) => {
  upload.single('file')(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        next(new ValidationAppError('File exceeds the 5 MB size limit.'));
        return;
      }
      next(err);
      return;
    }
    next();
  });
};
