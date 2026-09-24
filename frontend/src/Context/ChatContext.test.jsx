import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { ChatProvider, useChat } from './ChatContext';
import { useAuth } from './AuthContext';
import * as chatApi from '../api/chat';

jest.mock('./AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../api/chat', () => ({
  fetchUserChats: jest.fn(),
  sendMessage: jest.fn(),
}));

let probe;
const Probe = () => {
  probe = useChat();
  return <div>{probe.error || `${probe.chats.length} chats`}</div>;
};

const renderProvider = () =>
  render(
    <ChatProvider>
      <Probe />
    </ChatProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ user: { user: { _id: 'user-1' } } });
  chatApi.fetchUserChats.mockResolvedValue([{ _id: 'chat-1' }]);
  chatApi.sendMessage.mockResolvedValue({ success: true });
});

test('loads chats for the signed-in user and clears stale errors', async () => {
  chatApi.fetchUserChats.mockRejectedValueOnce(new Error('chat unavailable'));
  renderProvider();

  await act(async () => {
    await probe.fetchChats('aduse');
  });
  expect(screen.getByText('chat unavailable')).toBeInTheDocument();

  await act(async () => {
    await probe.fetchChats('comuse');
    probe.clearError();
  });
  expect(await screen.findByText('1 chats')).toBeInTheDocument();
  expect(chatApi.fetchUserChats).toHaveBeenNthCalledWith(1, 'user-1', 'aduse');
  expect(chatApi.fetchUserChats).toHaveBeenNthCalledWith(2, 'user-1', 'comuse');
});

test('does not call the chat API without a user id', async () => {
  useAuth.mockReturnValue({ user: null });
  renderProvider();

  await act(async () => {
    await probe.fetchChats();
  });

  expect(chatApi.fetchUserChats).not.toHaveBeenCalled();
  expect(screen.getByText('0 chats')).toBeInTheDocument();
});

test('sends messages, selects chats, and exposes send failures', async () => {
  renderProvider();
  await act(async () => {
    await expect(probe.sendMessage({ content: 'Hello' })).resolves.toEqual({ success: true });
  });
  expect(chatApi.sendMessage).toHaveBeenCalledWith({ content: 'Hello' });

  act(() => probe.setSelectedChat({ _id: 'chat-1' }));
  expect(probe.selectedChat).toEqual({ _id: 'chat-1' });

  chatApi.sendMessage.mockRejectedValueOnce(new Error('message rejected'));
  await act(async () => {
    await expect(probe.sendMessage({ content: 'Retry' })).rejects.toThrow('message rejected');
  });
  expect(probe.error).toBe('message rejected');
});

test('useChat fails clearly when used outside its provider', () => {
  const Outside = () => {
    useChat();
    return null;
  };
  expect(() => render(<Outside />)).toThrow('useChat must be used within a ChatProvider');
});
