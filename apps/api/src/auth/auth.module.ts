import { Module } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { SuperAdminGuard } from './super-admin.guard';

@Module({
  providers: [FirebaseAdminService, FirebaseAuthGuard, SuperAdminGuard],
  exports: [FirebaseAdminService, FirebaseAuthGuard, SuperAdminGuard],
})
export class AuthModule {}
