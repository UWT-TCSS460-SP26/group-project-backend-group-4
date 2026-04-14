import 'dotenv/config';
import { app } from './app';

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.listen(PORT, (err: Error | undefined) => {
  if (err) {
    // eslint-disable-next-line no-console
    console.error(`Error starting server: ${err}`);
    return;
  }
  if (!isProd) {
    // eslint-disable-next-line no-console
    console.log(`Server running at http://localhost:${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`API docs at http://localhost:${PORT}/api-docs`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`Server running at https://group-project-backend-group-4.onrender.com`);
    // eslint-disable-next-line no-console
    console.log(`API docs at https://group-project-backend-group-4.onrender.com/api-docs`);
  }
});
