'use strict';

const wishlistRepository = require('../repositories/wishlist.repository');
const userRepository = require('../repositories/user.repository');
const {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} = require('../utils/errors');

/** Wishlist ownership and state rules, independent of Express. */
class WishlistService {
  constructor({ wishlists = wishlistRepository, users = userRepository } = {}) {
    this.wishlists = wishlists;
    this.users = users;
  }

  async resolveOwner(identity = {}) {
    if (
      identity.companyId ||
      identity.isCompany === true ||
      identity.isAdmin ||
      identity.role === 'company' ||
      identity.role === 'admin'
    ) {
      throw new ForbiddenError('A customer account is required', 'CUSTOMER_ACCOUNT_REQUIRED');
    }

    const userId = identity.userId || identity.id;
    if (!userId) {
      throw new UnauthorizedError('Authenticated account was not found', 'ACCOUNT_NOT_FOUND');
    }

    const user = await this.users.findByIdWithoutPassword(userId);
    if (!user?.email) {
      throw new UnauthorizedError('Authenticated account was not found', 'ACCOUNT_NOT_FOUND');
    }
    return user.email.trim().toLowerCase();
  }

  async list(identity) {
    const email = await this.resolveOwner(identity);
    const items = await this.wishlists.findByEmail(email);
    return (items || []).map((item) => {
      const publicItem = typeof item?.toObject === 'function' ? item.toObject() : { ...item };
      delete publicItem.email;
      return publicItem;
    });
  }

  async add(identity, tourId) {
    const email = await this.resolveOwner(identity);
    if (await this.wishlists.existsFor(email, tourId)) {
      throw new ConflictError('Already in wishlist', 'WISHLIST_ITEM_EXISTS');
    }

    try {
      const item = await this.wishlists.create({ email, tourId });
      return { success: true, message: 'Added to wishlist', itemId: item._id };
    } catch (error) {
      if (error?.code === 11000) {
        throw new ConflictError('Already in wishlist', 'WISHLIST_ITEM_EXISTS');
      }
      throw error;
    }
  }

  async remove(identity, tourId) {
    const email = await this.resolveOwner(identity);
    const item = await this.wishlists.deleteFor(email, tourId);
    if (!item) {
      throw new NotFoundError('Item not found in wishlist', 'WISHLIST_ITEM_NOT_FOUND');
    }
    return { success: true, message: 'Removed from wishlist' };
  }
}

const service = new WishlistService();
module.exports = service;
module.exports.WishlistService = WishlistService;
