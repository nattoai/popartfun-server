import { Injectable, Logger } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { Resend } from 'resend';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
  subtotal: string;
  shippingCost: string;
  taxAmount: string;
  total: string;
  shippingAddress: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    stateCode?: string;
    zip: string;
    countryCode: string;
  };
}

type EmailProvider = 'sendgrid' | 'resend' | 'none';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly enabled: boolean;
  private readonly provider: EmailProvider;
  private resend: Resend | null = null;

  constructor() {
    // Check for Resend first (preferred), then SendGrid
    const resendApiKey = process.env.RESEND_API_KEY;
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    
    // Use EMAIL_FROM_* for provider-agnostic config, fallback to SENDGRID_* for backwards compatibility
    this.fromEmail = process.env.EMAIL_FROM_ADDRESS || process.env.SENDGRID_FROM_EMAIL || 'noreply@popartfun.com';
    this.fromName = process.env.EMAIL_FROM_NAME || process.env.SENDGRID_FROM_NAME || 'PopArtFun';
    
    if (resendApiKey) {
      this.resend = new Resend(resendApiKey);
      this.provider = 'resend';
      this.enabled = true;
      this.logger.log('Resend email service initialized');
    } else if (sendgridApiKey) {
      sgMail.setApiKey(sendgridApiKey);
      this.provider = 'sendgrid';
      this.enabled = true;
      this.logger.log('SendGrid email service initialized');
    } else {
      this.provider = 'none';
      this.enabled = false;
      this.logger.warn('No email API key configured (RESEND_API_KEY or SENDGRID_API_KEY) - email notifications disabled');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.enabled) {
      this.logger.warn('Email service disabled - skipping email send');
      return false;
    }

    try {
      if (this.provider === 'resend' && this.resend) {
        // Use type assertion as Resend SDK types are overly strict
        await this.resend.emails.send({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: options.to,
          subject: options.subject,
          ...(options.text && { text: options.text }),
          ...(options.html && { html: options.html }),
        } as any);
      } else if (this.provider === 'sendgrid') {
        const msg = {
          to: options.to,
          from: {
            email: this.fromEmail,
            name: this.fromName,
          },
          subject: options.subject,
          ...(options.text && { text: options.text }),
          ...(options.html && { html: options.html }),
        };
        await sgMail.send(msg as any);
      }

      this.logger.log(`Email sent successfully to ${options.to} via ${this.provider}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to} via ${this.provider}:`, error);
      return false;
    }
  }

  async sendOrderConfirmation(data: OrderConfirmationData): Promise<boolean> {
    const subject = `Order Confirmation #${data.orderNumber} - PopArtFun`;
    
    const html = this.generateOrderConfirmationHTML(data);
    const text = this.generateOrderConfirmationText(data);

    return this.sendEmail({
      to: data.customerEmail,
      subject,
      html,
      text,
    });
  }

  async sendContactFormEmail(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<boolean> {
    const companyEmail = process.env.COMPANY_EMAIL || this.fromEmail;
    
    const html = `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${data.name} (${data.email})</p>
      <p><strong>Subject:</strong> ${data.subject}</p>
      <p><strong>Message:</strong></p>
      <p>${data.message.replace(/\n/g, '<br>')}</p>
    `;

    const text = `
New Contact Form Submission

From: ${data.name} (${data.email})
Subject: ${data.subject}

Message:
${data.message}
    `;

    return this.sendEmail({
      to: companyEmail,
      subject: `Contact Form: ${data.subject}`,
      html,
      text,
    });
  }

  async sendOrderShippedEmail(data: {
    orderNumber: string;
    customerEmail: string;
    trackingNumber: string;
    trackingUrl: string;
    carrier: string;
  }): Promise<boolean> {
    const subject = `Your Order Has Shipped! - Order #${data.orderNumber}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Shipped</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #10b981; padding: 20px; border-radius: 8px; margin-bottom: 20px; color: white;">
    <h1 style="margin: 0;">📦 Your Order Has Shipped!</h1>
    <p style="margin: 10px 0 0 0;">Order #${data.orderNumber}</p>
  </div>

  <div style="margin-bottom: 20px;">
    <p>Great news! Your order has been shipped and is on its way to you.</p>
  </div>

  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; font-size: 18px;">Tracking Information</h2>
    <p><strong>Carrier:</strong> ${data.carrier}</p>
    <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
    ${data.trackingUrl ? `<p><a href="${data.trackingUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Track Your Package</a></p>` : ''}
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
    <p>If you have any questions, please contact us at ${process.env.COMPANY_EMAIL || 'support@popartfun.com'}.</p>
    <p style="margin-bottom: 0;">Thank you for shopping with PopArtFun!</p>
  </div>
</body>
</html>
    `;

    const text = `
Your Order Has Shipped!

Order #${data.orderNumber}

Great news! Your order has been shipped and is on its way to you.

Tracking Information:
Carrier: ${data.carrier}
Tracking Number: ${data.trackingNumber}
${data.trackingUrl ? `Tracking URL: ${data.trackingUrl}` : ''}

If you have any questions, please contact us at ${process.env.COMPANY_EMAIL || 'support@popartfun.com'}.

Thank you for shopping with PopArtFun!
    `;

    return this.sendEmail({
      to: data.customerEmail,
      subject,
      html,
      text,
    });
  }

  async sendOrderStatusUpdateEmail(data: {
    orderNumber: string;
    customerEmail: string;
    status: string;
    message: string;
  }): Promise<boolean> {
    const subject = `Order Update - Order #${data.orderNumber}`;
    
    const statusColors: Record<string, string> = {
      processing: '#3b82f6',
      shipped: '#10b981',
      delivered: '#059669',
      cancelled: '#ef4444',
      failed: '#dc2626',
    };

    const statusColor = statusColors[data.status] || '#6b7280';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Update</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: ${statusColor}; padding: 20px; border-radius: 8px; margin-bottom: 20px; color: white;">
    <h1 style="margin: 0;">Order Status Update</h1>
    <p style="margin: 10px 0 0 0;">Order #${data.orderNumber}</p>
  </div>

  <div style="margin-bottom: 20px;">
    <p><strong>Status:</strong> ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}</p>
  </div>

  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <p>${data.message}</p>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
    <p>If you have any questions, please contact us at ${process.env.COMPANY_EMAIL || 'support@popartfun.com'}.</p>
    <p style="margin-bottom: 0;">Thank you for shopping with PopArtFun!</p>
  </div>
</body>
</html>
    `;

    const text = `
Order Status Update

Order #${data.orderNumber}

Status: ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}

