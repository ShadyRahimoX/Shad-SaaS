import type { ErrorHandler } from 'hono';
import { ZodError } from 'zod';

export const errorHandler: ErrorHandler = (err, c) => {
  console.error('Unhandled API Error:', err);

  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
        },
      },
      400
    );
  }

  const status = (err as any).status || 500;
  return c.json(
    {
      success: false,
      error: {
        code: (err as any).code || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected internal error occurred',
      },
    },
    status
  );
};
