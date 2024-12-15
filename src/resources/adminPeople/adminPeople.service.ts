import UserModel from "@/resources/user/user.model";
import { formatPhoneNumber, uniqueCode } from "@/utils/helpers";
import {
	comparePassword,
	createToken,
	generateOtpModel,
	isOtpCorrect,
} from "@/utils/helpers/token";

// import logger from "@/utils/logger";
import {
	CreateBusinessDto,
	OverviewDto,
	UpdateUserByAdminDto,
	VerificationDto,
} from "./adminPeople.dto";
import { hashPassword } from "@/utils/helpers/token";
import {
	OrderStatus,
	OtpPurposeOptions,
	SellerStatus,
	StatusMessages,
	UserTypes,
	YesOrNo,
} from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import cloudUploader from "@/utils/config/cloudUploader";
import MailService from "../mail/mail.service";
import { endOfToday } from "date-fns";
import orderModel from "../order/order.model";
import productModel from "../product/product.model";
import orderDetailsModel from "../order/orderDetails.model";
import { backDaterArray, FacetStage } from "@/utils/interfaces/base.interface";
import { start } from "repl";
import { HttpCodesEnum } from "@/utils/enums/httpCodes.enum";
import { getPaginatedRecords } from "@/utils/helpers/paginate";
import businessModel from "../business/business.model";
import assignmentModel from "../assignment/assignment.model";
import adminModel from "../adminConfig/admin.model";
import roleModel from "../adminConfig/role.model";
import mongoose from "mongoose";
import {
	catchBlockResponse,
	catchBlockResponseFn,
} from "@/utils/constants/data";
import NotificationService from "../notification/notification.service";
import { FetchNotificationsDto } from "../notification/notification.dto";

class AdminPeopleService {
	private User = UserModel;
	private Business = businessModel;
	private Order = orderModel;
	private Product = productModel;
	private OrderDetails = orderDetailsModel;
	private Assignment = assignmentModel;
	private Admin = adminModel;
	private Role = roleModel;
	private mailService = new MailService();
	private notificationService = new NotificationService();

