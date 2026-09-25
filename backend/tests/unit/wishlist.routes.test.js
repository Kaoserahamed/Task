'use strict';

const request = require('supertest');

const createApp = require('../../app');
const userRepository = require('../../repositories/user.repository');
const wishlistRepository = require('../../repositories/wishlist.repository');
const { signAccessToken } = require('../../utils/token');

jest.mock('../../repositories/user.repository');
jest.mock('../../repositories/wishlist.repository');

const TOUR_ID = '64b7f2c4a1b2c3d4e5f60718';
const customerToken = () => signAccessToken('user-1');
const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe('wishlist HTTP surface', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    userRepository.findByIdWithoutPassword.mockResolvedValue({ _id: 'user-1', email: 'ada@x.io' });
    wishlistRepository.findByEmail.mockResolvedValue([
      { _id: 'wish-1', email: 'ada@x.io', tourId: TOUR_ID },
    ]);
    wishlistRepository.existsFor.mockResolvedValue(false);
    wishlistRepository.create.mockResolvedValue({ _id: 'wishlist-1' });
    wishlistRepository.deleteFor.mockResolvedValue({ _id: 'wishlist-1' });
  });

  test('requires authentication for every wishlist operation', async () => {
    for (const operation of [
      request(app).get('/api/wishlist'),
      request(app).post('/api/wishlist/add').send({ tourId: TOUR_ID }),
      request(app).delete(`/api/wishlist/remove/${TOUR_ID}`),
    ]) {
      expect((await operation).status).toBe(401);
    }
  });

  test('lists the token owner and ignores a forged query email', async () => {
    const res = await request(app)
      .get('/api/wishlist?email=victim@x.io')
      .set(auth(customerToken()));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, wishlist: [{ _id: 'wish-1', tourId: TOUR_ID }] });
    expect(res.body.wishlist[0]).not.toHaveProperty('email');
    expect(wishlistRepository.findByEmail).toHaveBeenCalledWith('ada@x.io');
  });

  test('adds for the token owner and ignores a forged body email', async () => {
    const res = await request(app)
      .post('/api/wishlist/add')
      .set(auth(customerToken()))
      .send({ tourId: TOUR_ID, email: 'victim@x.io' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      success: true,
      message: 'Added to wishlist',
      itemId: 'wishlist-1',
    });
    expect(wishlistRepository.create).toHaveBeenCalledWith({
      email: 'ada@x.io',
      tourId: TOUR_ID,
    });
  });

  test('rejects a malformed tour identifier before persistence', async () => {
    const res = await request(app)
      .post('/api/wishlist/add')
      .set(auth(customerToken()))
      .send({ tourId: 'tour-1' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(wishlistRepository.existsFor).not.toHaveBeenCalled();
  });

  test('returns typed duplicate and missing-item states', async () => {
    wishlistRepository.existsFor.mockResolvedValueOnce({ _id: 'wishlist-1' });
    const duplicate = await request(app)
      .post('/api/wishlist/add')
      .set(auth(customerToken()))
      .send({ tourId: TOUR_ID });

    wishlistRepository.deleteFor.mockResolvedValueOnce(null);
    const missing = await request(app)
      .delete(`/api/wishlist/remove/${TOUR_ID}`)
      .set(auth(customerToken()));

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.code).toBe('WISHLIST_ITEM_EXISTS');
    expect(missing.status).toBe(404);
    expect(missing.body.code).toBe('WISHLIST_ITEM_NOT_FOUND');
  });

  test('removes for the token owner without a body', async () => {
    const res = await request(app)
      .delete(`/api/wishlist/remove/${TOUR_ID}`)
      .set(auth(customerToken()));

    expect(res.status).toBe(200);
    expect(wishlistRepository.deleteFor).toHaveBeenCalledWith('ada@x.io', TOUR_ID);
  });

  test('rejects an admin token as a customer-only resource', async () => {
    const token = signAccessToken('admin-1', { isAdmin: true, role: 'admin' });
    const res = await request(app).get('/api/wishlist').set(auth(token));

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CUSTOMER_ACCOUNT_REQUIRED');
    expect(wishlistRepository.findByEmail).not.toHaveBeenCalled();
  });
});
