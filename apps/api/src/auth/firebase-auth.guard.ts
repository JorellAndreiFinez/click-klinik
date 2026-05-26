import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { FirebaseAdminService } from './firebase-admin.service';
import type { AuthenticatedRequest } from './authenticated-request';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebaseAdminService: FirebaseAdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token is required.');
    }

    try {
      const token = authorization.slice('Bearer '.length);
      const user = await this.firebaseAdminService.verifyIdToken(token);

      (request as AuthenticatedRequest).user = user;
      return true;
    } catch {
      throw new UnauthorizedException(
        'Authentication token is invalid or expired.',
      );
    }
  }
}
