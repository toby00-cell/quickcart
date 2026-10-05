const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const { locations, FEES } = require('../utils/delivery');

// Delivery states, their LGAs and the delivery fee rule
router.get('/', asyncHandler(async (req, res) => success(res, { states: locations, fees: FEES }, 'Locations fetched')));

module.exports = router;
