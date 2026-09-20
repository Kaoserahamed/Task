// jest-dom adds custom jest matchers for asserting on DOM nodes
import '@testing-library/jest-dom';
/* global globalThis */

// Mock socket.io-client so components don't open live websocket
// connections (they log after tests finish, failing CI runs)
jest.mock('socket.io-client', () => {
  const emit = jest.fn();
  const on = jest.fn();
  const off = jest.fn();
  const mockSocket = { on, off, emit, disconnect: jest.fn(), id: 'test-socket' };
  return { __esModule: true, default: jest.fn(() => mockSocket), io: jest.fn(() => mockSocket) };
});

// jsdom doesn't implement canvas; stub getContext so chart components
// don't emit "Not implemented" console.error (fails tests in CI mode)

// Polyfill TextEncoder/TextDecoder for react-router v7 in jsdom
const { TextEncoder, TextDecoder } = require('util');

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder;
}
