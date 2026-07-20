import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Check if user has admin role
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((email) => email.trim()) || [];

    if (adminEmails.length === 0) {
      this.logger.warn('No admin emails configured in ADMIN_EMAILS environment variable');
      throw new ForbiddenException('Admin access not configured');
    }

    const isAdmin = adminEmails.includes(user.email);

    if (!isAdmin) {
      this.logger.warn(`Access denied for user: ${user.email}`);
      throw new ForbiddenException('Admin access required');
    }

    this.logger.log(`Admin access granted for user: ${user.email}`);
    return true;
  }
}


