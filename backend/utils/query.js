'use strict';

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeText(value, maxLength = 120) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function safeMongoText(value, maxLength = 120) {
  return {
    value: safeText(value, maxLength),
    regex: new RegExp(escapeRegExp(safeText(value, maxLength)), 'i'),
  };
}

module.exports = { escapeRegExp, safeText, safeMongoText };
