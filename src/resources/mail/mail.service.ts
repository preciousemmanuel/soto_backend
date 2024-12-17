import UserModel from "@/resources/user/user.model";
import { StatusMessages } from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import EmailSenderService from "./ejs.sender.service ";
import fs from "fs";
import { filePaths } from "./ejs";
import ejs from "ejs";
import { AssignmentMailsDto } from "./mail.dto";

class MailService {
	private User = UserModel;
	private EmailSenderService = new EmailSenderService();

	public async sendOtpMail(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodes.HTTP_BAD_REQUEST,
			message: "Unable To Send Mail At The Moment",
		};
		try {
			const { email } = payload;
			const template = fs.readFileSync(process.cwd() + filePaths.sendOTP, {
				encoding: "utf-8",
			});
			const html = ejs.render(template, payload);
			const mailData = {
				email,
				subject: "One Time Password",
				html,
			};
			const sendEmailViaEJS =
				await this.EmailSenderService.sendEmailEJS(mailData);
			console.log(
				"🚀 ~ MailService ~ sendOtpMail ~ sendEmailViaEJS:",
				sendEmailViaEJS
			);
			return sendEmailViaEJS;
		} catch (error: any) {
			console.log("🚀 ~ MailService ~ sendOtpMail ~ error:", error);
			responseData.message = error.toString();
			return responseData;
		}
	}

	public async sendOrdersToVendor(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodes.HTTP_BAD_REQUEST,
			message: "Unable To Send Mail At The Moment",
		};
		try {
			const { email } = payload;
			const template = fs.readFileSync(
				process.cwd() + filePaths.sendMailsToVendors,
				{
					encoding: "utf-8",
				}
			);
			const html = ejs.render(template, payload);
			const mailData = {
				email,
				subject: "Order For Your Product",
				html,
			};
			const sendEmailViaEJS =
				await this.EmailSenderService.sendEmailEJS(mailData);
			console.log(
				"🚀 ~ MailService ~ sendOtpMail ~ sendEmailViaEJS:",
				sendEmailViaEJS
			);
			return sendEmailViaEJS;
		} catch (error: any) {
			console.log("🚀 ~ MailService ~ sendOtpMail ~ error:", error);
			responseData.message = error.toString();
			return responseData;
		}
	}

	public async sendCancelledOrdersToVendor(
		payload: any
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodes.HTTP_BAD_REQUEST,
			message: "Unable To Send Mail At The Moment",
		};
		try {
			const { email } = payload;
			const template = fs.readFileSync(
				process.cwd() + filePaths.sendCancelMailsToVendors,
				{
					encoding: "utf-8",
				}
			);
			const html = ejs.render(template, payload);
			const mailData = {
				email,
				subject: "Cancelled Order RequestExpOn Your Product",
				html,
			};
			const sendEmailViaEJS =
				await this.EmailSenderService.sendEmailEJS(mailData);
			console.log(
				"🚀 ~ MailService ~ sendOtpMail ~ sendEmailViaEJS:",
				sendEmailViaEJS
			);
			return sendEmailViaEJS;
		} catch (error: any) {
			console.log("🚀 ~ MailService ~ sendOtpMail ~ error:", error);
			responseData.message = error.toString();
			return responseData;
		}
	}

	public async sendAssignmentsToPurchasers(
		payload: AssignmentMailsDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodes.HTTP_BAD_REQUEST,
			message: "Unable To Send Mail At The Moment",
		};
		try {
			const { email } = payload;
			const template = fs.readFileSync(
				process.cwd() + filePaths.sendMailsToPurchasers,
				{
					encoding: "utf-8",
				}
			);
			const html = ejs.render(template, payload);
			const mailData = {
				email,
				subject: "Vendor Pickups",
				html,
			};
			const sendEmailViaEJS =
				await this.EmailSenderService.sendEmailEJS(mailData);
			console.log(
				"🚀 ~ MailService ~ sendAssignmentsToPurchasers ~ sendEmailViaEJS:",
				sendEmailViaEJS
			);
			return sendEmailViaEJS;
		} catch (error: any) {
			console.log(
				"🚀 ~ MailService ~ sendAssignmentsToPurchasers ~ error:",
				error
			);
			responseData.message = error.toString();
			return responseData;
		}
	}

	public async sendCancelledAssignmentsToPurchasers(
		payload: AssignmentMailsDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodes.HTTP_BAD_REQUEST,
			message: "Unable To Send Mail At The Moment",
		};
		try {
			const { email } = payload;
			const template = fs.readFileSync(
				process.cwd() + filePaths.sendCancelOrderMailsToPurchasers,
				{
					encoding: "utf-8",
				}
			);
			const html = ejs.render(template, payload);
			const mailData = {
				email,
				subject: "Cancelled Vendor Pickups",
				html,
			};
			const sendEmailViaEJS =
				await this.EmailSenderService.sendEmailEJS(mailData);
			console.log(
				"🚀 ~ MailService ~ sendAssignmentsToPurchasers ~ sendEmailViaEJS:",
				sendEmailViaEJS
			);
			return sendEmailViaEJS;
		} catch (error: any) {
			console.log(
				"🚀 ~ MailService ~ sendAssignmentsToPurchasers ~ error:",
				error
			);
			responseData.message = error.toString();
			return responseData;
		}
	}
}

export default MailService;
