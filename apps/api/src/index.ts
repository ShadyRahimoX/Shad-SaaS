import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

import { serve } from "@hono/node-server";
import { app } from "./app.js";

const port = 3000;

const server = serve({
  fetch: app.fetch,
  port,
});

console.log(`Server is running on port ${port}`);

const shutdown = () => {
  server.close(() => process.exit(0));
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
