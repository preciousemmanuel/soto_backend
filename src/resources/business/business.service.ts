import UserModel from "@/resources/user/user.model";
import { getRandomRef, uniqueCode } from "@/utils/helpers";
import {
	comparePassword,
	createToken,
	generateOtpModel,
	isOtpCorrect,
} from "@/utils/helpers/token";

// import logger from "@/utils/logger";
import {
	AddBankDetailsDto,
	CreateBusinessDto,
	FetchBanksDto,
	FetchWithdrawalsDto,
	MakeWithdrawalDto,
	VerificationDto,
} from "./business.dto";
import { hashPassword } from "@/utils/helpers/token";
import {
	NotificationCategory,
	OtpPurposeOptions,
	StatusMessages,
	TransactionNarration,
	TransactionStatus,
	TransactionType,
	UserTypes,
} from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import BusinessModel from "./business.model";
import cloudUploader from "@/utils/config/cloudUploader";
import walletModel from "./wallet.model";
import MailService from "../mail/mail.service";
import bankModel from "../transaction/bank.model";
import bankDetailsModel from "./bankDetails.model";
import PaymentProviderService from "../transaction/paypment-provider.service";
import { getPaginatedRecords } from "@/utils/helpers/paginate";
import withdrawalModel from "./withdrawal.model";
import transactionLogModel from "../transaction/transactionLog.model";
import { catchBlockResponseFn } from "@/utils/constants/data";
import { HttpCodesEnum } from "@/utils/enums/httpCodes.enum";
import NotificationService from "../notification/notification.service";
import { CreateNotificationDto } from "../notification/notification.dto";
import envConfig from "@/utils/config/env.config";

class BusinessService {
	private Business = BusinessModel;
	private Bank = bankModel;
	private BankDetails = bankDetailsModel;
	private User = UserModel;
	private Wallet = walletModel;
	private TxnLog = transactionLogModel;
	private Withdrawal = withdrawalModel;
	private mailService = new MailService();
	private paymentProviderService = new PaymentProviderService();
	private notificationService = new NotificationService();

