import dotenv from 'dotenv'
import path from 'path'
import validateEnv from '../helpers/validateEnv';
import { CloudUploadOption, MailSendingOptions } from '../enums/base.enum';

dotenv.config({ path: `${process.env.NODE_ENV}.env` });
validateEnv();

export default {
  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME || 3000,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || 3000,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || 3000,
  CLOUD_UPLOAD_OPTION: process.env.CLOUD_UPLOAD_OPTION || CloudUploadOption.CLOUDINARY,
  MAIL_SENDER: process.env.MAIL_SENDER || MailSendingOptions.GMAIL,
  MAIL_AUTH_PASS: process.env.MAIL_AUTH_PASS || MailSendingOptions.GMAIL,
  MAIL_AUTH_USER: process.env.MAIL_AUTH_USER || MailSendingOptions.GMAIL,
  MAIL_HOST: process.env.MAIL_HOST || MailSendingOptions.GMAIL,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || MailSendingOptions.GMAIL,
  MAILGUN_API_KEY: process.env.MAILGUN_API_KEY || MailSendingOptions.GMAIL,
  MAILGUN_DOMAIN: process.env.MAILGUN_DOMAIN || MailSendingOptions.GMAIL,
  MAILTRAP_URL: process.env.MAILTRAP_URL || MailSendingOptions.GMAIL,
  MAILTRAP_API_TOKEN: process.env.MAILTRAP_API_TOKEN || MailSendingOptions.GMAIL,
  MAILTRAP_DOMAIN: process.env.MAILTRAP_DOMAIN || MailSendingOptions.GMAIL,
  MAIL_TRAP_JWT: process.env.MAIL_TRAP_JWT || MailSendingOptions.GMAIL,
  MAIL_TRAP_HOST: process.env.MAIL_TRAP_HOST || MailSendingOptions.GMAIL,
  MAIL_TRAP_PORT: process.env.MAIL_TRAP_PORT || MailSendingOptions.GMAIL,
  MAIL_TRAP_USERNAME: process.env.MAIL_TRAP_USERNAME || MailSendingOptions.GMAIL,
  MAIL_TRAP_PASSWORD: process.env.MAIL_TRAP_PASSWORD || MailSendingOptions.GMAIL,
  MAIL_TRAP_STARTTLS: process.env.MAIL_TRAP_STARTTLS || MailSendingOptions.GMAIL,
  BREVO_API_KEY: process.env.BREVO_API_KEY || MailSendingOptions.GMAIL,
  BREVO_USERNAME: process.env.BREVO_USERNAME || MailSendingOptions.GMAIL,
  BREVO_MAIL_HOST: process.env.BREVO_MAIL_HOST || MailSendingOptions.GMAIL,
  BREVO_MAIL_PORT: process.env.BREVO_MAIL_PORT || MailSendingOptions.GMAIL,
  BREVO_MAIL_PASSWORD: process.env.BREVO_MAIL_PASSWORD || MailSendingOptions.GMAIL,

}