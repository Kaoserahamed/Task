'use strict';

const User = require('../models/User');

/**
 * The only module that talks to the `User` model.
 *
 * Keeping Mongoose calls here means the service layer can be unit-tested with a
 * stub repository — no database, no binary download — and a future change of
 * driver (or a cache in front of it) never touches business rules.
 *
 * Every read that can leave the process asks for the password to be projected
 * away. Serialisation is still the service's job, but the password never has to
 * be loaded in the first place.
 */

const PUBLIC_FIELDS = '_id name email avatar phone';
const SEARCH_LIMIT = 10;

const userRepository = {
  create(data) {
    return User.create(data);
  },

  existsByEmail(email) {
    return User.exists({ email });
  },

  findByEmail(email) {
    return User.findOne({ email });
  },

  findById(id) {
    return User.findById(id);
  },

  findByIdWithoutPassword(id) {
    return User.findById(id).select('-password');
  },

  /**
   * Case-insensitive name search for the company directory. The caller passes an
   * already-escaped RegExp, so a query like `[` cannot throw here.
   */
  searchByName(pattern, limit = SEARCH_LIMIT) {
    return User.find({ name: pattern }).select(PUBLIC_FIELDS).limit(limit);
  },

  updateById(id, update) {
    return User.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  },

  setAvatarById(id, avatar) {
    return User.findByIdAndUpdate(id, { avatar }, { new: true }).select('-password');
  },

  setResetToken(email, token, expiresAt) {
    return User.findOneAndUpdate(
      { email },
      { resetToken: token, resetTokenExpiration: expiresAt },
      { new: true }
    );
  },

  findOneByResetToken(token) {
    return User.findOne({ resetToken: token });
  },

  clearResetToken(id) {
    return User.findByIdAndUpdate(
      id,
      { $unset: { resetToken: 1, resetTokenExpiration: 1 } },
      { new: true }
    );
  },

  setPassword(id, password) {
    return User.findByIdAndUpdate(id, { password }, { new: true, runValidators: true });
  },
};

module.exports = userRepository;