${data.message}

If you have any questions, please contact us at ${process.env.COMPANY_EMAIL || 'support@popartfun.com'}.

Thank you for shopping with PopArtFun!
    `;

    return this.sendEmail({
      to: data.customerEmail,
      subject,
      html,
      text,
    });
  }

  private generateOrderConfirmationHTML(data: OrderConfirmationData): string {
    const itemsHTML = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price}</td>
        </tr>
      `,
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin: 0;">Order Confirmed!</h1>
    <p style="margin: 10px 0 0 0; color: #666;">Thank you for your order, ${data.customerName}!</p>
  </div>

  <div style="margin-bottom: 20px;">
    <p>Your order has been received and will begin production shortly.</p>
    <p><strong>Order Number:</strong> ${data.orderNumber}</p>
  </div>

  <h2 style="color: #1f2937; font-size: 18px; margin-top: 30px;">Order Details</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <thead>
      <tr style="background-color: #f3f4f6;">
        <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
        <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
        <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <table style="width: 100%; margin-bottom: 20px;">
    <tr>
      <td style="padding: 5px; text-align: right;"><strong>Subtotal:</strong></td>
      <td style="padding: 5px; text-align: right; width: 120px;">${data.subtotal}</td>
    </tr>
    <tr>
      <td style="padding: 5px; text-align: right;"><strong>Shipping:</strong></td>
      <td style="padding: 5px; text-align: right;">${data.shippingCost}</td>
    </tr>
    <tr>
      <td style="padding: 5px; text-align: right;"><strong>Tax:</strong></td>
      <td style="padding: 5px; text-align: right;">${data.taxAmount}</td>
    </tr>
    <tr style="border-top: 2px solid #ddd;">
      <td style="padding: 10px 5px; text-align: right; font-size: 18px;"><strong>Total:</strong></td>
      <td style="padding: 10px 5px; text-align: right; font-size: 18px;"><strong>${data.total}</strong></td>
    </tr>
  </table>

  <h2 style="color: #1f2937; font-size: 18px; margin-top: 30px;">Shipping Address</h2>
  <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
    <p style="margin: 5px 0;">${data.shippingAddress.name}</p>
    <p style="margin: 5px 0;">${data.shippingAddress.address1}</p>
    ${data.shippingAddress.address2 ? `<p style="margin: 5px 0;">${data.shippingAddress.address2}</p>` : ''}
    <p style="margin: 5px 0;">${data.shippingAddress.city}${data.shippingAddress.stateCode ? `, ${data.shippingAddress.stateCode}` : ''} ${data.shippingAddress.zip}</p>
    <p style="margin: 5px 0;">${data.shippingAddress.countryCode}</p>
  </div>

  <h2 style="color: #1f2937; font-size: 18px; margin-top: 30px;">What's Next?</h2>
  <ul style="color: #666;">
    <li>Your products will be printed and prepared for shipping</li>
    <li>You'll receive a shipping confirmation email with tracking information once your order ships</li>
    <li>Estimated delivery: 7-14 business days</li>
  </ul>

  <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; margin-top: 30px;">
    <p style="margin: 0; color: #1e40af;">
      <strong>Questions?</strong> Contact us at ${this.fromEmail}
    </p>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} PopArtFun. All rights reserved.</p>
  </div>