	public async createBusiness(
		createBusinessDto: CreateBusinessDto
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const existingBusiness = await this.Business.findOne({
				$or: [
					{ business_name: createBusinessDto.business_name.toLowerCase() },
					{ email: createBusinessDto.email.toLowerCase() },
					{ phone_number: createBusinessDto.phone_number },
				],
			});
			if (existingBusiness) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message:
						"A Business With At Least One Of These Details Already Exists",
				};
				return responseData;
			}

			const logo = createBusinessDto?.business_logo
				? await cloudUploader.imageUploader(createBusinessDto.business_logo)
				: undefined;
			const newBusiness = await this.Business.create({
				...(createBusinessDto?.business_name && {
					business_name: createBusinessDto.business_name.toLowerCase(),
				}),
				...(createBusinessDto?.email && {
					email: createBusinessDto.email.toLowerCase(),
				}),
				...(createBusinessDto?.phone_number && {
					phone_number: createBusinessDto.phone_number,
				}),
				...(createBusinessDto?.adress && { adress: createBusinessDto.adress }),
				...(createBusinessDto?.category && {
					category: createBusinessDto.category,
				}),
				...(createBusinessDto?.description && {
					description: createBusinessDto.description,
				}),
				...(logo && { business_logo: logo }),
			});
			const hashedPassword = await hashPassword(createBusinessDto.password);
			const user = await this.User.create({
				FirstName: newBusiness?.business_name,
				// LastName: newBusiness?.business_name,
				...(createBusinessDto.phone_number && {
					PhoneNumber: createBusinessDto.phone_number,
				}),
				Email: newBusiness?.email,
				Password: hashedPassword,
				UserType: UserTypes.VENDOR,
				business: newBusiness?._id,
			});
			const wallet = await this.Wallet.create({
				user: user._id,
			});
			await this.Business.findByIdAndUpdate(newBusiness?._id, {
				user: user?._id,
			});
			const token = createToken(user);
			user.wallet = wallet._id;
			user.Token = token;
			await user.save();
			const newVendor = await this.User.findById(user?._id)
				.populate("business")
				.populate("wallet");
			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Business Created Successfully",
				data: newVendor,
			};
			const oneTimePassword = await generateOtpModel(
				OtpPurposeOptions.ACCOUNT_VALIDATION,
				user,
				user?.Email
			);

			const mailPayload = {
				email: user?.Email,
				first_name: user?.FirstName,
				otp: oneTimePassword?.otp,
			};
			this.mailService.sendOtpMail(mailPayload);
			const notificationPayload: CreateNotificationDto = {
				sender: envConfig.SOTO_USER_ID,
				receiver: envConfig.SOTO_USER_ID,
				category: NotificationCategory.VENDOR,
				category_id: String(user?._id),
				title: "NEW VENDOR REGISTRATION",
				content: "A new Vendor has just completed registration",
			};
			this.notificationService.createNotification(notificationPayload);
			if (createBusinessDto.phone_number) {
				this.notificationService.sendSMSNotification({
					from: "soto",
					to: createBusinessDto.phone_number,
					body: `Hi, your OTP is: ${oneTimePassword?.otp}`,
				});
			}
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ BusinessService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async verifyBusiness(
		verificationDto: VerificationDto,
		user: InstanceType<typeof UserModel>
	): Promise<ResponseData> {
		let responseData: ResponseData;

		try {
			const existingBusiness = await this.Business.findOne({
				user: user._id,
			});
			if (!existingBusiness) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Business Not Found",
				};
			} else {
				const updateBusiness = await this.Business.findByIdAndUpdate(
					existingBusiness?._id,
					{
						...verificationDto,
					},
					{ new: true }
				);
				const oneTimePassword = await generateOtpModel(
					OtpPurposeOptions.ACCOUNT_VALIDATION,
					user,
					user.Email
				);
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: "verification Updated Successfully",
					data: {
						...updateBusiness?.toObject(),
						oneTimePassword,
					},
				};
				// const notificationPayload: CreateNotificationDto = {
				// 	sender: envConfig.SOTO_USER_ID,
				// 	receiver: envConfig.SOTO_USER_ID,
				// 	category: NotificationCategory.VENDOR,
				// 	category_id: String(updateBusiness?.user),
				// 	title: "NEW VENDOR REGISTRATION",
				// 	content: "A new Vendor has just completed registration",
				// };
				// this.notificationService.createNotification(notificationPayload);
			}

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ BusinessService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async verifyBusinessComplete(user_id: any): Promise<ResponseData> {
		let responseData: ResponseData;

		try {
			const existingBusiness = await this.Business.findOne({
				user: user_id,
			});
			if (!existingBusiness) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Business Not Found",
				};
			} else {
				const updateUser = await this.User.findByIdAndUpdate(
					user_id,
					{
						IsVerified: true,
					},
					{ new: true }
				);

				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: "verification Completed Successfully",
					data: updateUser,
				};
			}

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ BusinessService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async fetchBanks(payload: FetchBanksDto): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const search = {
				...(payload.search && {
					name: { $regex: payload.search, $options: "i" },
				}),
			};

			let bankRecords = await getPaginatedRecords(this.Bank, {
				limit: payload.limit,
				page: payload.page,
				data: search,
				sortFilter: [["name", 1]],
			});

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Banks Fetched Successfully",
				data: bankRecords,
			};

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ BusinessService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async addBankDetails(
		payload: AddBankDetailsDto
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const bank = await this.Bank.findById(payload.bank_id);
			if (!bank) {
				return {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Bank not found",
				};
			}
			if (String(bank._id) === "6743560c06027a50df955633") {
				const bankDetails = await this.BankDetails.create({
					account_number: payload.account_number,
					account_name: `${payload.user.FirstName} ${payload.user.LastName}`,
					user: payload.user._id,
					bank: bank._id,
				});
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_CREATED,
					message: "Bank Details Added Successfully",
					data: bankDetails,
				};
			} else {
				const verifyBank =
					await this.paymentProviderService.paystackBankAccountVerification(
						payload.account_number,
						bank.code
					);
				if (verifyBank.status !== StatusMessages.success) {
					return verifyBank;
				}
				const bankDetails = await this.BankDetails.create({
					account_number: payload.account_number,
					account_name: verifyBank?.data?.data?.account_name,
					user: payload.user._id,
					bank: bank._id,
				});

				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_CREATED,
					message: "Bank Details Added Successfully",
					data: bankDetails,
				};
			}

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ BusinessService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async fetchMyBankDetails(
		user: InstanceType<typeof this.User>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const bankDetails = await this.BankDetails.find({
				user: user._id,
			}).populate("bank");

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Bank Details Fetched Successfully",
				data: bankDetails,
			};

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ BusinessService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async makeWithdrawalRequest(
		payload: MakeWithdrawalDto
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const { user, amount, bank_details_id } = payload;
			const existingRequest = await this.Withdrawal.findOne({
				user: user._id,
				status: TransactionStatus.PENDING,
			});
			if (existingRequest) {
				return {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "A Pending Withdrawal RequestExpExists",
				};
			}
			const bankDetails = await this.BankDetails.findById(bank_details_id);
			if (!bankDetails) {
				return {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Bank Details Not Found",
				};
			}
			const wallet = await this.Wallet.findOne({
				user: user._id,
			});
			if (!wallet) {
				return {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Wallet Not Found",
				};
			}
			if (Number(wallet.current_balance) <= amount) {
				return {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Insufficient Wallet Balance",
				};
			}
			const user_id = String(user._id).toString();
			const walletDebitAction = await this.walletDebit(user_id, amount);
			if (walletDebitAction.status !== StatusMessages.success) {
				return walletDebitAction;
			}
			const reference = getRandomRef();
			const withdrawalRequest = await this.Withdrawal.create({
				amount,
				user: user._id,
				account_name: bankDetails.account_name,
				account_number: bankDetails.account_number,
				bank_details: bank_details_id,
				reference,
			});

			await this.TxnLog.create({
				user: user._id,
				amount,
				narration: TransactionNarration.WITHDRAWAL,
				narration_id: withdrawalRequest._id,
				reference,
				type: TransactionType.DEBIT,
			});

			const notificationPayload: CreateNotificationDto = {
				sender: envConfig.SOTO_USER_ID,
				receiver: envConfig.SOTO_USER_ID,
				category: NotificationCategory.WITHDRAWAL,
				category_id: String(withdrawalRequest._id),
				title: "VENDOR WITHDRAWAL REQUEST",
				content: "A Vendor Just Made A Withdrawal Request",
			};
			this.notificationService.createNotification(notificationPayload);

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Withdrawal RequestExpMade Successfully",
				data: withdrawalRequest,
			};

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ BusinessService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async fetchMyWithdrawals(
		payload: FetchWithdrawalsDto
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const { user, limit, page, status } = payload;
			const search = {
				...(payload.status && {
					status,
				}),
				user: user._id,
			};

			let withdrawalRecords = await getPaginatedRecords(this.Withdrawal, {
				limit,
				page,
				data: search,
			});

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Withdrawals Fetched Successfully",
				data: withdrawalRecords,
			};

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ BusinessService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async completeWithdrawalRequest(
		txnLog: InstanceType<typeof this.TxnLog>
	): Promise<ResponseData> {
		try {
			const { type, narration, narration_id, user, amount, status } = txnLog;
			let withdrawal: any;
			switch (status) {
				case TransactionStatus.SUCCESSFUL:
					withdrawal = await this.Withdrawal.findByIdAndUpdate(
						narration_id,
						{
							status: TransactionStatus.SUCCESSFUL,
						},
						{ new: true }
					);
					break;
				default:
					withdrawal = await this.Withdrawal.findByIdAndUpdate(
						narration_id,
						{
							status: TransactionStatus.FAILED,
						},
						{ new: true }
					);
					const user_id = user.toString();
					await this.walletCredit(user_id, amount);
					break;
			}

			return {
				status: StatusMessages.success,
				code: HttpCodesEnum.HTTP_OK,
				message: "Withdrawal RequestExpProcess Finished",
				data: withdrawal,
			};
		} catch (error: any) {
			console.log("🚀 ~ BusinessService ~ error:", error);
			return catchBlockResponseFn(error);
		}
	}

	public async walletDebit(
		user_id: string,
		amount: number
	): Promise<ResponseData> {
		let responseData: ResponseData;
		const session = await this.Wallet.startSession();
		try {
			console.log("wallet debit action initiated");
			session.startTransaction();
			const wallet = await this.Wallet.findOne({ user: user_id }, null, {
				session,
			});
			if (!wallet) {
				await session.abortTransaction();
				session.endSession();
				return {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Wallet Not Found",
				};
			}
			const debitedWallet = await this.Wallet.findByIdAndUpdate(
				wallet._id,
				{
					$inc: { current_balance: -amount },
					$set: {
						previous_balance: wallet.current_balance,
					},
				},
				{ new: true, session }
			);
			await session.commitTransaction();
			session.endSession();
			this.notificationService.createNotification({
				receiver: user_id,
				title: "Wallet Credit",
				content: "Your wallet has been Debited By NGN" + amount,
			});
			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Wallet Debited Successfully",
				data: debitedWallet,
			};
			console.log("wallet debit action completed");
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ BusinessService ~walletDebit error:", error);
			await session.abortTransaction();
			session.endSession();
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async walletCredit(
		user_id: string,
		amount: number
	): Promise<ResponseData> {
		let responseData: ResponseData;
		const session = await this.Wallet.startSession();
		try {
			console.log("wallet credit action initiated");
			session.startTransaction();

			const wallet = await this.Wallet.findOne({ user: user_id }, null, {
				session,
			});
			if (!wallet) {
				await session.abortTransaction();
				session.endSession();
				return {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Wallet Not Found",
				};
			}
			const debitedWallet = await this.Wallet.findByIdAndUpdate(
				wallet._id,
				{
					$inc: { current_balance: amount },
					$set: {
						previous_balance: wallet.current_balance,
					},
				},
				{ new: true, session }
			);
			await session.commitTransaction();
			session.endSession();

			this.notificationService.createNotification({
				receiver: user_id,
				title: "Wallet Credit",
				content: "Your wallet has been credited with NGN" + amount,
			});
			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Wallet Credited Successfully",
				data: debitedWallet,
			};
			console.log("wallet credit action completed");

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ BusinessService ~walletDebit error:", error);
			await session.abortTransaction();
			session.endSession();
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}
}

export default BusinessService;
