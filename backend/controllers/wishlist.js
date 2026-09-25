'use strict';

const asyncHandler = require('../middleware/asyncHandler');
const wishlistService = require('../services/wishlist.service');
const { parseTourId } = require('../validators/wishlist.validator');

exports.add = asyncHandler(async (req, res) => {
  const result = await wishlistService.add(req.user, parseTourId(req.body?.tourId));
  res.status(201).json(result);
});

exports.list = asyncHandler(async (req, res) => {
  const items = await wishlistService.list(req.user);
  res.json({ success: true, wishlist: items });
});

exports.remove = asyncHandler(async (req, res) => {
  const result = await wishlistService.remove(req.user, parseTourId(req.params.tourId));
  res.json(result);
});
