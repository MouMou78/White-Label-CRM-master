import nodemailer from 'nodemailer';
import { getDb } from './db';
import { emailAccounts } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Send email using user's connected email account
   */
  async sendEmail(userId: string, options: EmailOptions): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get user's default email account
    const accountsList = await db.select().from(emailAccounts)
      .where(and(
        eq(emailAccounts.userId, userId),
        eq(emailAccounts.isDefault, true)
      ));

    if (accountsList.length === 0) {
      throw new Error('No default email account configured. Please connect an email account in Settings → Email Accounts.');
    }

    const account = accountsList[0];

    // Create transporter using account's SMTP settings
    const transporter = nodemailer.createTransport({
      host: account.smtpHost || '',
      port: account.smtpPort || 587,
      secure: account.smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: account.smtpUser || '',
        pass: account.smtpPass || '',
      },
    } as any);

    // Send email
    await transporter.sendMail({
      from: account.email,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });
  }

  /**
   * Send email using a specific email account
   */
  async sendEmailWithAccount(accountId: string, options: EmailOptions): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const accountsList = await db.select().from(emailAccounts)
      .where(eq(emailAccounts.id, accountId));
    
    const account = accountsList[0];

    if (!account) {
      throw new Error('Email account not found');
    }

    const transporter = nodemailer.createTransport({
      host: account.smtpHost || '',
      port: account.smtpPort || 587,
      secure: account.smtpPort === 465,
      auth: {
        user: account.smtpUser || '',
        pass: account.smtpPass || '',
      },
    } as any);

    await transporter.sendMail({
      from: account.email,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    });
  }

  /**
   * Test email account connection
   */
  async testConnection(accountId: string): Promise<boolean> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const accountsList = await db.select().from(emailAccounts)
      .where(eq(emailAccounts.id, accountId));
    
    const account = accountsList[0];

    if (!account) {
      throw new Error('Email account not found');
    }

    try {
      const transporter = nodemailer.createTransport({
        host: account.smtpHost || '',
        port: account.smtpPort || 587,
        secure: account.smtpPort === 465,
        auth: {
          user: account.smtpUser || '',
          pass: account.smtpPass || '',
        },
      } as any);

      await transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
