import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthenticatedRequest } from './authenticated-request';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const email =
      typeof request.user.email === 'string'
        ? request.user.email.trim().toLowerCase()
        : '';
    const allowedEmails = this.configService
      .get<string>('SUPERADMIN_EMAILS', '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (
      !request.user.email_verified ||
      !email ||
      !allowedEmails.includes(email)
    ) {
      throw new ForbiddenException('Superadmin access is required.');
    }

    return true;
  }
}
