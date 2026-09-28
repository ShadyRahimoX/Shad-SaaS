import { Hono } from 'hono';
import { routes } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';

export const app = new Hono();

app.onError(errorHandler);
app.route('/', routes);
