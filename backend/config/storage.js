'use strict';

const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const config = require('./env');

const ALLOWED_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function requireStorageConfig() {
  if (!config.aws.region || !config.aws.s3Bucket) {
    const error = new Error('S3 storage is not configured');
    error.code = 'STORAGE_NOT_CONFIGURED';
    throw error;
  }
}

function createClient() {
  requireStorageConfig();
  return new S3Client({
    region: config.aws.region,
    endpoint: config.aws.s3Endpoint || undefined,
    forcePathStyle: config.aws.s3ForcePathStyle,
  });
}

function safeFilename(filename) {
  const base = path.basename(String(filename || 'image')).replace(/[^a-zA-Z0-9._-]/g, '_');
  return base || 'image';
}

function validateUpload({ filename, contentType, size }) {
  const normalizedType = String(contentType || '').toLowerCase();
  const expectedExtension = ALLOWED_TYPES.get(normalizedType);
  const suppliedExtension = path.extname(String(filename || '')).toLowerCase();
  if (!expectedExtension) {
    const error = new Error('Only JPEG, PNG, WebP and GIF images are allowed');
    error.code = 'INVALID_FILE_TYPE';
    throw error;
  }
  if (suppliedExtension && suppliedExtension !== expectedExtension && suppliedExtension !== '.jpeg' && expectedExtension === '.jpg') {
    const error = new Error('The file extension does not match its content type');
    error.code = 'INVALID_FILE_TYPE';
    throw error;
  }
  if (!Number.isInteger(size) || size < 1 || size > MAX_FILE_SIZE) {
    const error = new Error('Image must be between 1 byte and 5 MB');
    error.code = 'INVALID_FILE_SIZE';
    throw error;
  }
  return { contentType: normalizedType, extension: ALLOWED_TYPES.get(normalizedType) };
}

function buildObjectKey({ filename, contentType }) {
  const { extension } = validateUpload({ filename, contentType, size: 1 });
  const safeName = safeFilename(filename);
  const normalizedName = safeName.toLowerCase().endsWith(extension) || (extension === '.jpg' && safeName.toLowerCase().endsWith('.jpeg'))
    ? safeName
    : `${safeName}${extension}`;
  return `${config.aws.s3Prefix}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${normalizedName}`;
}

function keyFromStableUrl(url) {
  const marker = '/api/storage/object/';
  const value = String(url || '');
  if (!value.startsWith(marker)) return null;
  return value.slice(marker.length).split('/').map(decodeURIComponent).join('/');
}

function stableObjectUrl(key) {
  return `/api/storage/object/${key.split('/').map(encodeURIComponent).join('/')}`;
}

function createS3Storage() {
  requireStorageConfig();
  return {
    _handleFile(req, file, callback) {
      let key;
      try {
        const { contentType } = validateUpload({ filename: file.originalname, contentType: file.mimetype, size: file.size });
        key = buildObjectKey({ filename: file.originalname, contentType });
      } catch (error) {
        return callback(error);
      }

      createClient()
        .send(new PutObjectCommand({
          Bucket: config.aws.s3Bucket,
          Key: key,
          Body: file.stream,
          ContentType: file.mimetype,
          ContentLength: file.size,
          Metadata: { uploadedBy: String(req.user?.userId || req.user?.id || 'anonymous').slice(0, 128) },
        }))
        .then(() => {
          file.storageKey = key;
          file.path = stableObjectUrl(key);
          file.url = file.path;
          return callback(null, file);
        })
        .catch(callback);
    },
    _removeFile(req, file, callback) {
      if (!file.storageKey) return callback(null);
      deleteObject(file.storageKey).then(() => callback(null)).catch(callback);
    },
  };
}

function createS3Upload() {
  return multer({
    storage: createS3Storage(),
    limits: { fileSize: MAX_FILE_SIZE, files: 5 },
    fileFilter: (req, file, callback) => {
      try {
        validateUpload({ filename: file.originalname, contentType: file.mimetype, size: file.size });
        callback(null, true);
      } catch (error) {
        callback(error);
      }
    },
  });
}

async function createPresignedUpload({ filename, contentType, size, userId }) {
  const { contentType: type } = validateUpload({ filename, contentType, size });
  const key = buildObjectKey({ filename, contentType: type });
  const command = new PutObjectCommand({
    Bucket: config.aws.s3Bucket,
    Key: key,
    ContentType: type,
    ContentLength: size,
    Metadata: { uploadedBy: String(userId || 'anonymous').slice(0, 128) },
  });
  return {
    key,
    uploadUrl: await getSignedUrl(createClient(), command, {
      expiresIn: config.aws.s3PresignedUrlTtlSeconds,
    }),
    expiresIn: config.aws.s3PresignedUrlTtlSeconds,
    headers: { 'Content-Type': type },
  };
}

async function createPresignedDownload(key) {
  const safeKey = String(key || '').replace(/^\/+/, '');
  if (!safeKey.startsWith(`${config.aws.s3Prefix}/`) || safeKey.includes('..')) {
    const error = new Error('Invalid storage key');
    error.code = 'INVALID_STORAGE_KEY';
    throw error;
  }
  return getSignedUrl(
    createClient(),
    new GetObjectCommand({ Bucket: config.aws.s3Bucket, Key: safeKey }),
    { expiresIn: config.aws.s3PresignedUrlTtlSeconds }
  );
}

async function deleteObject(key) {
  const safeKey = String(key || '').replace(/^\/+/, '');
  if (!safeKey.startsWith(`${config.aws.s3Prefix}/`) || safeKey.includes('..')) return false;
  await createClient().send(new DeleteObjectCommand({ Bucket: config.aws.s3Bucket, Key: safeKey }));
  return true;
}

async function deleteStoredUrl(url) {
  const key = keyFromStableUrl(url);
  return key ? deleteObject(key) : false;
}

module.exports = {
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
  createPresignedUpload,
  createPresignedDownload,
  createS3Upload,
  stableObjectUrl,
  deleteObject,
  deleteStoredUrl,
  validateUpload,
};
