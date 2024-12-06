import UserModel from "@/resources/user/user.model";
import { uniqueCode } from "@/utils/helpers";
import {
	comparePassword,
	createToken,
	generateOtpModel,
	isOtpCorrect,
} from "@/utils/helpers/token";

// import logger from "@/utils/logger";
import {
	ApproveOrDecineWithdrawalAdminDto,
	CreateBusinessDto,
	OverviewDto,
	VerificationDto,
} from "./adminTransaction.dto";
import { hashPassword } from "@/utils/helpers/token";
import {
	ApproveOrDecline,
	OrderStatus,
	OtpPurposeOptions,
	StatusMessages,
	TransactionCurrency,
	TransactionNarration,
	TransactionStatus,
	UserTypes,
} from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import MailService from "../mail/mail.service";
import {
	backDaterArray,
	FacetStage,
	MatchStage$and,
} from "@/utils/interfaces/base.interface";
import withdrawalModel from "../business/withdrawal.model";
import { PipelineStage } from "mongoose";
import { catchBlockResponseFn } from "@/utils/constants/data";
import { HttpCodesEnum } from "@/utils/enums/httpCodes.enum";
import transactionLogModel from "../transaction/transactionLog.model";
import { PaystackTransferDto } from "../transaction/transaction.dto";
import bankDetailsModel from "../business/bankDetails.model";
import bankModel from "../transaction/bank.model";
import PaymentProviderService from "../transaction/paypment-provider.service";
import BusinessService from "../business/business.service";
import { endOfToday } from "date-fns";
import { getPaginatedRecords } from "@/utils/helpers/paginate";

class AdminTransactionService {
	private Bank = bankModel;
	private BankDetails = bankDetailsModel;
	private User = UserModel;
	private TxnLog = transactionLogModel;
	private Withdrawal = withdrawalModel;
	private mailService = new MailService();
	private businessService = new BusinessService();
	private paymentProviderService = new PaymentProviderService();

