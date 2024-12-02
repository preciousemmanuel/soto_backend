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
	AddCardDto,
	CreateTransactionLogDto,
	FullPaymentLinkDto,
	GeneratePaymentLinkDto,
	GetTransactionsDto,
	VerificationDto,
} from "./transaction.dto";
import {
	OtpPurposeOptions,
	PaymentProvider,
	PaystackWebHookEvents,
	StatusMessages,
	TransactionNarration,
	TransactionStatus,
	TransactionType,
	UserTypes,
} from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import TransactionLogModel from "./transactionLog.model";
import orderModel from "../order/order.model";
import PaymentProviderService from "./paypment-provider.service";
import envConfig from "@/utils/config/env.config";
import OrderService from "../order/order.service";
import { getPaginatedRecords } from "@/utils/helpers/paginate";
import { currency } from "@/utils/constants/data";
import cardModel from "./card.model";
import walletModel from "../business/wallet.model";
import BusinessService from "../business/business.service";

class TransactionService {
	private TransactionLog = TransactionLogModel;
	private User = UserModel;
	private Order = orderModel;
	private Card = cardModel;
	private Wallet = walletModel;
	private paymentProviderService = new PaymentProviderService();
	private orderService = new OrderService();
	private businessService = new BusinessService();

	public async initializePayment(
		generatePaymentLink: GeneratePaymentLinkDto,
		user: InstanceType<typeof this.User>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const ref = getRandomRef();
			const existingLog = await this.TransactionLog.findOne({
				reference: ref,
			});

			let card = generatePaymentLink?.card_id
				? await this.Card.findById(generatePaymentLink.card_id)
				: undefined;
			if (existingLog) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Duplicate transaction detected",
				};
				return responseData;
			}
			let foundNarration: any;
			let narration_name: string;
			switch (generatePaymentLink.narration) {
				case TransactionNarration.ORDER:
					narration_name = TransactionNarration.ORDER;
					foundNarration = await this.Order.findById(
						generatePaymentLink.narration_id
					);
					break;

				default:
					break;
			}
			if (
				!foundNarration &&
				generatePaymentLink.narration === TransactionNarration.ORDER
			) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: TransactionNarration.ORDER + " Not Found",
				};
				return responseData;
			}

			const linkPayload: FullPaymentLinkDto = {
				...generatePaymentLink,
				user: user,
				txnRef: ref,
				...(card && { authorization_code: card.paystack_token }),
				...(card && { is_tokenized: true }),
			};
			const txnLog = await this.TransactionLog.create({
				user: user?._id,
				amount: linkPayload.amount,
				narration: linkPayload.narration,
				narration_id: linkPayload.narration_id,
				reference: ref,
				type: TransactionType.DEBIT,
			});

			switch (envConfig.PAYMENT_PROVIDER) {
				case PaymentProvider.PAYSTACK:
					responseData =
						await this.paymentProviderService.paystackPaymentLink(linkPayload);
					break;
				default:
					responseData =
						await this.paymentProviderService.paystackPaymentLink(linkPayload);
					break;
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

	public async paystackCallbackService(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Transaction Successful",
		};
		try {
			const { event, data } = payload;
			const authorization = data?.authorization;
			const metadata = data?.metadata;
			// const narration = metadata?.narration;
			// const user_id = metadata?.customer_id;
			const save_card: boolean = metadata?.save_card;

			const { reference, txRef, tx_ref } = data;
			const ref = reference || txRef || tx_ref;
			const ongoningTransaction = await this.TransactionLog.findOne({
				reference: ref,
			});
			if (!ongoningTransaction) {
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: "Ongoing Transaction Not Found",
				};
				return responseData;
			}

			const narration = ongoningTransaction.narration;
			const user_id = String(ongoningTransaction.user);

			if (
				ongoningTransaction &&
				ongoningTransaction.status === TransactionStatus.SUCCESSFUL
			) {
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: "Transaction Already Completed",
				};
				return responseData;
			}
			const narration_id = ongoningTransaction.narration_id || "";
			const completeAddCard: AddCardDto = {
				user_id,
				amount: ongoningTransaction.amount,
				currency: ongoningTransaction.currency,
				ref,
				type: TransactionType.CREDIT,
				authorization,
			};
			switch (event) {
				case PaystackWebHookEvents.TRANSACTION_SUCCESSFUL:
					ongoningTransaction.status = TransactionStatus.SUCCESSFUL;
					await ongoningTransaction.save();
					switch (narration) {
						case TransactionNarration.ORDER:
							if (save_card === true) {
								completeAddCard.credit_or_debit_action = false;
								this.completeAddCardPaystack(completeAddCard);
							}
							const completeOrder =
								await this.orderService.confirmOrderPayment(narration_id);
							responseData = completeOrder;
							break;
						case TransactionNarration.ADD_CARD:
							completeAddCard.credit_or_debit_action = true;
							const completeAddCardResponse =
								await this.completeAddCardPaystack(completeAddCard);
							responseData = completeAddCardResponse;
							break;
						case TransactionNarration.WITHDRAWAL:
							const completeWithdrawalResponse =
								await this.businessService.completeWithdrawalRequest(
									ongoningTransaction
								);
							responseData = completeWithdrawalResponse;
							break;
						default:
							break;
					}
					break;

				default:
					ongoningTransaction.status = TransactionStatus.FAILED;
					await ongoningTransaction.save();
					this.businessService.completeWithdrawalRequest(ongoningTransaction);
					responseData.message = "Transaction Failed";
					break;
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

	public async getTransactionLogs(
		payload: GetTransactionsDto
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const { user, limit, page, narration } = payload;
			var records = await getPaginatedRecords(this.TransactionLog, {
				limit,
				page,
				data: {
					user: user?._id,
					...(narration && { narration }),
				},
			});
			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "transactions logs retreived successfully",
				data: records,
			};

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ TransactionService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async createLogsForSuccessfulPurchase(
		payload: CreateTransactionLogDto[]
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const inserted = await this.TransactionLog.insertMany(payload);
			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "transactions logs created successfully",
				data: inserted.length,
			};

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ TransactionService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async addCard(
		user: InstanceType<typeof this.User>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const addCardPayload: GeneratePaymentLinkDto = {
				amount: 100,
				narration: TransactionNarration.ADD_CARD,
				narration_id: String(user._id),
				save_card: true,
			};

			responseData = await this.initializePayment(addCardPayload, user);
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

	public async completeAddCardPaystack(
		payload: AddCardDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodes.HTTP_BAD_REQUEST,
			message: "Unable to add card",
		};
		try {
			const { user_id, amount, authorization, ref } = payload;
			let card: InstanceType<typeof this.Card> | null;
			if (authorization) {
				const cardExist = await this.Card.findOne({
					last_4digits: authorization?.last4,
					user: user_id,
					expiry:
						authorization?.exp_month +
						"/" +
						(authorization?.exp_year).slice(-2),
				});
				if (cardExist) {
					card = await this.Card.findByIdAndUpdate(
						cardExist._id,
						{
							paystack_token: authorization?.authorization_code,
						},
						{ new: true }
					);
				} else {
					card = await this.Card.create({
						last_4digits: authorization?.last4,
						user: user_id,
						type: authorization?.card_type,
						paystack_token: authorization?.authorization_code,
						expiry:
							authorization?.exp_month +
							"/" +
							(authorization?.exp_year).slice(-2),
					});
					await this.User.findByIdAndUpdate(
						user_id,
						{ card: card._id },
						{ new: true }
					);
				}
				if (payload.credit_or_debit_action === true) {
					await this.Wallet.findOneAndUpdate(
						{ user: user_id },
						{ $inc: { current_balance: amount } },
						{ new: true }
					);
				}

				responseData.code = HttpCodes.HTTP_OK;
				(responseData.message = "Card Added Successfully"),
					(responseData.status = StatusMessages.success);
				responseData.data = card;
			} else {
				return responseData;
			}
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ TransactionService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}
}

export default TransactionService;
