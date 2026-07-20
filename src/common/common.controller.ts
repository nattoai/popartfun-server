import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmailService } from './services/email.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Test & Health')
@Controller()
export class CommonController {
  constructor(private readonly emailService: EmailService) {}

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        email: this.emailService ? true : false,
        emailConfigured: !!process.env.SENDGRID_API_KEY,
        stripe: !!process.env.STRIPE_SECRET_KEY,
        printful: !!process.env.PRINTFUL_API_KEY,
        mongodb: !!process.env.MONGODB_URI,
        gcs: !!process.env.GCS_BUCKET_NAME,
      },
    };
  }

  @Post('test/email')
  @Public()
  @ApiOperation({ summary: 'Test email sending (development only)' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  async testEmail(@Body() body: { email: string }) {
    if (process.env.NODE_ENV === 'production') {
      return { error: 'Test endpoint disabled in production' };
    }

    const result = await this.emailService.sendEmail({
      to: body.email,
      subject: 'Test Email from PopArtFun',
      text: 'This is a test email from PopArtFun. If you received this, your email service is configured correctly!',
      html: '<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>Test Email from PopArtFun</h2><p>This is a test email from PopArtFun.</p><p><strong>If you received this, your email service is configured correctly!</strong></p></div>',
    });

    return { success: result };
  }
}


