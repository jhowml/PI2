import 'dotenv/config';
import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/database';

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('Database connected.');

    app.listen(env.PORT, () => {
      logger.info(`Server running at http://localhost:${env.PORT}`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server.');
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

bootstrap();
