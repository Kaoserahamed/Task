import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import io from 'socket.io-client';
import { SocketProvider, useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

jest.mock('./AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('socket.io-client', () => jest.fn());

const Probe = () => <div data-testid="socket-state">{useSocket() ? 'connected' : 'offline'}</div>;

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ user: { _id: 'user-1' } });
});

test('creates a user socket and closes it on unmount', async () => {
  const close = jest.fn();
  const socket = { close };
  io.mockReturnValue(socket);

  const view = render(
    <SocketProvider>
      <Probe />
    </SocketProvider>
  );

  expect(await screen.findByText('connected')).toBeInTheDocument();
  expect(io).toHaveBeenCalledWith('http://localhost:4000', { query: { userId: 'user-1' } });

  view.unmount();
  expect(close).toHaveBeenCalledTimes(1);
});

test('does not connect while logged out and updates when the user changes', async () => {
  const firstClose = jest.fn();
  const secondClose = jest.fn();
  io.mockReturnValueOnce({ close: firstClose }).mockReturnValueOnce({ close: secondClose });
  useAuth.mockReturnValue({ user: null });

  const view = render(
    <SocketProvider>
      <Probe />
    </SocketProvider>
  );
  expect(screen.getByText('offline')).toBeInTheDocument();
  expect(io).not.toHaveBeenCalled();

  useAuth.mockReturnValue({ user: { _id: 'user-2' } });
  view.rerender(
    <SocketProvider>
      <Probe />
    </SocketProvider>
  );
  await waitFor(() => expect(io).toHaveBeenCalledTimes(1));
  expect(io).toHaveBeenLastCalledWith('http://localhost:4000', { query: { userId: 'user-2' } });
});
