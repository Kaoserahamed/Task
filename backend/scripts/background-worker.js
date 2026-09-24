'use strict';

const { dequeue } = require('../utils/redis');
const logger = require('../utils/logger');

async function main() {
  logger.info('background worker started');
  process.on('SIGTERM', async () => {
    await require('../utils/redis').close();
    process.exit(0);
  });
  while (true) {
    const job = await dequeue('background', 5);
    if (!job) continue;
    try {
      logger.info({ jobType: job.type }, 'background job received');
      // Add concrete handlers here as jobs are introduced. The queue contract
      // and worker lifecycle are already usable for retries/dead-letter work.
    } catch (error) {
      logger.error({ err: error, jobType: job.type }, 'background job failed');
    }
  }
}

main().catch((error) => {
  logger.fatal({ err: error }, 'background worker stopped');
  process.exit(1);
});
