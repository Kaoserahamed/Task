'use strict';

const Tour = require('../models/tours');

/**
 * The only module that talks to the `Tour` model.
 *
 * Keeping Mongoose calls here means the service layer can be unit-tested with a
 * stub repository — no database, no binary download — and a future change of
 * driver (or a cache in front of it) never touches business rules.
 */

const DEFAULT_UPDATE_OPTIONS = { new: true, runValidators: true };

const tourRepository = {
  create(data) {
    return Tour.create(data);
  },

  findAll(options) {
    if (!options) return Tour.find();
    const { page, limit } = options;
    return Promise.all([
      Tour.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Tour.countDocuments(),
    ]).then(([items, total]) => ({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }));
  },

  findPage(options) {
    return this.findAll(options);
  },

  findApproved() {
    return Tour.find({ status: 'approved' });
  },

  findPending() {
    return Tour.find({ status: 'pending' });
  },

  findByCompany(companyId) {
    return Tour.find({ companyId });
  },

  findById(id) {
    return Tour.findById(id);
  },

  findFiltered(query) {
    return Tour.find(query).sort({ createdAt: -1 });
  },

  updateById(id, update, options = DEFAULT_UPDATE_OPTIONS) {
    return Tour.findByIdAndUpdate(id, update, options);
  },

  deleteById(id) {
    return Tour.findByIdAndDelete(id);
  },

  incrementCounter(id, path) {
    return Tour.findByIdAndUpdate(id, { $inc: { [path]: 1 } }, { new: true });
  },

  /**
   * Atomically take `seats` off a tour, but only if they are still available.
   * The `availableSeats: { $gte: seats }` guard lives inside the update, so two
   * concurrent buyers can never oversell the last seat. Returns null when the
   * guard did not match (either the tour is gone or it is full).
   */
  reserveSeats(id, seats) {
    return Tour.findOneAndUpdate(
      { _id: id, availableSeats: { $gte: seats } },
      { $inc: { availableSeats: -seats, 'popularity.bookings': 1 } },
      { new: true, runValidators: true }
    );
  },

  suggestByDestinations(destinations) {
    return Tour.find({ 'destinations.name': { $in: destinations }, status: 'approved' });
  },

  suggestByName(name) {
    return Tour.find({ name: { $regex: name, $options: 'i' }, status: 'approved' }).limit(5);
  },
};

module.exports = tourRepository;
