import UserModel from "@/resources/user/user.model";
import { axiosRequestFunction, convertNairaToKobo } from "@/utils/helpers";

// import logger from "@/utils/logger";
import { FullPaymentLinkDto, PaystackTransferDto } from "./transaction.dto";
import { hashPassword } from "@/utils/helpers/token";
import {
	StatusMessages,
	TransactionCurrency,
	TransactionNarration,
} from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import TransactionLogModel from "./transactionLog.model";
import orderModel from "../order/order.model";
import envConfig from "@/utils/config/env.config";
import { requestProp } from "../mail/mail.interface";
import { HttpCodesEnum } from "@/utils/enums/httpCodes.enum";
import {
	catchBlockResponse,
	catchBlockResponseFn,
} from "@/utils/constants/data";

class PaymentProviderService {
	private TransactionLog = TransactionLogModel;
	private User = UserModel;
	private Order = orderModel;

	public async paystackPaymentLink(
		payload: FullPaymentLinkDto
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const call_back_url = payload.base_url
				? !payload.base_url.includes("postman")
					? `${payload.base_url}/payment-success`
					: envConfig.PAYSTACK_CALLBACK_URL
				: undefined;
			const paystackPayload = {
				amount: convertNairaToKobo(payload.amount),
				email: payload.user.Email,
				currency: "NGN",
				reference: payload.txnRef,
				...(call_back_url && {
					callback_url: call_back_url,
				}),
				// callback_url: envConfig.PAYSTACK_CALLBACK_URL,
				...(payload.authorization_code && {
					authorization_code: payload.authorization_code,
				}),
				metadata: {
					customer_id: payload.user.id,
					narration: payload.narration,
					narration_id: payload.narration_id,
					name: payload.user.FirstName + " " + payload.user.LastName,
					email: payload.user.Email,
					phone_number: payload.user.PhoneNumber,
					save_card: payload?.save_card || false,
				},
			};

			let axiosConfig: requestProp;
			switch (payload.authorization_code && payload.is_tokenized === true) {
				case true:
					axiosConfig = {
						url:
							envConfig.PAYSTACK_BASE_URL + "/transaction/charge_authorization",
						method: "POST",
						body: paystackPayload,
						headers: {
							authorization: "Bearer " + envConfig.PAYSTACK_SECRET_KEY,
						},
					};
					break;
				default:
					axiosConfig = {
						url: envConfig.PAYSTACK_BASE_URL + "/transaction/initialize",
						method: "POST",
						body: paystackPayload,
						headers: {
							authorization: "Bearer " + envConfig.PAYSTACK_SECRET_KEY,
						},
					};
					break;
			}

			const initializeTransaction = await axiosRequestFunction(axiosConfig);
			if (
				Number(initializeTransaction?.status) < 400 &&
				initializeTransaction?.data
			) {
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: payload.authorization_code
						? initializeTransaction.message
						: "Link Generated Succcessfully",
					data: payload.authorization_code
						? initializeTransaction.data
						: {
								link: initializeTransaction?.data?.authorization_url,
								txRef: initializeTransaction?.data?.reference,
							},
				};
				return responseData;
			} else {
				return initializeTransaction;
			}
		} catch (error: any) {
			console.log("🚀 ~ PaymentProviderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async paystackVerifyTransaction(ref: string): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const axiosConfig: requestProp = {
				url: envConfig.PAYSTACK_BASE_URL + `/transaction/verify/${ref}`,
				method: "GET",
				headers: {
					authorization: "Bearer " + envConfig.PAYSTACK_SECRET_KEY,
				},
			};
			const verify = await axiosRequestFunction(axiosConfig);
			return verify;
		} catch (error: any) {
			console.log("🚀 ~ PaymentProviderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async paystackBankAccountVerification(
		account_number?: string,
		bank_code?: string
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const params = {
				account_number,
				bank_code,
			};
			const axiosConfig: requestProp = {
				url: envConfig.PAYSTACK_BASE_URL + `/bank/resolve`,
				method: "GET",
				params,
				headers: {
					authorization: "Bearer " + envConfig.PAYSTACK_SECRET_KEY,
				},
			};
			const verify = await axiosRequestFunction(axiosConfig);
			return verify;
		} catch (error: any) {
			console.log("🚀 ~ PaymentProviderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async paystackTransfer(
		payload: PaystackTransferDto
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const {
				account_name,
				account_number,
				amount,
				bank_code,
				currency = TransactionCurrency.NGN,
				narration,
				narration_id,
				reference,
			} = payload;

			const axiosConfig: requestProp = {
				url: envConfig.PAYSTACK_BASE_URL + `/transferrecipient`,
				method: "POST",
				body: {
					type: "nuban",
					name: account_name,
					account_number,
					bank_code,
					currency,
				},
				headers: {
					authorization: "Bearer " + envConfig.PAYSTACK_SECRET_KEY,
				},
			};
			const transferRecipient = await axiosRequestFunction(axiosConfig);
			console.log(
				"🚀 ~ PaymentProviderService ~ transferRecipient:",
				transferRecipient
			);
			if (transferRecipient.status === StatusMessages.error) {
				return transferRecipient;
			}
			const recipient_code =
				transferRecipient.data?.recipient_code ||
				transferRecipient.data?.data?.recipient_code;
			const body = {
				source: "balance",
				amount: amount,
				// amount: convertNairaToKobo(amount),
				reference: reference,
				recipient: recipient_code,
				reason: narration,
			};
			const axiosConfigT: requestProp = {
				url: envConfig.PAYSTACK_BASE_URL + `/transfer`,
				method: "POST",
				body,
				headers: {
					authorization: "Bearer " + envConfig.PAYSTACK_SECRET_KEY,
				},
			};
			const initiateTransferRequest = await axiosRequestFunction(axiosConfigT);
			console.log(
				"🚀 ~ PaymentProviderService ~ initiateTransferRequest:",
				initiateTransferRequest
			);
			if (initiateTransferRequest.status === StatusMessages.error) {
				return initiateTransferRequest;
			}

			responseData = {
				status: StatusMessages.success,
				code: HttpCodesEnum.HTTP_OK,
				message: `Withdrawal Of NGN${amount} Initiated Successfully`,
				data:
					initiateTransferRequest.data?.data || initiateTransferRequest.data,
			};
			return responseData;
		} catch (error: any) {
			console.log(
				"🚀 ~ PaymentProviderService paystackTransfer~ error:",
				error
			);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async completePaystackTransfer(
		transfer_code: string,
		otp: string
	): Promise<ResponseData> {
		try {
			const body = {
				transfer_code,
				otp,
			};
			const axiosConfig: requestProp = {
				url: envConfig.PAYSTACK_BASE_URL + `/transfer/finalize_transfer`,
				method: "POST",
				body,
				headers: {
					authorization: "Bearer " + envConfig.PAYSTACK_SECRET_KEY,
				},
			};
			const completeTransferR = await axiosRequestFunction(axiosConfig);
			return completeTransferR;
		} catch (error: any) {
			console.log(
				"🚀 ~ PaymentProviderService completePaystackTransfer~ error:",
				error
			);
			return catchBlockResponseFn(error);
		}
	}
}

export default PaymentProviderService;