	public async getWalletOverview(
		payload: any,
		advanced_report_timeline: backDaterArray[]
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "",
		};
		try {
			const {
				previous_start_date,
				previous_end_date,
				start_date,
				end_date = endOfToday(),
				page,
				limit,
			} = payload;
			console.log("🚀 ~ AdminOverviewService ~ payload:", payload);
			let txn_amount: number = 0;
			let previous_txn_amount: number = 0;
			let txn_percentage: number = 0;
			let income_amount: number = 0;
			let previous_income_amount: number = 0;
			let income_percentage: number = 0;
			let withdrawal_amount: number = 0;
			let previous_withdrawal_amount: number = 0;
			let withdrawal_percentage: number = 0;
			let remittance_amount: number = 0;
			let previous_remittance_amount: number = 0;
			let remittance_percentage: number = 0;

			const transactionPipeline = [
				{
					$facet: {
						sum1: [
							{
								$match: {
									createdAt: {
										$gte: new Date(start_date),
										$lte: new Date(end_date),
									},
									// status: OrderStatus.DELIVERED
								},
							},
							{
								$group: {
									_id: null,
									totalAmount: { $sum: "$amount" },
								},
							},
						],
						sum2: [
							{
								$match: {
									createdAt: {
										$gte: new Date(previous_start_date),
										$lte: new Date(previous_end_date),
									},
									// status: OrderStatus.DELIVERED
								},
							},
							{
								$group: {
									_id: null,
									totalAmount: { $sum: "$amount" },
								},
							},
						],
					},
				},
				{
					$project: {
						sumAmount1: { $arrayElemAt: ["$sum1.totalAmount", 0] },
						sumAmount2: { $arrayElemAt: ["$sum2.totalAmount", 0] },
					},
				},
				{
					$addFields: {
						percentageDifference: {
							$cond: {
								if: { $eq: ["$sumAmount1", 0] },
								then: {
									$cond: {
										if: { $eq: ["$sumAmount2", 0] },
										then: 0,
										else: 100,
									},
								},
								else: {
									$multiply: [
										{
											$divide: [
												{ $subtract: ["$sumAmount1", "$sumAmount2"] },
												"$sumAmount1",
											],
										},
										100,
									],
								},
							},
						},
					},
				},
			];

			const txnAggregate = await this.TxnLog.aggregate(transactionPipeline);
			console.log("🚀 ~ AdminOverviewService ~ txnAggregate:", txnAggregate);
			if (txnAggregate.length > 0) {
				txn_amount = txnAggregate[0]?.sumAmount1 || 0;
				previous_txn_amount = txnAggregate[0]?.sumAmount2 || 0;
				txn_percentage = txnAggregate[0]?.percentageDifference || 0;
			}

			const incomePipeline = [
				{
					$facet: {
						count1: [
							{
								$match: {
									createdAt: {
										$gte: new Date(start_date),
										$lte: new Date(end_date),
									},
									// status: OrderStatus.DELIVERED
								},
							},
							{
								$count: "totalCount",
							},
						],
						count2: [
							{
								$match: {
									createdAt: {
										$gte: new Date(previous_start_date),
										$lte: new Date(previous_end_date),
									},
									// status: OrderStatus.DELIVERED
								},
							},
							{
								$count: "totalCount",
							},
						],
					},
				},
				{
					$project: {
						countAmount1: { $arrayElemAt: ["$count1.totalCount", 0] },
						countAmount2: { $arrayElemAt: ["$count2.totalCount", 0] },
					},
				},
				{
					$addFields: {
						percentageDifference: {
							$cond: {
								if: { $eq: ["$countAmount1", 0] },
								then: {
									$cond: {
										if: { $eq: ["$countAmount2", 0] },
										then: 0,
										else: 100,
									},
								},
								else: {
									$multiply: [
										{
											$divide: [
												{ $subtract: ["$countAmount1", "$countAmount2"] },
												"$countAmount1",
											],
										},
										100,
									],
								},
							},
						},
					},
				},
			];

			const incomeAggregate = await this.TxnLog.aggregate(incomePipeline);
			if (incomeAggregate.length > 0) {
				income_amount = incomeAggregate[0]?.countAmount1 || 0;
				previous_income_amount = incomeAggregate[0]?.countAmount2 || 0;
				income_percentage = incomeAggregate[0]?.percentageDifference || 0;
			}

			const withdrawalPipeline = [
				{
					$facet: {
						count1: [
							{
								$match: {
									createdAt: {
										$gte: new Date(start_date),
										$lte: new Date(end_date),
									},
								},
							},
							{
								$count: "totalCount",
							},
						],
						count2: [
							{
								$match: {
									createdAt: {
										$gte: new Date(previous_start_date),
										$lte: new Date(previous_end_date),
									},
								},
							},
							{
								$count: "totalCount",
							},
						],
					},
				},
				{
					$project: {
						countAmount1: { $arrayElemAt: ["$count1.totalCount", 0] },
						countAmount2: { $arrayElemAt: ["$count2.totalCount", 0] },
					},
				},
				{
					$addFields: {
						percentageDifference: {
							$cond: {
								if: { $eq: ["$countAmount1", 0] },
								then: {
									$cond: {
										if: { $eq: ["$countAmount2", 0] },
										then: 0,
										else: 100,
									},
								},
								else: {
									$multiply: [
										{
											$divide: [
												{ $subtract: ["$countAmount1", "$countAmount2"] },
												"$countAmount1",
											],
										},
										100,
									],
								},
							},
						},
					},
				},
			];

			const withdrawalAggregate =
				await this.Withdrawal.aggregate(withdrawalPipeline);

			if (withdrawalAggregate.length > 0) {
				withdrawal_amount = withdrawalAggregate[0]?.countAmount1 || 0;
				previous_withdrawal_amount = withdrawalAggregate[0]?.countAmount2 || 0;
				withdrawal_percentage =
					withdrawalAggregate[0]?.percentageDifference || 0;
			}

			const remittancePipeline = [
				{
					$facet: {
						count1: [
							{
								$match: {
									createdAt: {
										$gte: new Date(start_date),
										$lte: new Date(end_date),
									},
								},
							},
							{
								$count: "totalCount",
							},
						],
						count2: [
							{
								$match: {
									createdAt: {
										$gte: new Date(previous_start_date),
										$lte: new Date(previous_end_date),
									},
								},
							},
							{
								$count: "totalCount",
							},
						],
					},
				},
				{
					$project: {
						countAmount1: { $arrayElemAt: ["$count1.totalCount", 0] },
						countAmount2: { $arrayElemAt: ["$count2.totalCount", 0] },
					},
				},
				{
					$addFields: {
						percentageDifference: {
							$cond: {
								if: { $eq: ["$countAmount1", 0] },
								then: {
									$cond: {
										if: { $eq: ["$countAmount2", 0] },
										then: 0,
										else: 100,
									},
								},
								else: {
									$multiply: [
										{
											$divide: [
												{ $subtract: ["$countAmount1", "$countAmount2"] },
												"$countAmount1",
											],
										},
										100,
									],
								},
							},
						},
					},
				},
			];

			const remittanceAggregate =
				await this.TxnLog.aggregate(remittancePipeline);

			if (remittanceAggregate.length > 0) {
				remittance_amount = remittanceAggregate[0]?.countAmount1 || 0;
				previous_remittance_amount = remittanceAggregate[0]?.countAmount2 || 0;
				remittance_percentage =
					remittanceAggregate[0]?.percentageDifference || 0;
			}

			var logRecords = await getPaginatedRecords(this.TxnLog, {
				limit,
				page,
				populateObj: {
					path: "user",
					select: "FirstName LastName Email UserType ProfileImage",
				},
			});

			responseData.data = {
				transaction: {
					amount: txn_amount,
					percentage_change: Number(
						parseFloat(txn_percentage.toString()).toFixed(1)
					),
				},
				income: {
					amount: income_amount,
					percentage_change: Number(
						parseFloat(income_percentage.toString()).toFixed(1)
					),
				},
				withdrawal: {
					amount: withdrawal_amount,
					percentage_change: Number(
						parseFloat(withdrawal_percentage.toString()).toFixed(1)
					),
				},
				remittance: {
					amount: remittance_amount,
					percentage_change: Number(
						parseFloat(remittance_percentage.toString()).toFixed(1)
					),
				},
				transaction_logs: logRecords,
			};

			responseData.message = "Wallet Overview retreived successfully";
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminTransactionService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async getWithdrawalRequests(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Withdrawal Requests Retrieved Successfully",
		};
		try {
			const { limit, page, search, status } = payload;
			const skip = (page - 1) * limit;
			const matchStage: MatchStage$and = { $and: [] };
			if (search) {
				matchStage.$and.push({
					$or: [
						{ amount: { $gte: Number(search) } },
						{ account_name: { $regex: search, $options: "i" } },
						{ "user.FirstName": { $regex: search, $options: "i" } },
						{ "user.LastName": { $regex: search, $options: "i" } },
						{ "user.Email": { $regex: search, $options: "i" } },
						{ "bank.name": { $regex: search, $options: "i" } },
					],
				});
			}

			if (status) {
				matchStage.$and.push({ status });
			}
			const match_stage = matchStage.$and.length > 0 ? matchStage : undefined;
			const pipeline = [
				{
					$lookup: {
						from: "Users",
						localField: "user",
						foreignField: "_id",
						as: "user",
					},
				},
				{ $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
				{
					$lookup: {
						from: "Businesses",
						localField: "user.business",
						foreignField: "_id",
						as: "business",
					},
				},
				{ $unwind: { path: "$business", preserveNullAndEmptyArrays: true } },
				{
					$lookup: {
						from: "BankDetails",
						localField: "bank_details",
						foreignField: "_id",
						as: "bank_details",
					},
				},
				{
					$unwind: { path: "$bank_details", preserveNullAndEmptyArrays: true },
				},
				{
					$lookup: {
						from: "Banks",
						localField: "bank_details.bank",
						foreignField: "_id",
						as: "bank",
					},
				},
				{ $unwind: { path: "$bank", preserveNullAndEmptyArrays: true } },
				...(match_stage ? [{ $match: match_stage }] : []),

				{
					$facet: {
						totalCount: [{ $count: "count" }],
						withdrawals: [
							{ $sort: { createdAt: -1 } },
							{ $skip: skip },
							{ $limit: limit },
							{
								$project: {
									_id: 1,
									vendor_name: "$business.business_name",
									vendor_email: "$business.email",
									vendor_logo: "$business.business_logo",
									account_name: 1,
									account_number: 1,
									amount: 1,
									status: 1,
									bank: "$bank.name",
									createdAt: 1,
								},
							},
						],
					},
				} as PipelineStage,
				{
					$addFields: {
						totalCount: { $arrayElemAt: ["$totalCount.count", 0] },
					},
				},
			];

			const aggregateResult = await this.Withdrawal.aggregate(pipeline);
			console.log(
				"🚀 ~ AdminTransactionService ~ getWithdrawalRequests ~ aggregateResult:",
				aggregateResult
			);

			const data =
				aggregateResult.length > 0 ? aggregateResult[0]?.withdrawals : [];
			const totalCount =
				aggregateResult.length > 0 ? aggregateResult[0]?.totalCount : 0;
			const pageCount = Math.ceil(Number(totalCount) / limit);
			const currentPage = page;
			const hasNext = page * limit < totalCount;
			const pagination = {
				data,
				pagination: {
					pageSize: limit,
					totalCount,
					pageCount,
					currentPage,
					hasNext,
				},
			};
			responseData.data = pagination;

			return responseData;
		} catch (error: any) {
			console.log(
				"🚀 ~ AdminOverviewService ~ getWithdrawalRequests ~ error:",
				error
			);
			return catchBlockResponseFn(error);
		}
	}

	public async approveOrDeclineWithdrawalRequest(
		payload: ApproveOrDecineWithdrawalAdminDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Withdrawal Requests Treated Successfully",
		};
		try {
			const { withdrawal_id, approve_or_decline } = payload;
			const withdrawal = await this.Withdrawal.findById(withdrawal_id);
			if (!withdrawal) {
				return {
					status: StatusMessages.error,
					code: HttpCodesEnum.HTTP_BAD_REQUEST,
					message: "Withdrawal Not Found",
				};
			}
			const bank_details = await this.BankDetails.findById(
				withdrawal.toObject().bank_details
			);
			const bank = bank_details
				? await this.Bank.findById(bank_details.toObject().bank)
				: undefined;

			switch (approve_or_decline) {
				case ApproveOrDecline.APPROVED:
					if (bank) {
						const transferPayload: PaystackTransferDto = {
							account_name: withdrawal.account_name,
							account_number: withdrawal.account_number,
							amount: withdrawal.amount,
							bank_code: bank.code,
							// account_name: "Tolu Robert",
							// account_number: "01000000010",
							// amount: withdrawal.amount,
							// bank_code: "058",
							currency: TransactionCurrency.NGN,
							narration: TransactionNarration.WITHDRAWAL,
							reference: withdrawal.reference,
						};
						responseData =
							await this.paymentProviderService.paystackTransfer(
								transferPayload
							);
						if (responseData.status === StatusMessages.success) {
							const transfer_code =
								responseData.data?.transfer_code ||
								responseData.data?.data?.transfer_code;
							await this.TxnLog.findOneAndUpdate(
								{ reference: withdrawal.reference },
								{ transfer_request: transfer_code }
							);
						}
					} else {
						responseData = {
							status: StatusMessages.error,
							code: HttpCodes.HTTP_BAD_REQUEST,
							message: "Unable To Verify Bank Details",
						};
					}
					break;

				default:
					withdrawal.status = TransactionStatus.FAILED;
					await this.TxnLog.findOneAndUpdate(
						{ reference: withdrawal.reference },
						{ status: TransactionStatus.FAILED }
					);
					await withdrawal.save();
					const user_id = String(withdrawal.user).toString();
					this.businessService.walletCredit(user_id, withdrawal.amount);
					responseData = {
						status: StatusMessages.success,
						code: HttpCodes.HTTP_OK,
						message: "Withdrawal Request Declined Successfully",
						data: withdrawal,
					};
					break;
			}
			return responseData;
		} catch (error: any) {
			console.log(
				"🚀 ~ AdminOverviewService ~ getWithdrawalRequests ~ error:",
				error
			);
			return catchBlockResponseFn(error);
		}
	}

	public async completeWithdrawalApproval(
		transfer_code: string,
		otp: string
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Withdrawal Requests Treated Successfully",
		};
		try {
			const existingLog = await this.TxnLog.findOne({
				transfer_request: transfer_code,
			});
			if (existingLog) {
				const finalize_transfer =
					await this.paymentProviderService.completePaystackTransfer(
						transfer_code,
						otp
					);
				if (finalize_transfer.status !== StatusMessages.success) {
					const user_id = String(existingLog.user).toString();
					if (existingLog.status !== TransactionStatus.REVERSAL) {
						await this.businessService.walletCredit(
							user_id,
							existingLog.amount
						);
						existingLog.status = TransactionStatus.REVERSAL;
						existingLog.save();
					}
				}
				responseData = finalize_transfer;
			} else {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodesEnum.HTTP_BAD_REQUEST,
					message: "Ongoing Transaction Not Found",
				};
			}
			return responseData;
		} catch (error: any) {
			console.log(
				"🚀 ~ AdminOverviewService ~ completeWithdrawalApproval ~ error:",
				error
			);
			return catchBlockResponseFn(error);
		}
	}
}

export default AdminTransactionService;
