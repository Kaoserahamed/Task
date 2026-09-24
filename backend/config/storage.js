'use strict';

const crypto = require('crypto');
const path = require('path');
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

async function createPresignedUpload({ filename, contentType, size, userId }) {
  const { contentType: type, extension } = validateUpload({ filename, contentType, size });
  const key = `${config.aws.s3Prefix}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeFilename(filename)}${extension && !safeFilename(filename).toLowerCase().endsWith(extension) ? extension : ''}`;
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

module.exports = {
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
  createPresignedUpload,
  createPresignedDownload,
  deleteObject,
  validateUpload,
};
