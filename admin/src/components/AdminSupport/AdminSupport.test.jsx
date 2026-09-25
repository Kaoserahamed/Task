import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminSupport from './AdminSupport';
import * as chatApi from '../../api/chat';
import socket from '../../socket';

jest.mock('../../api/chat', () => ({
  fetchAdminChats: jest.fn(),
  sendMessage: jest.fn(),
}));

const userChat = {
  _id: 'chat-1',
  userName: 'Ada',
  lastMessage: 'Need help',
  messages: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  chatApi.fetchAdminChats.mockImplementation(async (type) => (type === 'aduse' ? [userChat] : []));
  chatApi.sendMessage.mockResolvedValue({ success: true });
  HTMLElement.prototype.scrollIntoView = jest.fn();
});

test('loads chats, sends through the API, and removes only its socket handler', async () => {
  const { unmount } = render(<AdminSupport />);

  expect(await screen.findByRole('button', { name: /Ada/ })).toBeInTheDocument();
  expect(chatApi.fetchAdminChats).toHaveBeenCalledWith('aduse');
  expect(chatApi.fetchAdminChats).toHaveBeenCalledWith('adcom');

  fireEvent.click(screen.getByRole('button', { name: /Ada/ }));
  fireEvent.change(screen.getByPlaceholderText('Type a message...'), {
    target: { value: 'We are on it' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

  await waitFor(() =>
    expect(chatApi.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ chatId: 'chat-1', content: 'We are on it', chatType: 'aduse' })
    )
  );
  await waitFor(() => expect(screen.queryByDisplayValue('We are on it')).not.toBeInTheDocument());

  const registeredHandler = socket.on.mock.calls.find(([event]) => event === 'posts')?.[1];
  expect(registeredHandler).toEqual(expect.any(Function));
  unmount();
  expect(socket.off).toHaveBeenCalledWith('posts', registeredHandler);
});
