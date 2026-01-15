import { FavoriteEventModel } from '@models/FavoriteEvent';
import { RegistrationModel } from '@models/Registration';
import { AppError } from '@utils/AppError';
import nodemailer, { SendMailOptions, Transporter } from 'nodemailer';

export interface IEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface IEmailData {
  email: string;
  userName?: string;
  eventTitle?: string;
  eventId?: string;
  role?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private readonly SITE_URL = process.env.SITE_URL || 'https://dotevent.com';

  constructor() {}

  private getTransporter(): Transporter {
    if (!this.transporter) {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('SMTP Credentials missing inside EmailService');
      }

      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    return this.transporter;
  }

  public async verifyConnection(): Promise<void> {
    try {
      const transport = this.getTransporter();
      await transport.verify();
      console.log('Email server is ready to send messages');
    } catch (error) {
      console.error('SMTP connection error:', error);
    }
  }

  public async sendEmail(options: IEmailOptions): Promise<void> {
    try {
      const transport = this.getTransporter();

      const mailOptions: SendMailOptions = {
        from: `"dotEvent" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      await transport.sendMail(mailOptions);
    } catch (error) {
      console.error(error);
      throw new AppError('Failed to send email.', 500);
    }
  }

  private getHtmlLayout(title: string, message: string) {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eeeeee; border-radius: 12px; overflow: hidden; color: #333333;">
        <div style="background-color: #00359e; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px;">dotEvent</h1>
        </div>
        <div style="padding: 40px 30px; line-height: 1.6; text-align: center;">
          <h2 style="color: #00359e; margin-top: 0; font-size: 20px;">${title}</h2>
          <p style="font-size: 16px; color: #555555;">${message}</p>
          <div style="margin-top: 40px;">
            <a href="${this.SITE_URL}" 
               style="background-color: #00359e; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
               Go to Site
            </a>
          </div>
        </div>
        <div style="background-color: #f4f7ff; padding: 25px; text-align: center; font-size: 12px; color: #7f8c8d; border-top: 1px solid #eeeeee;">
          <p style="margin: 0;">&copy; 2026 dotEvent. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  private async getSubscribers(eventId: string) {
    const [registrations, favorites] = await Promise.all([
      RegistrationModel.find({ event: eventId })
        .populate('user', 'email firstName preferences')
        .lean(),
      FavoriteEventModel.find({ event: eventId })
        .populate('user', 'email firstName preferences')
        .lean(),
    ]);

    const usersMap = new Map();

    registrations.forEach((r) => {
      const u = r.user as any;
      if (u && u.email) usersMap.set(u._id.toString(), u);
    });

    favorites.forEach((f) => {
      const u = f.user as any;
      if (u && u.email && !usersMap.has(u._id.toString())) {
        usersMap.set(u._id.toString(), u);
      }
    });

    return Array.from(usersMap.values());
  }

  async sendEventUpdatedEmailNotifications(
    eventId: string,
    eventTitle: string,
  ) {
    const users = await this.getSubscribers(eventId);

    const emailPromises = users.map((user) => {
      // Corecție aici: folosim calea indicată de tine
      const wantsEmail = user.preferences?.emails?.eventUpdated ?? true;

      if (!wantsEmail) return Promise.resolve();

      const html = this.getHtmlLayout(
        'Event Updated',
        `Hi ${
          user.firstName || 'there'
        },<br><br>The event <strong>"${eventTitle}"</strong> has been updated with new details.`,
      );

      return this.sendEmail({
        to: user.email,
        subject: `Update: ${eventTitle}`,
        text: `The event ${eventTitle} has been updated.`,
        html,
      }).catch((err) =>
        console.error(`Error sending email to ${user.email}`, err),
      );
    });

    await Promise.all(emailPromises);
  }

  async sendEventDeletedEmailNotifications(
    eventId: string,
    eventTitle: string,
  ) {
    const users = await this.getSubscribers(eventId);

    const emailPromises = users.map((user) => {
      // Corecție aici: am uniformizat calea preferințelor
      const wantsEmail = user.preferences?.emails?.eventUpdated ?? true;

      if (!wantsEmail) return Promise.resolve();

      const html = this.getHtmlLayout(
        'Event Cancelled',
        `Hi ${
          user.firstName || 'there'
        },<br><br>We regret to inform you that the event <strong>"${eventTitle}"</strong> has been cancelled.`,
      );

      return this.sendEmail({
        to: user.email,
        subject: `Cancelled: ${eventTitle}`,
        text: `The event ${eventTitle} has been cancelled.`,
        html,
      }).catch((err) =>
        console.error(`Error sending email to ${user.email}`, err),
      );
    });

    await Promise.all(emailPromises);
  }

  async sendRoleRequestUpdateEmail(
    data: IEmailData,
    status: 'approved' | 'rejected',
  ) {
    const isApproved = status === 'approved';
    const title = isApproved ? 'Request Approved' : 'Request Update';

    const message = isApproved
      ? `Hi ${
          data.userName || 'there'
        },<br><br>Great news! Your request for the <strong>${
          data.role
        }</strong> role at <strong>${
          data.eventTitle
        }</strong> has been approved.`
      : `Hi ${
          data.userName || 'there'
        },<br><br>Thank you for your interest. Unfortunately, your request for the <strong>${
          data.role
        }</strong> role at <strong>${
          data.eventTitle
        }</strong> was not approved at this time.`;

    await this.sendEmail({
      to: data.email,
      subject: `Role Request ${
        status.charAt(0).toUpperCase() + status.slice(1)
      }`,
      text: `Your role request for ${data.eventTitle} has been ${status}.`,
      html: this.getHtmlLayout(title, message),
    });
  }

  async sendEventReminderEmail(data: IEmailData) {
    const html = this.getHtmlLayout(
      'Event Reminder',
      `Hi ${
        data.userName || 'there'
      },<br><br>Just a friendly reminder that the event <strong>"${
        data.eventTitle
      }"</strong> is starting soon! We hope to see you there.`,
    );

    await this.sendEmail({
      to: data.email,
      subject: `Reminder: ${data.eventTitle} is starting soon!`,
      text: `Reminder: The event ${data.eventTitle} is starting soon!`,
      html,
    }).catch((err) =>
      console.error(`Reminder email failed for ${data.email}`, err),
    );
  }

  async sendEventApprovedEmail(data: IEmailData) {
    const html = this.getHtmlLayout(
      'Event Approved',
      `Hi ${data.userName || 'there'},<br><br>Your event <strong>"${
        data.eventTitle
      }"</strong> has been reviewed and approved by our team. It is now live on the platform!`,
    );

    await this.sendEmail({
      to: data.email,
      subject: `Approved: ${data.eventTitle}`,
      text: `Your event ${data.eventTitle} has been approved!`,
      html,
    }).catch((err) => console.error(err));
  }
}

export default new EmailService();
