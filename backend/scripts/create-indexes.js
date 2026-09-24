const mongoose = require('mongoose');
const config = require('../config/env');
const logger = require('../utils/logger');
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
  logger.info({ modelCount: models.length }, 'database indexes created');
}

main()
  .catch((error) => {
    logger.error({ err: error }, 'index creation failed');
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
