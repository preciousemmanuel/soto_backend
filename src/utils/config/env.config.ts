import dotenv from "dotenv";
import path from "path";
import validateEnv from "../helpers/validateEnv";
import {
	CloudUploadOption,
	MailSendingOptions,
	PaymentProvider,
} from "../enums/base.enum";

dotenv.config({ path: `${process.env.NODE_ENV}.env` });
validateEnv();

export default {
	CLOUDINARY_NAME: process.env.CLOUDINARY_NAME || 3000,
	CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || 3000,
	CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || 3000,
	CLOUD_UPLOAD_OPTION:
		process.env.CLOUD_UPLOAD_OPTION || CloudUploadOption.CLOUDINARY,
	MAIL_SENDER: process.env.MAIL_SENDER || MailSendingOptions.GMAIL,
	MAIL_AUTH_PASS: process.env.MAIL_AUTH_PASS || MailSendingOptions.GMAIL,
	MAIL_AUTH_USER: process.env.MAIL_AUTH_USER || MailSendingOptions.GMAIL,
	MAIL_HOST: process.env.MAIL_HOST || MailSendingOptions.GMAIL,
	SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || MailSendingOptions.GMAIL,
	MAILGUN_API_KEY: process.env.MAILGUN_API_KEY || MailSendingOptions.GMAIL,
	MAILGUN_DOMAIN: process.env.MAILGUN_DOMAIN || MailSendingOptions.GMAIL,
	MAILTRAP_URL: process.env.MAILTRAP_URL || MailSendingOptions.GMAIL,
	MAILTRAP_API_TOKEN:
		process.env.MAILTRAP_API_TOKEN || MailSendingOptions.GMAIL,
	MAILTRAP_DOMAIN: process.env.MAILTRAP_DOMAIN || MailSendingOptions.GMAIL,
	MAIL_TRAP_JWT: process.env.MAIL_TRAP_JWT || MailSendingOptions.GMAIL,
	MAIL_TRAP_HOST: process.env.MAIL_TRAP_HOST || MailSendingOptions.GMAIL,
	MAIL_TRAP_PORT: process.env.MAIL_TRAP_PORT || MailSendingOptions.GMAIL,
	MAIL_TRAP_USERNAME:
		process.env.MAIL_TRAP_USERNAME || MailSendingOptions.GMAIL,
	MAIL_TRAP_PASSWORD:
		process.env.MAIL_TRAP_PASSWORD || MailSendingOptions.GMAIL,
	MAIL_TRAP_STARTTLS:
		process.env.MAIL_TRAP_STARTTLS || MailSendingOptions.GMAIL,
	BREVO_API_KEY: process.env.BREVO_API_KEY || MailSendingOptions.GMAIL,
	BREVO_USERNAME: process.env.BREVO_USERNAME || MailSendingOptions.GMAIL,
	BREVO_MAIL_HOST: process.env.BREVO_MAIL_HOST || MailSendingOptions.GMAIL,
	BREVO_MAIL_PORT: process.env.BREVO_MAIL_PORT || MailSendingOptions.GMAIL,
	BREVO_MAIL_PASSWORD:
		process.env.BREVO_MAIL_PASSWORD || MailSendingOptions.GMAIL,
	PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || PaymentProvider.PAYSTACK,
	PAYSTACK_PUBLIC_KEY:
		process.env.PAYSTACK_PUBLIC_KEY || PaymentProvider.PAYSTACK,
	PAYSTACK_CALLBACK_URL:
		process.env.PAYSTACK_CALLBACK_URL || PaymentProvider.PAYSTACK,
	PAYSTACK_BASE_URL: process.env.PAYSTACK_BASE_URL || PaymentProvider.PAYSTACK,
	PAYSTACK_SECRET_KEY:
		process.env.PAYSTACK_SECRET_KEY || PaymentProvider.PAYSTACK,
	TERMINAL_AFRICA_PUBLIC_KEY:
		process.env.TERMINAL_AFRICA_PUBLIC_KEY || PaymentProvider.PAYSTACK,
	TERMINAL_AFRICA_SECRET_KEY:
		process.env.TERMINAL_AFRICA_SECRET_KEY || PaymentProvider.PAYSTACK,
	TERMINAL_AFRICA_BASE_URL:
		process.env.TERMINAL_AFRICA_BASE_URL || PaymentProvider.PAYSTACK,
	SOTO_EMAIL: process.env.SOTO_EMAIL || PaymentProvider.PAYSTACK,
	ONE_SIGNAL_APPID: process.env.ONE_SIGNAL_APPID || PaymentProvider.PAYSTACK,
	ONE_SIGNAL_APIKEY: process.env.ONE_SIGNAL_APIKEY || PaymentProvider.PAYSTACK,
	FIREBASE_PROJECT_ID:
		process.env.FIREBASE_PROJECT_ID || PaymentProvider.PAYSTACK,
	FIREBASE_PRIVATE_KEY_ID:
		process.env.FIREBASE_PRIVATE_KEY_ID || PaymentProvider.PAYSTACK,
	FIREBASE_PRIVATE_KEY:
		process.env.FIREBASE_PRIVATE_KEY || PaymentProvider.PAYSTACK,
	FIREBASE_CLIENT_EMAIL:
		process.env.FIREBASE_CLIENT_EMAIL || PaymentProvider.PAYSTACK,
	FIREBASE_CLIENT_ID:
		process.env.FIREBASE_CLIENT_ID || PaymentProvider.PAYSTACK,
	AGILITY_BASE_URL: process.env.AGILITY_BASE_URL || PaymentProvider.PAYSTACK,
	SOTO_USER_ID: process.env.SOTO_USER_ID || "6731c8ec1302e8d39132c289",
	BULK_SMS_API_TOKEN:
		process.env.BULK_SMS_API_TOKEN || "6731c8ec1302e8d39132c289",
	BULK_SMS_APPEND_SENDER: process.env.BULK_SMS_APPEND_SENDER || "soto",
	BULK_SMS_BASE_URL:
		process.env.BULK_SMS_BASE_URL ||
		"https://www.bulksmsnigeria.com/api/v2/sms",
	BULK_SMS_CALLBACK_URL:
		process.env.BULK_SMS_CALLBACK_URL ||
		"https://www.bulksmsnigeria.com/api/v2/sms",
};
