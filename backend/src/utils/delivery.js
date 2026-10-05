const locations = require('../data/locations.json');

// Delivery fee rule: Lagos is cheaper, everywhere else is a flat rate
const FEES = { Lagos: 1500, default: 3500 };

const getDeliveryFee = (state) => (state === 'Lagos' ? FEES.Lagos : FEES.default);

const isValidLocation = (state, lga) => Array.isArray(locations[state]) && locations[state].includes(lga);

module.exports = { locations, FEES, getDeliveryFee, isValidLocation };