</body>
</html>
    `;
  }

  async sendOrderCancelledEmail(data: {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    reason?: string;
    refundAmount?: number;
  }): Promise<boolean> {
    const subject = `Order Cancelled - Order #${data.orderNumber}`;
    
    const refundMessage = data.refundAmount 
      ? `<p>A refund of <strong>$${data.refundAmount.toFixed(2)}</strong> has been initiated and will be processed within 5-10 business days.</p>`
      : '';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Cancelled</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ef4444; padding: 20px; border-radius: 8px; margin-bottom: 20px; color: white;">
    <h1 style="margin: 0;">Order Cancelled</h1>
    <p style="margin: 10px 0 0 0;">Order #${data.orderNumber}</p>
  </div>

  <div style="margin-bottom: 20px;">
    <p>Hi ${data.customerName},</p>
    <p>Your order has been cancelled${data.reason ? `: ${data.reason}` : '.'}</p>
    ${refundMessage}
  </div>

  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <p>If you didn't request this cancellation or have any questions, please contact our support team immediately.</p>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
    <p>If you have any questions, please contact us at ${process.env.COMPANY_EMAIL || 'support@popartfun.com'}.</p>
    <p style="margin-bottom: 0;">Thank you for your understanding.</p>
  </div>
</body>
</html>
    `;

    const text = `
Order Cancelled

Order #${data.orderNumber}

Hi ${data.customerName},

Your order has been cancelled${data.reason ? `: ${data.reason}` : '.'}

${data.refundAmount ? `A refund of $${data.refundAmount.toFixed(2)} has been initiated and will be processed within 5-10 business days.` : ''}

If you didn't request this cancellation or have any questions, please contact our support team immediately.

If you have any questions, please contact us at ${process.env.COMPANY_EMAIL || 'support@popartfun.com'}.

Thank you for your understanding.
    `;

    return this.sendEmail({
      to: data.customerEmail,
      subject,
      html,
      text,
    });
  }

  async sendRefundProcessedEmail(data: {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    refundAmount: number;
    reason: string;
  }): Promise<boolean> {
    const subject = `Refund Processed - Order #${data.orderNumber}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Refund Processed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #10b981; padding: 20px; border-radius: 8px; margin-bottom: 20px; color: white;">
    <h1 style="margin: 0;">💰 Refund Processed</h1>
    <p style="margin: 10px 0 0 0;">Order #${data.orderNumber}</p>
  </div>

  <div style="margin-bottom: 20px;">
    <p>Hi ${data.customerName},</p>
    <p>We've processed a refund for your order.</p>
  </div>

  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; font-size: 18px;">Refund Details</h2>
    <p><strong>Amount:</strong> $${data.refundAmount.toFixed(2)}</p>
    <p><strong>Reason:</strong> ${data.reason}</p>
    <p style="margin-bottom: 0; color: #666; font-size: 14px;">The refund will appear in your account within 5-10 business days, depending on your bank.</p>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
    <p>If you have any questions, please contact us at ${process.env.COMPANY_EMAIL || 'support@popartfun.com'}.</p>
    <p style="margin-bottom: 0;">Thank you for shopping with PopArtFun!</p>
  </div>
