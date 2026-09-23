const express = require('express');
const router = express.Router();
const suggestions = require('../controllers/SuggestionController');
router.get('/:tour', suggestions.getSuggestions);
module.exports = router;
