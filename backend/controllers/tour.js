'use strict';

const asyncHandler = require('../middleware/asyncHandler');
const tours = require('../services/tour.service');
const { buildCreatePayload, buildUpdatePayload } = require('../validators/tour.validator');
const { parsePagination } = require('../utils/pagination');

/**
 * Tour endpoints — HTTP in, JSON out.
 *
 * The controller has no try/catch and no database access: it reads the request,
 * hands plain data to the service and serialises the result. Errors thrown down
 * the stack (ValidationError, NotFoundError, ...) travel to the central error
 * handler, the single place that knows how to shape a failure.
 */

exports.createTour = asyncHandler(async (req, res) => {
  const payload = buildCreatePayload(req.body, req.files || []);
  const tour = await tours.create(payload);

  res.status(201).json({
    success: true,
    message: 'Tour created successfully',
    tour,
  });
});

exports.getCompanyTours = asyncHandler(async (req, res) => {
  const list = await tours.listByCompany(req.params.companyId);
  res.json({ success: true, tours: list });
});

exports.getTours = asyncHandler(async (req, res) => {
  const wantsPage = req.query.page !== undefined || req.query.limit !== undefined;
  const result = wantsPage
    ? await tours.listAll(parsePagination(req.query))
    : await tours.listAll();
  if (!wantsPage) return res.json({ success: true, tours: result });
  return res.json({
    success: true,
    tours: result.items,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

exports.getApprovedTours = asyncHandler(async (req, res) => {
  const list = await tours.listApproved();

  if (list.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No approved tours found',
      tours: [],
    });
  }

  return res.json({ success: true, count: list.length, tours: list });
});

exports.getTourById = asyncHandler(async (req, res) => {
  const tour = await tours.getById(req.params.id);
  res.json({ success: true, tour });
});

exports.deleteTour = asyncHandler(async (req, res) => {
  await tours.remove(req.params.id);
  res.json({ success: true, message: 'Tour deleted successfully' });
});

exports.updateTourStatus = asyncHandler(async (req, res) => {
  const tour = await tours.updateStatus(req.params.id, req.body);
  res.json({
    success: true,
    message: `Tour status updated to ${tour.status}`,
    tour,
  });
});

exports.updateTour = asyncHandler(async (req, res) => {
  const payload = buildUpdatePayload(req.body, req.files || []);
  const tour = await tours.update(req.params.id, payload);

  res.json({
    success: true,
    message: 'Tour updated successfully',
    tour,
  });
});

exports.filterTours = asyncHandler(async (req, res) => {
  const list = await tours.filter(req.query);
  res.json({ success: true, tours: list });
});

exports.getPendingTours = asyncHandler(async (req, res) => {
  const list = await tours.listPending();
  res.json({ success: true, tours: list });
});

exports.incrementViewCount = asyncHandler(async (req, res) => {
  const tour = await tours.incrementViews(req.params.id);
  res.json({
    success: true,
    message: 'View count incremented',
    views: tour.popularity.views,
  });
});

exports.incrementBookingCount = asyncHandler(async (req, res) => {
  const tour = await tours.incrementBookings(req.params.id);
  res.json({
    success: true,
    message: 'Booking count incremented',
    bookings: tour.popularity.bookings,
  });
});

exports.bookSeats = asyncHandler(async (req, res) => {
  const seats = req.seats || Number(req.body.seatsToBook);
  const tour = await tours.bookSeats(req.params.id, seats);

  res.json({
    success: true,
    message: 'Seats booked successfully',
    tour,
    seatsBooked: seats,
    remainingSeats: tour.availableSeats,
  });
});

exports.releaseSeats = asyncHandler(async (req, res) => {
  const seats = req.seats || Number(req.body.seatsToRelease);
  const tour = await tours.releaseSeats(req.params.id, seats);

  res.json({
    success: true,
    message: 'Seats released successfully',
    tour,
    seatsReleased: seats,
    availableSeats: tour.availableSeats,
  });
});

exports.getSeatAvailability = asyncHandler(async (req, res) => {
  const availability = await tours.seatAvailability(req.params.id);
  res.json({ success: true, ...availability });
});

exports.suggestTours = asyncHandler(async (req, res) => {
  const list = await tours.suggestByDestinations(req.query.destinations);
  res.json({ success: true, tours: list });
});

exports.getSuggestions = asyncHandler(async (req, res) => {
  const suggestions = await tours.suggestByName(req.params.tourName);
  res.json({ success: true, suggestions });
});
