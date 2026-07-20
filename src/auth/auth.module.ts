import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './guards/admin.guard';

@Global()
@Module({
  providers: [SupabaseService, AuthGuard, AdminGuard],
  exports: [SupabaseService, AuthGuard, AdminGuard],
})
export class AuthModule {}

