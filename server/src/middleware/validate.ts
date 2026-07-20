import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

type Source = 'body' | 'query' | 'params';

/** Returns middleware that validates & replaces req[source] with the parsed value. */
export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(result.error);
    }
    // Express 4 allows reassigning these; store parsed (coerced/defaulted) values.
    req[source] = result.data as never;
    next();
  };
}
