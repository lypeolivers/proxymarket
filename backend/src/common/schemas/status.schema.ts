import { z } from 'zod';

export const Status = z.enum(['active', 'inactive', 'blocked', 'pending']);
