'use strict';

const repository = require('../repositories/tour.repository');
const realtime = require('../utils/realtime');
const logger = require('../utils/logger');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { TOUR_STATUSES, buildFilterQuery } = require('../validators/tour.validator');

/**
 * Tour business rules.
 *
 * The service knows nothing about HTTP: it receives plain objects, throws typed
 * errors and returns documents. Its collaborators — the repository, the
 * real-time emitter and the logger — are constructor arguments so tests can
 * drive every branch with in-memory stubs (no database, no sockets).
 */

class TourService {
  constructor({ tours = repository, events = realtime, log = logger } = {}) {
    this.tours = tours;
    this.events = events;
    this.log = log;
  }

  listAll() {
    return this.tours.findAll();
  }

  listApproved() {
    return this.tours.findApproved();
  }

  listPending() {
    return this.tours.findPending();
  }

  /**
   * Tours belonging to one company. The front-ends treat a missing company as a
   * client error, not an empty result, so it stays a 400.
   */
  listByCompany(companyId) {
    if (!companyId) {
      throw new ValidationError("'companyId' is required");
    }
    return this.tours.findByCompany(companyId);
  }

  async getById(id) {
    const tour = await this.tours.findById(id);
    if (!tour) {
      throw new NotFoundError('Tour not found');
    }
    return tour;
  }

  filter({ category, tourType }) {
    return this.tours.findFiltered(buildFilterQuery({ category, tourType }));
  }

  async create(payload) {
    const tour = await this.tours.create(payload);
    this.log.info({ tourId: String(tour._id) }, 'tour created');
    this.events.emit('tour_created', { action: 'create', tour });
    return tour;
  }

  async update(id, payload) {
    const tour = await this.tours.updateById(id, payload);
    if (!tour) {
      throw new NotFoundError('Tour not found');
    }
    return tour;
  }

  /** Approve / reject / reset a submitted tour. */
  async updateStatus(id, { status, review } = {}) {
    if (!TOUR_STATUSES.includes(status)) {
      throw new ValidationError(`'status' must be one of ${TOUR_STATUSES.join(', ')}`);
    }

    const update = { status };
    if (status === 'rejected') {
      update.review = review || 'No review provided';
    }

    const tour = await this.tours.updateById(
      id,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!tour) {
      throw new NotFoundError('Tour not found');
    }

    this.events.emit('tour_status_update', { tourId: String(tour._id), status });
    return tour;
  }

  /** Delete a tour and the local files that belonged to it. */
  async remove(id) {
    const tour = await this.tours.findById(id);
    if (!tour) {
      throw new NotFoundError('Tour not found');
    }

    await this.tours.deleteById(id);
    this.removeLocalImages(tour.images);
    this.log.info({ tourId: String(id) }, 'tour deleted');
    return tour;
  }

  /**
   * Local uploads are deleted from disk; Cloudinary URLs (http/https) are left
   * alone — they are not files this process can remove.
   */
  removeLocalImages(images = []) {
    const fs = require('fs');
    let removed = 0;

    for (const imagePath of images) {
      if (!imagePath || /^https?:\/\//i.test(imagePath)) continue;
      try {
        fs.unlinkSync(imagePath);
        removed += 1;
      } catch (error) {
        this.log.warn({ imagePath, err: error }, 'could not delete tour image');
      }
    }

    return removed;
  }

  async incrementViews(id) {
    const tour = await this.tours.incrementCounter(id, 'popularity.views');
    if (!tour) {
      throw new NotFoundError('Tour not found');
    }
    return tour;
  }

  async incrementBookings(id) {
    const tour = await this.tours.incrementCounter(id, 'popularity.bookings');
    if (!tour) {
      throw new NotFoundError('Tour not found');
    }
    return tour;
  }

  /**
   * Take seats off a tour. The repository performs the check-and-decrement in a
   * single atomic update, so two simultaneous bookings can never oversell.
   */
  async bookSeats(id, seats) {
    const tour = await this.tours.reserveSeats(id, seats);
    if (tour) {
      this.events.emit('seats_booked', { tourId: String(tour._id), seats });
      return tour;
    }

    // The guarded update matched nothing: either the tour is gone or it is the
    // seat count that failed. Re-read to answer with the precise reason.
    const existing = await this.tours.findById(id);
    if (!existing) {
      throw new NotFoundError('Tour not found');
    }

    const available = Number(existing.availableSeats) || 0;
    throw new ValidationError(`Only ${available} seat${available !== 1 ? 's' : ''} available`, {
      availableSeats: available,
    });
  }

  /** Give seats back (cancellation) without ever exceeding the group size. */
  async releaseSeats(id, seats) {
    const tour = await this.tours.findById(id);
    if (!tour) {
      throw new NotFoundError('Tour not found');
    }

    const available = Number(tour.availableSeats) || 0;
    const groupSize = Number(tour.maxGroupSize) || available + seats;
    tour.availableSeats = Math.min(available + seats, groupSize);

    if (tour.popularity && tour.popularity.bookings > 0) {
      tour.popularity.bookings -= 1;
    }

    return tour.save();
  }

  async seatAvailability(id) {
    const tour = await this.tours.findById(id);
    if (!tour) {
      throw new NotFoundError('Tour not found');
    }

    return {
      tourId: tour._id,
      tourName: tour.name,
      maxGroupSize: tour.maxGroupSize || null,
      availableSeats: tour.availableSeats,
      totalBookings: tour.popularity ? tour.popularity.bookings : 0,
    };
  }

  async suggestByDestinations(destinations) {
    if (!destinations) {
      throw new ValidationError('Destinations parameter is required');
    }
    const list = Array.isArray(destinations) ? destinations : [destinations];
    return this.tours.suggestByDestinations(list);
  }

  suggestByName(name) {
    return this.tours.suggestByName(name);
  }
}

const tourService = new TourService();

module.exports = tourService;
module.exports.TourService = TourService;