	public async getBuyers(
		payload: any,
		dateRange: backDaterArray[]
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Buyers Retrieved Successfully",
		};
		try {
			const { limit, page, start_date, end_date, search } = payload;
			console.log("🚀 ~ AdminPeopleService ~ getBuyers ~ payload:", payload);
			const skip = (page - 1) * limit;

			const aggregateResult = await this.User.aggregate([
				{
					$match: {
						$or: [
							{
								...(search && { Email: { $regex: search, $options: "i" } }),
								UserType: UserTypes.USER,
							},
							{
								...(search && { FirstName: { $regex: search, $options: "i" } }),
								UserType: UserTypes.USER,
							},
							{
								...(search && { LastName: { $regex: search, $options: "i" } }),
								UserType: UserTypes.USER,
							},
						],
					},
				},
				{
					$lookup: {
						from: "Orders",
						localField: "_id",
						foreignField: "user",
						as: "user_orders",
					},
				},
				{
					$addFields: {
						total_spent: { $sum: "$user_orders.grand_total" },
						total_orders: { $size: "$user_orders" },
						total_items_ordered: {
							$sum: {
								$map: {
									input: "$user_orders",
									as: "order",
									in: {
										$sum: {
											$map: {
												input: "$$order.items",
												as: "item",
												in: "$$item.quantity",
											},
										},
									},
								},
							},
						},
						last_order_price: {
							$ifNull: [
								{
									$let: {
										vars: { lastOrder: { $arrayElemAt: ["$user_orders", -1] } }, // Get last order (assuming orders are sorted by date)
										in: "$$lastOrder.grand_total",
									},
								},
								0,
							],
						},
					},
				},
				{
					$project: {
						_id: 1,
						FirstName: 1,
						LastName: 1,
						Email: 1,
						ProfileImage: 1,
						total_spent: 1,
						last_order_price: 1,
						total_orders: 1,
						total_items_ordered: 1,
						createdAt: 1,
						Rank: 1,
					},
				},
				{
					$sort: { total_spent: -1 },
				},
				{
					$skip: skip,
				},
				{
					$limit: limit,
				},
				{
					$group: {
						_id: null,
						users: {
							$push: {
								_id: "$_id",
								first_name: "$FirstName",
								last_name: "$LastName",
								email: "$Email",
								is_blocked: "$IsBlocked",
								is_verified: "$IsVerified",
								profile_image: { $ifNull: ["$ProfileImage", ""] },
								createdAt: "$createdAt",
								rank: "$Rank",
								total_spent: "$total_spent",
								last_order_price: "$last_order_price",
								total_orders: "$total_orders",
								total_items_ordered: "$total_items_ordered",
							},
						},
						total_count: { $sum: 1 },
					},
				},
				{
					$project: {
						_id: 0,
						users: 1,
						total_count: 1,
					},
				},
			]);
			const data = aggregateResult.length > 0 ? aggregateResult[0]?.users : [];
			const totalCount =
				aggregateResult.length > 0 ? aggregateResult[0]?.total_count : 0;
			const pageCount = Math.ceil(Number(totalCount) / limit);
			const currentPage = page;
			const hasNext = page * limit < totalCount;
			const revenueFromBuyersChartPipeline = [];
			const facetStage: { $facet: FacetStage } = {
				$facet: {},
			};
			dateRange.forEach((range) => {
				const { start, end, day, month } = range;
				const key = day || month || "date";

				if (key) {
					facetStage.$facet[key] = [
						{
							$match: {
								createdAt: {
									$gte: new Date(start),
									$lte: new Date(end),
								},
								// status: OrderStatus.DELIVERED
							},
						},
						{
							$group: {
								_id: null,
								totalAmount: { $sum: "$grand_total" },
							},
						},
						{
							$project: {
								_id: 0,
								amount: { $ifNull: ["$totalAmount", 0] },
							},
						},
					];
				}
			});
			revenueFromBuyersChartPipeline.push(facetStage);
			revenueFromBuyersChartPipeline.push({
				$project: {
					results: {
						$reduce: {
							input: { $objectToArray: "$$ROOT" },
							initialValue: [],
							in: {
								$concatArrays: [
									"$$value",
									[
										{
											day_or_month: "$$this.k",
											amount: {
												$ifNull: [{ $arrayElemAt: ["$$this.v.amount", 0] }, 0],
											},
										},
									],
								],
							},
						},
					},
				},
			});

			const revenueFromBuyersChartAggregate = await this.Order.aggregate(
				revenueFromBuyersChartPipeline
			);
			const revenueFromBuyers =
				revenueFromBuyersChartAggregate.length > 0
					? revenueFromBuyersChartAggregate[0]?.results
					: [];
			const pagination = {
				revenue_from_buyers_chart: revenueFromBuyers,
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
			console.log("🚀 ~ AdminPeopleService ~ getBuyers ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async viewOneBuyer(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Buyers Retrieved Successfully",
		};
		try {
			const { user_id, limit = 10, page = 1 } = payload;
			const user = await this.User.findById(user_id);
			if (!user) {
				return {
					status: StatusMessages.error,
					code: HttpCodesEnum.HTTP_BAD_REQUEST,
					message: "User Not Found",
				};
			}
			const skip = (page - 1) * limit;
			const aggregateResult = await this.Order.aggregate([
				{
					$match: {
						user: user._id,
					},
				},
				{
					$project: {
						_id: 1,
						tracking_id: 1,
						createdAt: 1,
						status: 1,
						grand_total: 1,
					},
				},
				{
					$sort: { createdAt: -1 },
				},
				{
					$skip: skip,
				},
				{
					$limit: limit,
				},

				{
					$group: {
						_id: null,
						orders: {
							$push: {
								_id: "$_id",
								tracking_id: "$tracking_id",
								createdAt: "$createdAt",
								status: "$status",
								grand_total: "$grand_total",
							},
						},
						total_count: { $sum: 1 },
						total_spent: { $sum: "$grand_total" },
					},
				},
				{
					$project: {
						_id: 0,
						orders: 1,
						total_spent: 1,
						total_count: 1,
					},
				},
			]);
			const data = aggregateResult.length > 0 ? aggregateResult[0]?.orders : [];
			const totalSpent =
				aggregateResult.length > 0 ? aggregateResult[0]?.total_spent : 0;
			const totalCount =
				aggregateResult.length > 0 ? aggregateResult[0]?.total_count : 0;
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

			responseData.data = {
				user,
				total_amount_spent: totalSpent,
				orderRecords: pagination,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminPeopleService ~ viewOneBuyer ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async updateBuyerOrSeller(
		admin: InstanceType<typeof this.Admin>,
		user_id: string,
		payload: UpdateUserByAdminDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Update Successful",
		};
		try {
			const user = await this.User.findById(user_id);
			if (!user) {
				return {
					status: StatusMessages.error,
					code: HttpCodesEnum.HTTP_BAD_REQUEST,
					message: "User Not Found",
				};
			}

			// if (
			// 	payload?.is_verified &&
			// 	payload?.is_verified === YesOrNo.YES &&
			// 	user.IsVerified !== true
			// ) {
			// 	return {
			// 		status: StatusMessages.error,
			// 		code: HttpCodesEnum.HTTP_BAD_REQUEST,
			// 		message: "Vendor Yet To Verify Email",
			// 	};
			// }

			const updatedUser = await this.User.findByIdAndUpdate(
				user_id,
				{
					...(payload.first_name && {
						FirstName: payload.first_name.toLowerCase(),
					}),
					...(payload?.last_name && {
						LastName: payload.last_name.toLowerCase(),
					}),
					...(payload?.email && {
						Email: payload.email.toLowerCase(),
					}),
					...(payload?.phone_number && {
						PhoneNumber: formatPhoneNumber(payload.phone_number),
					}),
					...(payload?.is_blocked && {
						IsBlocked: payload.is_blocked === YesOrNo.YES ? true : false,
					}),
					...(payload?.is_verified && {
						IsVerified: payload.is_verified === YesOrNo.YES ? true : false,
					}),
					...(payload?.is_verified && {
						vendor_status:
							payload.is_verified === YesOrNo.NO
								? SellerStatus.DECLINED
								: SellerStatus.APPROVED,
					}),
					...(payload?.is_verified && {
						IsActive: payload.is_verified === YesOrNo.YES ? true : false,
					}),
				},
				{ new: true }
			);

			if (
				payload?.is_blocked &&
				payload.is_blocked === YesOrNo.YES &&
				user.UserType === UserTypes.VENDOR
			) {
				this.blockUnblockSellerActions(user_id, payload.is_blocked);
			}

			responseData.data = updatedUser;
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminPeopleService ~ viewOneBuyer ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async blockUnblockSellerActions(
		id: string,
		is_blocked: string
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Products Blocked Successfully",
		};
		try {
			let update: any;
			switch (is_blocked) {
				case YesOrNo.YES:
					update = {
						is_verified: false,
						is_deleted: true,
						vendor_status: SellerStatus.BLOCKED,
					};
					break;
				default:
					update = {
						is_verified: true,
						is_deleted: false,
					};
					break;
			}
			const blockAllProductsOfASeller = await this.Product.updateMany(
				{ vendor: id },
				{
					$set: update,
				}
			);
			responseData.data = blockAllProductsOfASeller;
			return responseData;
		} catch (error) {
			return catchBlockResponse;
		}
	}

	public async getSellers(
		payload: any,
		dateRange: backDaterArray[]
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Sellers Retrieved Successfully",
		};
		try {
			const { limit, page, start_date, end_date, search, seller_status } =
				payload;
			const skip = (page - 1) * limit;
			let status_value: object = {};
			if (seller_status) {
				switch (seller_status) {
					case SellerStatus.PENDING:
						status_value = {
							IsVerified: false,
							vendor_status: SellerStatus.PENDING,
						};
						break;
					case SellerStatus.APPROVED:
						status_value = {
							IsActive: true,
							IsVerified: true,
							IsBlocked: false,
							vendor_status: SellerStatus.APPROVED,
						};
						break;
					case SellerStatus.DECLINED:
						status_value = {
							IsVerified: false,
							vendor_status: SellerStatus.DECLINED,
						};
						break;
					default:
						break;
				}
			}

			const aggregateResult = await this.User.aggregate([
				{
					$match: {
						$or: [
							{
								...(search && { Email: { $regex: search, $options: "i" } }),
								UserType: UserTypes.VENDOR,
								...(seller_status && status_value && status_value),
							},
							{
								...(search && { FirstName: { $regex: search, $options: "i" } }),
								UserType: UserTypes.VENDOR,
								...(seller_status && status_value && status_value),
							},
							{
								...(search && { LastName: { $regex: search, $options: "i" } }),
								UserType: UserTypes.VENDOR,
								...(seller_status && status_value && status_value),
							},
						],
					},
				},
				{
					$lookup: {
						from: "Businesses",
						localField: "_id",
						foreignField: "user",
						as: "user_business",
					},
				},
				{
					$lookup: {
						from: "Products",
						localField: "_id",
						foreignField: "vendor",
						as: "user_products",
					},
				},
				{
					$addFields: {
						total_quantity: { $sum: "$user_products.product_quantity" },
					},
				},
				{
					$facet: {
						users: [
							{
								$sort: { createdAt: -1 },
							},
							{
								$skip: skip,
							},
							{
								$limit: limit,
							},
							{
								$project: {
									_id: 1,
									FirstName: 1,
									LastName: 1,
									Email: 1,
									ProfileImage: 1,
									IsActive: 1,
									IsVerified: 1,
									vendor_status: 1,
									IsBlocked: 1,
									total_quantity: 1,
									product: { $arrayElemAt: ["$user_products.product_name", 0] },
									category: { $arrayElemAt: ["$user_business.category", 0] },
									createdAt: 1,
								},
							},
						],
						total_count: [
							{
								$count: "count",
							},
						],
					},
				},
				{
					$project: {
						users: 1,
						total_count: { $arrayElemAt: ["$total_count.count", 0] },
					},
				},
			]);

			const paginatedData =
				aggregateResult.length > 0 ? aggregateResult[0] : undefined;

			const data = paginatedData ? paginatedData?.users : [];
			const totalCount = paginatedData ? paginatedData?.total_count : 0;
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

			const statAggregate = (
				await this.User.aggregate([
					{
						$facet: {
							activeVendors: [
								{
									$match: {
										IsVerified: true,
										IsActive: true,
										UserType: UserTypes.VENDOR,
									},
								},
								{ $count: "activeCount" },
							],
							inactiveVendors: [
								{
									$match: {
										IsActive: false,
										UserType: UserTypes.VENDOR,
									},
								},
								{ $count: "inactiveCount" },
							],
							blockedVendors: [
								{
									$match: {
										IsBlocked: true,
										UserType: UserTypes.VENDOR,
									},
								},
								{ $count: "blockedCount" },
							],
							totalVendors: [
								{ $match: { UserType: UserTypes.VENDOR } },
								{ $count: "totalCount" },
							],
						},
					},

					{
						$addFields: {
							active: {
								count: {
									$ifNull: [
										{ $arrayElemAt: ["$activeVendors.activeCount", 0] },
										0,
									],
								},
								percentage: {
									$multiply: [
										{
											$divide: [
												{
													$ifNull: [
														{ $arrayElemAt: ["$activeVendors.activeCount", 0] },
														0,
													],
												},
												{
													$ifNull: [
														{ $arrayElemAt: ["$totalVendors.totalCount", 0] },
														1,
													],
												},
											],
										},
										100,
									],
								},
							},
							inactive: {
								count: {
									$ifNull: [
										{ $arrayElemAt: ["$inactiveVendors.inactiveCount", 0] },
										0,
									],
								},
								percentage: {
									$multiply: [
										{
											$divide: [
												{
													$ifNull: [
														{
															$arrayElemAt: [
																"$inactiveVendors.inactiveCount",
																0,
															],
														},
														0,
													],
												},
												{
													$ifNull: [
														{ $arrayElemAt: ["$totalVendors.totalCount", 0] },
														1,
													],
												},
											],
										},
										100,
									],
								},
							},
							blocked: {
								count: {
									$ifNull: [
										{ $arrayElemAt: ["$blockedVendors.blockedCount", 0] },
										0,
									],
								},
								percentage: {
									$multiply: [
										{
											$divide: [
												{
													$ifNull: [
														{
															$arrayElemAt: ["$blockedVendors.blockedCount", 0],
														},
														0,
													],
												},
												{
													$ifNull: [
														{ $arrayElemAt: ["$totalVendors.totalCount", 0] },
														1,
													],
												},
											],
										},
										100,
									],
								},
							},
						},
					},
					{
						$project: {
							stats: {
								active_array: "$active_array",
								active: "$active",
								inactive_array: "$inactive_array",
								inactive: "$inactive",
								blocked_array: "$blocked_array",
								blocked: "$blocked",
							},
						},
					},
				])
			)[0]?.stats;
			const revenueFromSellersChartPipeline = [];
			const facetStage: { $facet: FacetStage } = {
				$facet: {},
			};
			dateRange.forEach((range) => {
				const { start, end, day, month } = range;
				const key = day || month || "date";

				if (key) {
					facetStage.$facet[key] = [
						{
							$match: {
								createdAt: {
									$gte: new Date(start),
									$lte: new Date(end),
								},
								// status: OrderStatus.DELIVERED
							},
						},
						{
							$group: {
								_id: null,
								totalAmount: { $sum: "$unit_price" },
							},
						},
						{
							$project: {
								_id: 0,
								amount: { $ifNull: ["$totalAmount", 0] },
							},
						},
					];
				}
			});
			revenueFromSellersChartPipeline.push(facetStage);
			revenueFromSellersChartPipeline.push({
				$project: {
					results: {
						$reduce: {
							input: { $objectToArray: "$$ROOT" },
							initialValue: [],
							in: {
								$concatArrays: [
									"$$value",
									[
										{
											day_or_month: "$$this.k",
											amount: {
												$ifNull: [{ $arrayElemAt: ["$$this.v.amount", 0] }, 0],
											},
										},
									],
								],
							},
						},
					},
				},
			});

			const revenueFromSellersChartAggregate =
				await this.OrderDetails.aggregate(revenueFromSellersChartPipeline);
			const revenueFromSellers =
				revenueFromSellersChartAggregate.length > 0
					? revenueFromSellersChartAggregate[0]?.results
					: [];

			const active_percentage = Math.round(
				Number(statAggregate?.active?.percentage)
			);
			const inactive_percentage = Math.round(
				Number(statAggregate?.inactive?.percentage)
			);
			const blocked_percentage = Math.round(
				Number(statAggregate?.blocked?.percentage)
			);
			const others_percentage =
				100 - active_percentage - inactive_percentage - blocked_percentage;
			responseData.data = {
				stats: {
					active_percentage,
					inactive_percentage,
					blocked_percentage,
					others_percentage,
				},
				revenue_from_sellers_chart: revenueFromSellers,
				sellers_data: pagination,
			};

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminPeopleService ~ getBuyers ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async viewOneSeller(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Seller Retrieved Successfully",
		};
		try {
			const { user_id, limit = 10, page = 1 } = payload;
			const user = await this.User.findById(user_id).populate("business");
			if (!user) {
				return {
					status: StatusMessages.error,
					code: HttpCodesEnum.HTTP_BAD_REQUEST,
					message: "User Not Found",
				};
			}
			const skip = (page - 1) * limit;
			const aggregateResult = await this.Product.aggregate([
				{
					$match: {
						vendor: user._id,
					},
				},
				{
					$project: {
						_id: 1,
						product_name: 1,
						unit_price: 1,
						product_quantity: 1,
						total_quantity_sold: 1,
						is_verified: 1,
						createdAt: 1,
						status: 1,
					},
				},
				{
					$sort: { createdAt: -1 },
				},
				{
					$skip: skip,
				},
				{
					$limit: limit,
				},

				{
					$group: {
						_id: null,
						products: {
							$push: {
								_id: "$_id",
								product_name: "$product_name",
								createdAt: "$createdAt",
								status: "$status",
								unit_price: "$unit_price",
								product_quantity: "$product_quantity",
								total_quantity_sold: "$total_quantity_sold",
								is_verified: "$is_verified",
							},
						},
						total_count: { $sum: 1 },
					},
				},
				{
					$project: {
						_id: 0,
						products: 1,
						total_count: 1,
					},
				},
			]);
			const data =
				aggregateResult.length > 0 ? aggregateResult[0]?.products : [];
			const totalCount =
				aggregateResult.length > 0 ? aggregateResult[0]?.total_count : 0;
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
			const totalSold = await this.OrderDetails.aggregate([
				{
					$match: {
						vendor: user._id,
						// status: OrderStatus.DELIVERED
					},
				},
				{
					$addFields: {
						total_amount_sold: { $multiply: ["$unit_price", "$quantity"] },
					},
				},
				{
					$group: {
						_id: null,
						total: { $sum: "$total_amount_sold" },
					},
				},
				{
					$project: {
						total_amount: "$total",
					},
				},
			]);
			responseData.data = {
				user,
				total_amount_sold: totalSold[0]?.total_amount || 0,
				product_records: pagination,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminPeopleService ~ viewOneSeller ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async blockAseller(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Seller Retrieved Successfully",
		};
		try {
			const { user_id, limit = 10, page = 1 } = payload;
			const user = await this.User.findById(user_id).populate("business");
			if (!user) {
				return {
					status: StatusMessages.error,
					code: HttpCodesEnum.HTTP_BAD_REQUEST,
					message: "User Not Found",
				};
			}
			// const blockStatus = user.IsBlocked
			const skip = (page - 1) * limit;
			const aggregateResult = await this.Product.aggregate([
				{
					$match: {
						vendor: user._id,
					},
				},
				{
					$project: {
						_id: 1,
						product_name: 1,
						unit_price: 1,
						product_quantity: 1,
						total_quantity_sold: 1,
						is_verified: 1,
						createdAt: 1,
						status: 1,
					},
				},
				{
					$sort: { createdAt: -1 },
				},
				{
					$skip: skip,
				},
				{
					$limit: limit,
				},

				{
					$group: {
						_id: null,
						products: {
							$push: {
								_id: "$_id",
								product_name: "$product_name",
								createdAt: "$createdAt",
								status: "$status",
								unit_price: "$unit_price",
								product_quantity: "$product_quantity",
								total_quantity_sold: "$total_quantity_sold",
								is_verified: "$is_verified",
							},
						},
						total_count: { $sum: 1 },
					},
				},
				{
					$project: {
						_id: 0,
						products: 1,
						total_count: 1,
					},
				},
			]);
			const data =
				aggregateResult.length > 0 ? aggregateResult[0]?.products : [];
			const totalCount =
				aggregateResult.length > 0 ? aggregateResult[0]?.total_count : 0;
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
			const totalSold = await this.OrderDetails.aggregate([
				{
					$match: {
						vendor: user._id,
						// status: OrderStatus.DELIVERED
					},
				},
				{
					$addFields: {
						total_amount_sold: { $multiply: ["$unit_price", "$quantity"] },
					},
				},
				{
					$group: {
						_id: null,
						total: { $sum: "$total_amount_sold" },
					},
				},
				{
					$project: {
						total_amount: "$total",
					},
				},
			]);
			responseData.data = {
				user,
				total_amount_sold: totalSold[0]?.total_amount || 0,
				product_records: pagination,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminPeopleService ~ viewOneSeller ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async getPurchasers(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Purchasers Retrieved Successfully",
		};
		try {
			const { limit = 10, page = 1, search } = payload;
			const role_id = new mongoose.Types.ObjectId("673c9cf44e37eeaa3697b8d6");
			const filter = {
				$and: [
					{ Role: role_id },
					{
						...(search && {
							$or: [
								{ FirstName: { $regex: search, $options: "i" } },
								{ LastName: { $regex: search, $options: "i" } },
								{ Email: { $regex: search, $options: "i" } },
								{ PhoneNumber: { $regex: search, $options: "i" } },
							],
						}),
					},
				],
			};
			var purchaserRecords = await getPaginatedRecords(this.Admin, {
				limit,
				page,
				data: filter,
			});
			responseData.data = purchaserRecords;
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminPeopleService ~ getPurchasers ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async viewaPurchaser(purchaser_id: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Purchaser Retrieved Successfully",
		};
		try {
			const purchaser = await this.Admin.findById(purchaser_id);
			if (!purchaser) {
				return {
					status: StatusMessages.error,
					code: HttpCodesEnum.HTTP_BAD_REQUEST,
					message: "Purchaser Not Found",
				};
			}
			responseData.data = purchaser;
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminPeopleService ~ viewaPurchaser ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async getPickupAssignments(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Pickups Retrieved Successfully",
		};
		try {
			const { limit = 10, page = 1, search, status, purchaser } = payload;
			const filter = {
				$and: [
					{
						...(purchaser && { purchaser }),
					},
					{
						...(status && { status }),
					},
					{
						...(search && {
							$or: [
								{
									"vendor_contact.first_name": {
										$regex: search,
										$options: "i",
									},
								},
								{
									"vendor_contact.last_name": {
										$regex: search,
										$options: "i",
									},
								},
								{
									"vendor_contact.phone_number": {
										$regex: search,
										$options: "i",
									},
								},
							],
						}),
					},
				],
			};
			var pickupRecords = await getPaginatedRecords(this.Assignment, {
				limit,
				page,
				data: filter,
				populateObj: {
					path: "order_details",
					select: "order ",
					populate: {
						path: "order",
						select: "tracking_id _id",
					},
				},
				populateObj1: {
					path: "purchaser",
					select: "_id FirstName LastName ProfileImage",
				},
			});
			const pickups = pickupRecords.data.map((pickup) => {
				return {
					_id: pickup?._id,
					tracking_id: pickup?.order_details?.order?.tracking_id,
					order_id: pickup?.order_details?.order?._id,
					purchaser: {
						_id: pickup?.purchaser?._id || "",
						profile_image: pickup?.purchaser?.ProfileImage || "",
						first_name: pickup?.purchaser?.FirstName || "",
						last_name: pickup?.purchaser?.LastName || "",
					},
					createdAt: pickup?.createdAt,
					quantity: pickup?.extra_detail?.quantity,
					vendor_contact: {
						first_name: pickup?.vendor_contact?.first_name || "",
						last_name: pickup?.vendor_contact?.last_name || "",
						phone_number: pickup?.vendor_contact?.phone_number || "",
					},
					status: pickup?.status,
				};
			});
			responseData.data = {
				data: pickups,
				pagination: pickupRecords.pagination,
			};
			return responseData;
		} catch (error: any) {
			console.log(
				"🚀 ~ AdminPeopleService ~ getPickupAssignments ~ error:",
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

	public async updatePickup(payload: any): Promise<ResponseData> {
		try {
			const { id, status } = payload;

			const assignment = await this.Assignment.findById(id);
			if (!assignment) {
				return {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Pickup Not Found",
				};
			}

			const updated = await this.Assignment.findByIdAndUpdate(
				id,
				{
					status,
				},
				{ new: true }
			);

			let order_detail_update: object;

			return {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Pickup updated successfully",
				data: updated,
			};
		} catch (error: any) {
			return catchBlockResponseFn(error);
		}
	}
}

export default AdminPeopleService;
