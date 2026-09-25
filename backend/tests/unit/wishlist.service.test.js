'use strict';

const { WishlistService } = require('../../services/wishlist.service');

const TOUR_ID = '64b7f2c4a1b2c3d4e5f60718';

function buildService({ user = { email: 'Ada@Example.com' } } = {}) {
  const users = { findByIdWithoutPassword: jest.fn().mockResolvedValue(user) };
  const wishlists = {
    findByEmail: jest.fn().mockResolvedValue([{ tourId: TOUR_ID }]),
    existsFor: jest.fn().mockResolvedValue(false),
    create: jest.fn().mockResolvedValue({ _id: 'wishlist-1' }),
    deleteFor: jest.fn().mockResolvedValue({ _id: 'wishlist-1' }),
  };
  return { service: new WishlistService({ users, wishlists }), users, wishlists };
}

describe('wishlist service', () => {
  test('lists items for the account named by the verified token', async () => {
    const { service, users, wishlists } = buildService();

    await expect(service.list({ userId: 'user-1' })).resolves.toEqual([{ tourId: TOUR_ID }]);
    expect(users.findByIdWithoutPassword).toHaveBeenCalledWith('user-1');
    expect(wishlists.findByEmail).toHaveBeenCalledWith('ada@example.com');
  });

  test.each([
    { companyId: 'company-1' },
    { isCompany: true },
    { role: 'company' },
    { isAdmin: true },
    { role: 'admin' },
  ])('rejects a non-customer identity: %p', async (identity) => {
    const { service, users } = buildService();

    await expect(service.list(identity)).rejects.toMatchObject({
      status: 403,
      code: 'CUSTOMER_ACCOUNT_REQUIRED',
    });
    expect(users.findByIdWithoutPassword).not.toHaveBeenCalled();
  });

  test('rejects missing and deleted accounts without touching wishlist data', async () => {
    const missing = buildService({ user: null });
    const noIdentity = buildService();

    await expect(noIdentity.service.list({})).rejects.toMatchObject({
      status: 401,
      code: 'ACCOUNT_NOT_FOUND',
    });
    await expect(missing.service.list({ userId: 'deleted' })).rejects.toMatchObject({
      status: 401,
      code: 'ACCOUNT_NOT_FOUND',
    });
    expect(missing.wishlists.findByEmail).not.toHaveBeenCalled();
  });

  test('adds an item under the resolved owner and returns no email', async () => {
    const { service, wishlists } = buildService();

    await expect(service.add({ id: 'user-1' }, TOUR_ID)).resolves.toEqual({
      success: true,
      message: 'Added to wishlist',
      itemId: 'wishlist-1',
    });
    expect(wishlists.existsFor).toHaveBeenCalledWith('ada@example.com', TOUR_ID);
    expect(wishlists.create).toHaveBeenCalledWith({ email: 'ada@example.com', tourId: TOUR_ID });
  });

  test('does not expose the owner email in list results', async () => {
    const { service, wishlists } = buildService();
    wishlists.findByEmail.mockResolvedValue([
      { _id: 'wish-1', email: 'ada@example.com', tourId: TOUR_ID },
    ]);

    const result = await service.list({ userId: 'user-1' });

    expect(result).toEqual([{ _id: 'wish-1', tourId: TOUR_ID }]);
    expect(result[0]).not.toHaveProperty('email');
  });

  test('reports a duplicate as a conflict', async () => {
    const { service, wishlists } = buildService();
    wishlists.existsFor.mockResolvedValue({ _id: 'wishlist-1' });

    await expect(service.add({ userId: 'user-1' }, TOUR_ID)).rejects.toMatchObject({
      status: 409,
      code: 'WISHLIST_ITEM_EXISTS',
    });
    expect(wishlists.create).not.toHaveBeenCalled();
  });

  test('translates a concurrent unique-index collision into a conflict', async () => {
    const { service, wishlists } = buildService();
    const duplicate = new Error('E11000 duplicate key');
    duplicate.code = 11000;
    wishlists.create.mockRejectedValue(duplicate);

    await expect(service.add({ userId: 'user-1' }, TOUR_ID)).rejects.toMatchObject({
      status: 409,
      code: 'WISHLIST_ITEM_EXISTS',
    });
  });

  test('removes the token owner item and reports a missing one as not found', async () => {
    const removed = buildService();
    const missing = buildService();
    missing.wishlists.deleteFor.mockResolvedValue(null);

    await expect(removed.service.remove({ userId: 'user-1' }, TOUR_ID)).resolves.toEqual({
      success: true,
      message: 'Removed from wishlist',
    });
    expect(removed.wishlists.deleteFor).toHaveBeenCalledWith('ada@example.com', TOUR_ID);
    await expect(missing.service.remove({ userId: 'user-1' }, TOUR_ID)).rejects.toMatchObject({
      status: 404,
      code: 'WISHLIST_ITEM_NOT_FOUND',
    });
  });
});
