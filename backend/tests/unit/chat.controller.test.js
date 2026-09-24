'use strict';

const Chat = require('../../models/Chat');
const socket = require('../../socket');
const controller = require('../../controllers/chat');

jest.mock('../../models/Chat', () => {
  const Chat = jest.fn((data) => ({
    ...data,
    _id: 'chat-1',
    messages: [],
    unreadCount: 0,
    save: jest.fn().mockResolvedValue(undefined),
  }));
  Chat.find = jest.fn();
  Chat.findById = jest.fn();
  return Chat;
});

jest.mock('../../socket', () => ({ getIO: jest.fn() }));

const chain = (value) => {
  const promise = Promise.resolve(value);
  promise.select = jest.fn(() => promise);
  promise.populate = jest.fn(() => promise);
  return promise;
};

const failedChain = (error) => {
  const promise = Promise.reject(error);
  promise.select = jest.fn(() => promise);
  promise.populate = jest.fn(() => promise);
  return promise;
};

const response = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe('chat controller', () => {
  let io;

  beforeEach(() => {
    jest.clearAllMocks();
    io = { emit: jest.fn() };
    socket.getIO.mockReturnValue(io);
  });

  test('lists company chats and emits user chats', async () => {
    const companyChats = [{ _id: 'chat-1' }];
    const userChats = [{ _id: 'chat-2' }];
    Chat.find.mockReturnValueOnce(chain(companyChats)).mockReturnValueOnce(chain(userChats));
    const res = response();

    await controller.getChat(
      { params: { companyId: 'company-1' }, query: { query: 'adcom' } },
      res
    );
    await controller.getuserChat({ params: { userId: 'user-1' }, query: { query: 'aduse' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(Chat.find).toHaveBeenNthCalledWith(1, { companyId: 'company-1', chatType: 'adcom' });
    expect(Chat.find).toHaveBeenNthCalledWith(2, { participants: 'user-1', chatType: 'aduse' });
    expect(io.emit).toHaveBeenCalledWith('posts', expect.objectContaining({ action: 'userchat' }));
  });

  test('lists all admin chats and fetches one chat', async () => {
    Chat.find.mockReturnValue(chain([{ _id: 'chat-1' }]));
    Chat.findById.mockReturnValue(chain({ _id: 'chat-1', messages: [] }));
    const listResponse = response();
    const oneResponse = response();

    await controller.getAdminchat({ query: { query: 'aduse' } }, listResponse);
    await controller.fetchChat({ params: { chatId: 'chat-1' } }, oneResponse);

    expect(listResponse.status).toHaveBeenCalledWith(200);
    expect(oneResponse.status).toHaveBeenCalledWith(200);
    expect(Chat.findById).toHaveBeenCalledWith('chat-1');
  });

  test('creates a temporary chat and sends its first message', async () => {
    Chat.findById.mockReturnValue(
      chain({ _id: 'chat-1', messages: [], unreadCount: 0, save: jest.fn() })
    );
    const res = response();

    await controller.usersendMessage(
      {
        body: {
          chatId: 'temp_company-1',
          content: 'Hello',
          senderId: 'user-1',
          chatType: 'comuse',
          companyName: 'Ada Tours',
          userName: 'Ada',
          adminId: 'admin-1',
          userId: 'user-1',
        },
      },
      res
    );

    expect(Chat).toHaveBeenCalledWith(expect.objectContaining({ companyId: 'company-1' }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(io.emit).toHaveBeenCalledWith('posts', expect.objectContaining({ action: 'create' }));
  });

  test('adds a message to an existing chat', async () => {
    const chat = {
      _id: 'chat-1',
      messages: [],
      unreadCount: 2,
      save: jest.fn().mockResolvedValue(undefined),
    };
    Chat.findById.mockReturnValueOnce(chain(chat)).mockReturnValueOnce(chain(chat));
    const res = response();

    await controller.usersendMessage(
      { body: { chatId: 'chat-1', content: 'Reply', senderId: 'admin-1' } },
      res
    );

    expect(chat.messages).toHaveLength(1);
    expect(chat.unreadCount).toBe(3);
    expect(chat.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('returns 404 when an existing chat cannot be found', async () => {
    Chat.findById.mockReturnValue(Promise.resolve(null));
    const res = response();

    await controller.usersendMessage(
      { body: { chatId: 'missing', content: 'Reply', senderId: 'user-1' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Chat not found after processing ID.',
    });
  });

  test('turns repository and socket failures into a safe 500', async () => {
    Chat.find.mockReturnValue(failedChain(new Error('chat store unavailable')));
    const listResponse = response();
    await controller.getChat(
      { params: { companyId: 'c1' }, query: { query: 'adcom' } },
      listResponse
    );
    expect(listResponse.status).toHaveBeenCalledWith(500);

    Chat.findById.mockReturnValue(failedChain(new Error('message store unavailable')));
    const sendResponse = response();
    await controller.usersendMessage(
      { body: { chatId: 'chat-1', content: 'Hi', senderId: 'user-1' } },
      sendResponse
    );
    expect(sendResponse.status).toHaveBeenCalledWith(500);
    expect(sendResponse.json).toHaveBeenCalledWith({
      message: 'Failed to send message',
      error: 'message store unavailable',
    });
  });
});
