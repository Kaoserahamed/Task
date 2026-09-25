'use strict';

const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const wishlistController = require('../controllers/wishlist');

const router = express.Router();

router.post('/add', authMiddleware, wishlistController.add);
router.get('/', authMiddleware, wishlistController.list);
router.delete('/remove/:tourId', authMiddleware, wishlistController.remove);

module.exports = router;
