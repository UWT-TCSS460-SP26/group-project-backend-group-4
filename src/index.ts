import 'dotenv/config';
import { app } from './app';
import { loggerUtil as logger } from './utils/logger';

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

if (process.env.DATABASE_URL === undefined) {
  throw new Error('DATABASE_URL is not defined in your .env');
}

app.listen(PORT, (err: Error | undefined) => {
  if (err) {
    logger.error(`Error starting server: ${err}`);
    return;
  }
  if (!isProd) {
    logger.info(`Server running at http://localhost:${PORT}`);
    logger.info(`API docs at http://localhost:${PORT}/api-docs`);
  } else {
    logger.info(`Server running at https://group-project-backend-group-4.onrender.com`);
    logger.info(`API docs at https://group-project-backend-group-4.onrender.com/api-docs`);
  }
});