</body>
</html>
    `;

    const text = `
Refund Processed

Order #${data.orderNumber}

Hi ${data.customerName},

We've processed a refund for your order.

Refund Details:
Amount: $${data.refundAmount.toFixed(2)}
Reason: ${data.reason}

The refund will appear in your account within 5-10 business days, depending on your bank.

If you have any questions, please contact us at ${process.env.COMPANY_EMAIL || 'support@popartfun.com'}.

Thank you for shopping with PopArtFun!
    `;

    return this.sendEmail({
      to: data.customerEmail,
      subject,
      html,
      text,
    });
  }

  async sendOrderDeliveredEmail(data: {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
  }): Promise<boolean> {
    const subject = `Your Order Has Been Delivered! - Order #${data.orderNumber}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Delivered</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #059669; padding: 20px; border-radius: 8px; margin-bottom: 20px; color: white;">
    <h1 style="margin: 0;">🎉 Order Delivered!</h1>
    <p style="margin: 10px 0 0 0;">Order #${data.orderNumber}</p>
  </div>

  <div style="margin-bottom: 20px;">
    <p>Hi ${data.customerName},</p>
    <p>Great news! Your order has been delivered. We hope you love your new custom creation!</p>
  </div>

  <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; font-size: 18px;">📸 Share Your Creation!</h2>
    <p>We'd love to see your new product! Tag us on social media or leave a review.</p>
  </div>

  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; font-size: 18px;">Need Help?</h2>
    <p>If there's any issue with your order, please contact us within 14 days and we'll make it right.</p>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
    <p>If you have any questions, please contact us at ${process.env.COMPANY_EMAIL || 'support@popartfun.com'}.</p>
    <p style="margin-bottom: 0;">Thank you for shopping with PopArtFun!</p>
  </div>
</body>
</html>
    `;

    const text = `
Order Delivered!

Order #${data.orderNumber}

Hi ${data.customerName},

Great news! Your order has been delivered. We hope you love your new custom creation!

Share Your Creation!
We'd love to see your new product! Tag us on social media or leave a review.

Need Help?
If there's any issue with your order, please contact us within 14 days and we'll make it right.

If you have any questions, please contact us at ${process.env.COMPANY_EMAIL || 'support@popartfun.com'}.

Thank you for shopping with PopArtFun!
    `;

    return this.sendEmail({
      to: data.customerEmail,
      subject,
      html,
      text,
    });
  }

  async sendProblemReportConfirmation(data: {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    problemType: string;
    problemId: string;
  }): Promise<boolean> {
    const subject = `We've Received Your Report - Order #${data.orderNumber}`;
    
    const problemTypeLabels: Record<string, string> = {
      damaged: 'Damaged Item',
      wrong_item: 'Wrong Item Received',
      missing_item: 'Missing Item',
      quality_issue: 'Quality Issue',
      shipping_issue: 'Shipping Issue',
      not_received: 'Order Not Received',
      other: 'Other Issue',
    };

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Problem Report Received</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #3b82f6; padding: 20px; border-radius: 8px; margin-bottom: 20px; color: white;">
    <h1 style="margin: 0;">📋 We've Received Your Report</h1>
    <p style="margin: 10px 0 0 0;">Order #${data.orderNumber}</p>
  </div>

  <div style="margin-bottom: 20px;">
    <p>Hi ${data.customerName},</p>
    <p>We're sorry to hear you're having an issue with your order. We've received your report and our team will review it shortly.</p>
  </div>

  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; font-size: 18px;">Report Details</h2>
    <p><strong>Report ID:</strong> ${data.problemId}</p>
    <p><strong>Issue Type:</strong> ${problemTypeLabels[data.problemType] || data.problemType}</p>
  </div>

  <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; font-size: 18px;">What's Next?</h2>
    <ul style="margin-bottom: 0;">
      <li>Our team will review your report within 1-2 business days</li>
      <li>We may reach out for additional information if needed</li>
      <li>You'll receive an email once we've resolved your issue</li>
    </ul>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
    <p>If you have any urgent questions, please contact us at ${process.env.COMPANY_EMAIL || 'support@popartfun.com'}.</p>
    <p style="margin-bottom: 0;">Thank you for your patience!</p>
  </div>
</body>
</html>
    `;

    const text = `
We've Received Your Report

Order #${data.orderNumber}

Hi ${data.customerName},

