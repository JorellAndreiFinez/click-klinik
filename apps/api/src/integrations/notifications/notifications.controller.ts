import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../../auth/authenticated-request';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(FirebaseAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  listMine(@Req() request: AuthenticatedRequest) {
    return this.notificationsService.listMine(request.user);
  }

  @Patch('me/:id/read')
  markMineAsRead(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markMineAsRead(request.user, id);
  }
}
