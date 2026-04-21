import 'dotenv/config';
import { app } from './app';

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

if (process.env.DATABASE_URL === undefined) {
  throw new Error('DATABASE_URL is not defined in your .env');
}

app.listen(PORT, (err: Error | undefined) => {
  if (err) {
    console.error(`Error starting server: ${err}`);
    return;
  }
  if (!isProd) {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`API docs at http://localhost:${PORT}/api-docs`);
  } else {
    console.log(`Server running at https://group-project-backend-group-4.onrender.com`);
    console.log(`API docs at https://group-project-backend-group-4.onrender.com/api-docs`);
  }
});
