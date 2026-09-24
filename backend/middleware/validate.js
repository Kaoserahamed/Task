'use strict';

/**
 * Deprecated location of the tour validators.
 *
 * Validation now lives in `validators/tour.validator.js`, next to the payload
 * builders it shares helpers with. This shim keeps older imports working; new
 * code should require the validator module directly.
 */

module.exports = require('../validators/tour.validator');
