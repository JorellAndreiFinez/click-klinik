import type { Request } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';

export type AuthenticatedRequest = Request & {
  user: DecodedIdToken;
};