We're sorry to hear you're having an issue with your order. We've received your report and our team will review it shortly.

Report Details:
Report ID: ${data.problemId}
Issue Type: ${problemTypeLabels[data.problemType] || data.problemType}

What's Next?
- Our team will review your report within 1-2 business days
- We may reach out for additional information if needed
- You'll receive an email once we've resolved your issue

If you have any urgent questions, please contact us at ${process.env.COMPANY_EMAIL || 'support@popartfun.com'}.

Thank you for your patience!
    `;

    return this.sendEmail({
      to: data.customerEmail,
      subject,
      html,
      text,
    });
  }

  async sendProblemResolvedEmail(data: {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    resolution: string;
    resolutionNote?: string;
    refundAmount?: number;
  }): Promise<boolean> {
    const subject = `Issue Resolved - Order #${data.orderNumber}`;
    
    const resolutionLabels: Record<string, string> = {
      refund: 'Full Refund',
      replacement: 'Replacement Sent',
      partial_refund: 'Partial Refund',
      no_action: 'No Action Required',
      other: 'Other Resolution',
    };

    const refundMessage = data.refundAmount 
      ? `<p><strong>Refund Amount:</strong> $${data.refundAmount.toFixed(2)}</p><p style="color: #666; font-size: 14px;">The refund will appear in your account within 5-10 business days.</p>`
      : '';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Issue Resolved</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #10b981; padding: 20px; border-radius: 8px; margin-bottom: 20px; color: white;">
    <h1 style="margin: 0;">✅ Issue Resolved</h1>
    <p style="margin: 10px 0 0 0;">Order #${data.orderNumber}</p>
  </div>

  <div style="margin-bottom: 20px;">
    <p>Hi ${data.customerName},</p>
    <p>Good news! We've resolved the issue you reported with your order.</p>
  </div>

  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; font-size: 18px;">Resolution Details</h2>
    <p><strong>Resolution:</strong> ${resolutionLabels[data.resolution] || data.resolution}</p>
    ${data.resolutionNote ? `<p><strong>Note:</strong> ${data.resolutionNote}</p>` : ''}
    ${refundMessage}
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
    <p>If you have any further questions, please contact us at ${process.env.COMPANY_EMAIL || 'support@popartfun.com'}.</p>
    <p style="margin-bottom: 0;">Thank you for your patience and for shopping with PopArtFun!</p>
  </div>
</body>
</html>
    `;

    const text = `
Issue Resolved

Order #${data.orderNumber}

Hi ${data.customerName},

Good news! We've resolved the issue you reported with your order.

Resolution Details:
Resolution: ${resolutionLabels[data.resolution] || data.resolution}
${data.resolutionNote ? `Note: ${data.resolutionNote}` : ''}
${data.refundAmount ? `Refund Amount: $${data.refundAmount.toFixed(2)}\nThe refund will appear in your account within 5-10 business days.` : ''}

If you have any further questions, please contact us at ${process.env.COMPANY_EMAIL || 'support@popartfun.com'}.

Thank you for your patience and for shopping with PopArtFun!
    `;

    return this.sendEmail({
      to: data.customerEmail,
      subject,
      html,
      text,
    });
  }

  private generateOrderConfirmationText(data: OrderConfirmationData): string {
    const itemsText = data.items
      .map((item) => `${item.name} x${item.quantity} - ${item.price}`)
      .join('\n');

    return `
ORDER CONFIRMED!

Thank you for your order, ${data.customerName}!

Order Number: ${data.orderNumber}

ORDER DETAILS
${itemsText}

Subtotal: ${data.subtotal}
Shipping: ${data.shippingCost}
Tax: ${data.taxAmount}
Total: ${data.total}

SHIPPING ADDRESS
${data.shippingAddress.name}
${data.shippingAddress.address1}
${data.shippingAddress.address2 || ''}
${data.shippingAddress.city}${data.shippingAddress.stateCode ? `, ${data.shippingAddress.stateCode}` : ''} ${data.shippingAddress.zip}
${data.shippingAddress.countryCode}

WHAT'S NEXT?
- Your products will be printed and prepared for shipping
- You'll receive a shipping confirmation email with tracking information once your order ships
- Estimated delivery: 7-14 business days

Questions? Contact us at ${this.fromEmail}

© ${new Date().getFullYear()} PopArtFun. All rights reserved.
    `;
  }
}

