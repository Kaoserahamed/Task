const mongoose = require('mongoose');
const config = require('../config/env');
const models = [
  require('../models/tours'),
  require('../models/Booking'),
  require('../models/Review'),
  require('../models/Wishlist'),
  require('../models/company'),
  require('../models/Hotel'),
  require('../models/Restaurant'),
];

async function main() {
  await mongoose.connect(config.mongodb.uri, { serverSelectionTimeoutMS: 30000 });
  for (const model of models) await model.createIndexes();
  console.log(`Created indexes for ${models.length} models`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
