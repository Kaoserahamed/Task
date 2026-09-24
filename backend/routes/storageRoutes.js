'use strict';

const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const storage = require('../config/storage');
const { BadRequestError, NotFoundError } = require('../utils/errors');

const router = express.Router();

router.post('/presign-upload', authMiddleware, async (req, res, next) => {
  try {
    const result = await storage.createPresignedUpload({
      filename: req.body?.filename,
      contentType: req.body?.contentType,
      size: Number(req.body?.size),
      userId: req.user?.userId || req.user?.id,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(
      new BadRequestError(error.message, error.code === 'STORAGE_NOT_CONFIGURED' ? 'STORAGE_NOT_CONFIGURED' : 'INVALID_FILE')
    );
  }
});

router.post('/presign-download', authMiddleware, async (req, res, next) => {
  try {
    const key = req.body?.key;
    if (!key) throw new BadRequestError('key is required', 'INVALID_STORAGE_KEY');
    const url = await storage.createPresignedDownload(key);
    res.json({ success: true, url, expiresIn: 900 });
  } catch (error) {
    if (error.code === 'STORAGE_NOT_CONFIGURED') return next(new NotFoundError(error.message, error.code));
    return next(new BadRequestError(error.message, 'INVALID_STORAGE_KEY'));
  }
});

module.exports = router;
