import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EmailService } from './services/email.service';

class ContactFormDto {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  @ApiOperation({ summary: 'Send contact form message' })
  async sendContactForm(@Body() dto: ContactFormDto) {
    const success = await this.emailService.sendContactFormEmail(dto);
    
    if (!success) {
      return {
        success: false,
        message: 'Email service is not configured or failed to send',
      };
    }

    return {
      success: true,
      message: 'Your message has been sent successfully',
    };
  }
}


