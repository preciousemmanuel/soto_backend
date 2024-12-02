import UserModel from "@/resources/user/user.model";
import {
	axiosRequestFunction,
	formatPhoneNumber,
	generateUnusedCoupon,
	uniqueCode,
} from "@/utils/helpers";
import {
	comparePassword,
	createToken,
	generateOtpModel,
	isOtpCorrect,
} from "@/utils/helpers/token";

// import logger from "@/utils/logger";
import {
	CreateCouponDto,
	OverviewDto,
	paginateDto,
	UpdateCouponDto,
	VerificationDto,
} from "./adminOverview.dto";
import { hashPassword } from "@/utils/helpers/token";
import {
	DiscountTypes,
	OrderStatus,
	OtpPurposeOptions,
	ProductMgtOption,
	PromoTypes,
	StatusMessages,
	UserTypes,
	YesOrNo,
} from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import cloudUploader from "@/utils/config/cloudUploader";
import MailService from "../mail/mail.service";
import { endOfDay, endOfToday, startOfDay } from "date-fns";
import orderModel from "../order/order.model";
import productModel from "../product/product.model";
import orderDetailsModel from "../order/orderDetails.model";
import {
	backDaterArray,
	FacetStage,
	ProductMgtDto,
} from "@/utils/interfaces/base.interface";
import { start } from "repl";
import { getPaginatedRecords, paginateInfo } from "@/utils/helpers/paginate";
import { HttpCodesEnum } from "@/utils/enums/httpCodes.enum";
import { requestProp } from "../mail/mail.interface";
import envConfig from "@/utils/config/env.config";
import { AddShippingAddressDto } from "../user/user.dto";
import shipmentModel from "../delivery/shipment.model";
import userModel from "@/resources/user/user.model";
import genCouponModel from "../coupon/genCoupon.model";
import adminModel from "../adminConfig/admin.model";
import {
	catchBlockResponse,
	catchBlockResponseFn,
} from "@/utils/constants/data";
import { AddProductDto, UpdateProductDto } from "../product/product.dto";
import ProductService from "../product/product.service";
import transactionLogModel from "../transaction/transactionLog.model";
import OrderService from "../order/order.service";
import assignmentModel from "../assignment/assignment.model";
import mongoose from "mongoose";

class AdminOverviewService {
	private User = UserModel;
	private Order = orderModel;
	private Product = productModel;
	private OrderDetails = orderDetailsModel;
	private Shipment = shipmentModel;
	private GeneralCoupon = genCouponModel;
	private TxnLog = transactionLogModel;
	private Admin = adminModel;
	private Assignment = assignmentModel;
	private mailService = new MailService();
	private productService = new ProductService();
	private orderService = new OrderService();

	public async getOverview(
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
			let revenue_amount: number = 0;
			let previous_revenue_amount: number = 0;
			let revenue_percentage: number = 0;
			let buyers_amount: number = 0;
			let previous_buyers_amount: number = 0;
			let buyers_percentage: number = 0;
			let sellers_amount: number = 0;
			let previous_sellers_amount: number = 0;
			let sellers_percentage: number = 0;
			let visitors_amount: number = 0;
			let previous_visitors_amount: number = 0;
			let visitors_percentage: number = 0;
			let orders_amount: number = 0;
			let previous_orders_amount: number = 0;
			let orders_percentage: number = 0;
			let conversion_amount: number = 0;
			let previous_conversion_amount: number = 0;
			let conversion_percentage: number = 0;
			let abandonned_cart_amount: number = 0;
			let previous_abandonned_cart_amount: number = 0;
			let abandonned_cart_revenue: number = 0;
			let abandonned_cart_percentage: number = 0;

			const revenuePipeline = [
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

			const revenueAggregate = await this.Order.aggregate(revenuePipeline);
			console.log(
				"🚀 ~ AdminOverviewService ~ revenueAggregate:",
				revenueAggregate
			);
			if (revenueAggregate.length > 0) {
				revenue_amount = revenueAggregate[0]?.sumAmount1 || 0;
				previous_revenue_amount = revenueAggregate[0]?.sumAmount2 || 0;
				revenue_percentage = revenueAggregate[0]?.percentageDifference || 0;
			}

			const orderPipeline = [
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

			const orderAggregate = await this.Order.aggregate(orderPipeline);
			if (orderAggregate.length > 0) {
				orders_amount = orderAggregate[0]?.countAmount1 || 0;
				previous_orders_amount = orderAggregate[0]?.countAmount2 || 0;
				orders_percentage = orderAggregate[0]?.percentageDifference || 0;
			}

			const buyersPipeline = [
				{
					$facet: {
						count1: [
							{
								$match: {
									createdAt: {
										$gte: new Date(start_date),
										$lte: new Date(end_date),
									},
									UserType: UserTypes.USER,
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
									UserType: UserTypes.USER,
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

			const buyerAggregate = await this.User.aggregate(buyersPipeline);

			if (buyerAggregate.length > 0) {
				buyers_amount = buyerAggregate[0]?.countAmount1 || 0;
				previous_buyers_amount = buyerAggregate[0]?.countAmount2 || 0;
				buyers_percentage = buyerAggregate[0]?.percentageDifference || 0;
			}

			const sellersPipeline = [
				{
					$facet: {
						count1: [
							{
								$match: {
									createdAt: {
										$gte: new Date(start_date),
										$lte: new Date(end_date),
									},
									UserType: UserTypes.VENDOR,
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
									UserType: UserTypes.VENDOR,
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

			const sellersAggregate = await this.User.aggregate(sellersPipeline);

			if (sellersAggregate.length > 0) {
				sellers_amount = sellersAggregate[0]?.countAmount1 || 0;
				previous_sellers_amount = sellersAggregate[0]?.countAmount2 || 0;
				sellers_percentage = sellersAggregate[0]?.percentageDifference || 0;
			}

			const advanced_report_pipeline = [];

			const facetStage: { $facet: FacetStage } = {
				$facet: {},
			};
			advanced_report_timeline.forEach((range) => {
				const { start, end, day, month, raw_date } = range;
				const key: string = day || month || "date";

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
								totalAmount: { $sum: "$amount" },
							},
						},
						{
							$project: {
								_id: 0,
								amount: { $ifNull: ["$totalAmount", 0] },
								raw_iso_date: "$iso_date",
							},
						},
					];
				}
			});
			advanced_report_pipeline.push(facetStage);
			advanced_report_pipeline.push({
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

			const advanced_report_aggregate = await this.Order.aggregate(
				advanced_report_pipeline
			);
			const advanced_report =
				advanced_report_aggregate.length > 0
					? advanced_report_aggregate[0]?.results
					: [];

			const abandonnedCartPipeline = [
				{
					$facet: {
						sum1: [
							{
								$match: {
									createdAt: {
										$gte: new Date(start_date),
										$lte: new Date(end_date),
									},
									status: OrderStatus.PENDING,
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
									status: OrderStatus.PENDING,
								},
							},
							{
								$group: {
									_id: null,
									totalAmount: { $sum: "$amount" },
								},
							},
						],
						count: [
							{
								$match: {
									createdAt: {
										$gte: new Date(previous_start_date),
										$lte: new Date(previous_end_date),
									},
									status: OrderStatus.PENDING,
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
						sumAmount1: { $arrayElemAt: ["$sum1.totalAmount", 0] },
						sumAmount2: { $arrayElemAt: ["$sum2.totalAmount", 0] },
						totalCount: { $arrayElemAt: ["$count.totalCount", 0] },
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

			const cartAggregate = await this.Order.aggregate(abandonnedCartPipeline);
			if (cartAggregate.length > 0) {
				abandonned_cart_amount = cartAggregate[0]?.totalCount || 0;
				abandonned_cart_revenue = cartAggregate[0]?.sumAmount1 || 0;
				abandonned_cart_percentage =
					cartAggregate[0]?.percentageDifference || 0;
			}

			responseData.data = {
				revenue: {
					amount: revenue_amount,
					percentage_change: Number(
						parseFloat(revenue_percentage.toString()).toFixed(1)
					),
				},
				buyers: {
					amount: buyers_amount,
					percentage_change: Number(
						parseFloat(buyers_percentage.toString()).toFixed(1)
					),
				},
				sellers: {
					amount: sellers_amount,
					percentage_change: Number(
						parseFloat(sellers_percentage.toString()).toFixed(1)
					),
				},
				visitors: {
					amount: visitors_amount,
					percentage_change: Number(
						parseFloat(visitors_percentage.toString()).toFixed(1)
					),
				},
				orders: {
					amount: orders_amount,
					percentage_change: Number(
						parseFloat(orders_percentage.toString()).toFixed(1)
					),
				},
				conversion: {
					amount: conversion_amount,
					percentage_change: Number(
						parseFloat(conversion_percentage.toString()).toFixed(1)
					),
				},
				advanced_report,
				cart: {
					abandonned_cart: abandonned_cart_amount,
					abandonned_revenue: abandonned_cart_revenue,
					percentage: Number(
						parseFloat(abandonned_cart_percentage.toString()).toFixed(1)
					),
				},
			};

			responseData.message = "Overview retreived successfully";
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminOverviewService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async getBestSellingProducts(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Best Seller Retrieved Successfully",
		};
		try {
			const { limit, page, start_date, end_date } = payload;
			const skip = (page - 1) * limit;
			let $match = {};
			// if(start_date && end_date){
			//   $match = {
			//     createdAt: {
			//       $gte: new Date(start_date),
			//       $lt: new Date(end_date)
			//     }
			//   }
			// }

			const aggregateResult = await this.OrderDetails.aggregate([
				// {
				//   ...((start_date && end_date) && {
				//     $match:{
				//       createdAt: {
				//         $gte: new Date(start_date),
				//         $lt: new Date(end_date)
				//       }
				//     }
				//   }),
				// },
				{
					$lookup: {
						from: "Products",
						localField: "product_id",
						foreignField: "_id",
						pipeline: [
							{
								$project: {
									_id: 1,
									product_name: 1,
									images: 1,
								},
							},
						],
						as: "product_with_image",
					},
				},
				{
					$unwind: {
						path: "$product_with_image",
						preserveNullAndEmptyArrays: true,
					},
				},
				{
					$project: {
						product_id: 1,
						product_name: 1,
						images: { $arrayElemAt: ["$product_with_image.images", 0] },
						total_price: { $multiply: ["$unit_price", "$quantity"] },
						quantity: 1,
					},
				},
				{
					$group: {
						_id: "$product_id",
						product_name: { $first: "$product_name" },
						images: { $first: "$images" },
						total_quantity: { $sum: "$quantity" },
						total_price: { $sum: "$total_price" },
					},
				},
				{
					$sort: { total_quantity: -1 },
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
								product_id: "$_id",
								product_name: "$product_name",
								images: "$images",
								total_quantity: "$total_quantity",
								total_price: "$total_price",
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
			responseData.data = pagination;

			return responseData;
		} catch (error: any) {
			console.log(
				"🚀 ~ AdminOverviewService ~ getBestSellingProducts ~ error:",
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

	public async getLatestOrders(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Latest Orders Retrieved Successfully",
		};
		try {
			const { limit, page, start_date, end_date } = payload;
			const skip = (page - 1) * limit;
			let $match = {};
			// if(start_date && end_date){
			//   $match = {
			//     createdAt: {
			//       $gte: new Date(start_date),
			//       $lt: new Date(end_date)
			//     }
			//   }
			// }

			const aggregateResult = await this.OrderDetails.aggregate([
				// {
				//   ...((start_date && end_date) && {
				//     $match:{
				//       createdAt: {
				//         $gte: new Date(start_date),
				//         $lt: new Date(end_date)
				//       }
				//     }
				//   }),
				// },
				{
					$lookup: {
						from: "Products",
						localField: "product_id",
						foreignField: "_id",
						as: "products_raw",
					},
				},
				{
					$unwind: {
						path: "$products_raw",
						preserveNullAndEmptyArrays: true,
					},
				},
				{
					$project: {
						product_id: 1,
						images: "$products_raw.images",
						product_name: 1,
						order: 1,
						quantity: 1,
						unit_price: 1,
						status: 1,
						createdAt: 1,
						total_price: { $multiply: ["$unit_price", "$quantity"] },
					},
				},
				// {
				//   $group: {
				//     _id: '$product_id',
				//     product_name: { $first: '$product_name' },
				//     total_quantity: { $sum: '$quantity' },
				//     total_price: { $sum: '$total_price' }
				//   }
				// },
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
								product_id: "$product_id",
								images: "$images",
								product_name: "$product_name",
								quantity: "$quantity",
								order: "$order",
								unit_price: "$unit_price",
								createdAt: "$createdAt",
								status: "$status",
								total_price: "$total_price",
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
			responseData.data = pagination;

			return responseData;
		} catch (error: any) {
			console.log(
				"🚀 ~ AdminOverviewService ~ getLatestOrders ~ error:",
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

	public async getOrders(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Orders Retrieved Successfully",
		};
		try {
			const { limit, page, start_date, end_date, status, tracking_id } =
				payload;

			const filter = {
				...(status && { status }),
				...(tracking_id && { tracking_id }),
				...(start_date &&
					end_date && {
						createdAt: {
							$gte: start_date,
							$lte: end_date,
						},
					}),
			};
			const records = await getPaginatedRecords(this.Order, {
				limit,
				page,
				data: filter,
				populateObj: {
					path: "user",
					select: "FirstName LastName ProfileImage",
				},
			});

			responseData.data = records;

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminOverviewService ~ getOrders ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	// public async viewAnOrder(order_id: any): Promise<ResponseData> {
	// 	let responseData: ResponseData = {
	// 		status: StatusMessages.success,
	// 		code: HttpCodes.HTTP_OK,
	// 		message: "Order Retrieved Successfully",
	// 	};
	// 	try {
	// 		const order = await this.Order.findById(order_id)
	// 			.populate({
	// 				path: "items.vendor",
	// 				select: "FirstName LastName Email ProfileImage PhoneNumber",
	// 			})
	// 			.populate({
	// 				path: "user",
	// 				select: "FirstName LastName ProfileImage Email PhoneNumber",
	// 			})
	// 			.populate({
	// 				path: "shipment",
	// 				select: {
	// 					address_to: {
	// 						line1: 1,
	// 						line2: 1,
	// 						city: 1,
	// 						state: 1,
	// 						country: 1,
	// 						coordinates: 1,
	// 					},
	// 					pickup_date: 1,
	// 				},
	// 			})
	// 			.populate("general_coupon");
	// 		if (!order) {
	// 			return {
	// 				status: StatusMessages.error,
	// 				code: HttpCodesEnum.HTTP_BAD_REQUEST,
	// 				message: "Order Not Found",
	// 			};
	// 		}
	// 		const log = await this.TxnLog.find({ narration_id: order_id });
	// 		const order_details = await this.OrderDetails.find({ order });
	// 		const order_details_ids: mongoose.Types.ObjectId[] = [];
	// 		for (const order_d of order_details) {
	// 			order_details_ids.push(order_d._id);
	// 		}
	// 		const assignments = await this.Assignment.find({
	// 			order_details: order_details_ids,
	// 		})
	// 			.populate("purchaser")
	// 			.populate("order_details");

	// 		const subOrders: any[] = [];

	// 		for (const ass of assignments) {
	// 			const matchedDetail = order_details.find(
	// 				(detail) =>
	// 					String(detail._id).toString() ===
	// 					String(ass.order_details).toString()
	// 			);
	// 			if (matchedDetail) {
	// 				subOrders.push({
	// 					...matchedDetail.toObject(),
	// 					assigned: true,
	// 					pickup_details: ass,
	// 				});
	// 			}
	// 		}

	// 		responseData.data = {
	// 			...order.toObject(),
	// 			payment_details: log,
	// 			subOrders,
	// 			assignments,
	// 		};
	// 		return responseData;
	// 	} catch (error: any) {
	// 		console.log("🚀 ~ AdminOverviewService ~ viewAnOrder ~ error:", error);
	// 		responseData = {
	// 			status: StatusMessages.error,
	// 			code: HttpCodes.HTTP_SERVER_ERROR,
	// 			message: error.toString(),
	// 		};
	// 		return responseData;
	// 	}
	// }

	public async viewAnOrder(order_id: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Order Retrieved Successfully",
		};

		try {
			const orderPipeline = [
				{
					$match: { _id: new mongoose.Types.ObjectId(order_id) },
				},
				{
					$lookup: {
						from: "Users",
						localField: "user",
						foreignField: "_id",
						as: "userDetails",
					},
				},
				{
					$unwind: {
						path: "$userDetails",
						preserveNullAndEmptyArrays: true,
					},
				},
				{
					$lookup: {
						from: "Shipments",
						localField: "shipment",
						foreignField: "_id",
						as: "shipmentDetails",
					},
				},
				{
					$unwind: {
						path: "$shipmentDetails",
						preserveNullAndEmptyArrays: true,
					},
				},
				{
					$lookup: {
						from: "GeneralCoupons",
						localField: "general_coupon",
						foreignField: "_id",
						as: "generalCouponDetails",
					},
				},
				{
					$unwind: {
						path: "$generalCouponDetails",
						preserveNullAndEmptyArrays: true,
					},
				},
				{
					$lookup: {
						from: "TransactionLogs",
						let: { orderId: { $toString: "$_id" } },
						pipeline: [
							{
								$match: {
									$expr: {
										$eq: ["$narration_id", "$$orderId"],
									},
								},
							},
						],
						as: "transactionLogs",
					},
				},
				// {
				// 	$unwind: {
				// 		path: "$transactionLogs",
				// 		preserveNullAndEmptyArrays: true,
				// 	},
				// },
				{
					$lookup: {
						from: "OrderDetails",
						localField: "_id",
						foreignField: "order",
						as: "orderDetails",
					},
				},
				{
					$lookup: {
						from: "Users",
						localField: "orderDetails.vendor",
						foreignField: "_id",
						as: "vendorDetails",
					},
				},
				{
					$lookup: {
						from: "Assignments",
						localField: "orderDetails._id",
						foreignField: "order_details",
						as: "assignments",
					},
				},
				{
					$lookup: {
						from: "Admins",
						localField: "assignments.purchaser",
						foreignField: "_id",
						as: "purchaserDetails",
					},
				},
				{
					$addFields: {
						orderDetails: {
							$map: {
								input: "$orderDetails",
								as: "detail",
								in: {
									$mergeObjects: [
										"$$detail",
										{
											vendor: {
												$arrayElemAt: [
													"$vendorDetails",
													{
														$indexOfArray: [
															"$vendorDetails._id",
															"$$detail.vendor",
														],
													},
												],
											},
											assignment: {
												$map: {
													input: "$assignments",
													as: "assignment",
													in: {
														$cond: {
															if: {
																$eq: [
																	"$$assignment.order_details",
																	"$$detail._id",
																],
															},
															then: {
																$mergeObjects: [
																	"$$assignment",
																	{
																		purchaser: {
																			$arrayElemAt: [
																				"$purchaserDetails",
																				{
																					$indexOfArray: [
																						"$purchaserDetails._id",
																						"$$assignment.purchaser",
																					],
																				},
																			],
																		},
																	},
																],
															},
															else: null,
														},
													},
												},
											},
										},
									],
								},
							},
						},
					},
				},
				{
					$project: {
						_id: 1,
						status: 1,
						items: 1,
						total_amount: 1,
						delivery_amount: 1,
						tracking_id: 1,
						grand_total: 1,
						discounted_amount: 1,
						is_coupon_applied: 1,
						shipment_charges: 1,
						shipping_address: 1,
						order_itinerary: 1,
						createdAt: 1,
						updatedAt: 1,
						applied_coupon: 1,
						user: {
							_id: "$userDetails._id",
							FirstName: "$userDetails.FirstName",
							LastName: "$userDetails.LastName",
							email: "$userDetails.Email",
							PhoneNumber: "$userDetails.PhoneNumber",
							profile_image: "$userDetails.ProfileImage",
							rank: "$userDetails.Rank",
						},
						shipment: "$shipmentDetails",
						general_coupon: { $ifNull: ["$generalCouponDetails", null] },
						payment_details: { $ifNull: ["$transactionLogs", []] },
						orderDetails: {
							$map: {
								input: "$orderDetails",
								as: "detail",
								in: {
									$mergeObjects: [
										"$$detail",
										{
											assignment: {
												$arrayElemAt: ["$$detail.assignment", 0],
											},
										},
									],
								},
							},
						},
					},
				},
			];

			const result = await this.Order.aggregate(orderPipeline);

			if (!result || result.length === 0) {
				return {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Order Not Found",
				};
			}

			responseData.data = result[0];
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminOverviewService ~ viewAnOrder ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async cancelAnOrder(order_id: any): Promise<ResponseData> {
		try {
			return this.orderService.cancelAnOrder(order_id);
		} catch (error: any) {
			console.log("🚀 ~ AdminOverviewService ~ viewAnOrder ~ error:", error);
			return catchBlockResponseFn(error);
		}
	}

	public async getProductMgts(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Orders Retrieved Successfully",
		};
		try {
			const {
				limit,
				page,
				start_date,
				end_date,
				status,
				product_name,
				select_type,
			} = payload;
			let filter: object;
			let productData: ProductMgtDto;
			let paginateRequest;
			let product_type: string;
			switch (select_type) {
				case ProductMgtOption.SOLD:
					filter = {
						...(status && { status }),
						...(product_name && {
							product_name: { $regex: product_name, $options: "i" },
						}),
						...(start_date &&
							end_date && {
								createdAt: {
									$gte: start_date,
									$lte: end_date,
								},
							}),
						total_quantity_sold: { $gt: 0 },
					};
					paginateRequest = await getPaginatedRecords(this.Product, {
						limit,
						page,
						data: filter,
					});
					paginateRequest.data.map((prod) => {
						productData = {
							name: prod.product_name,
							description: prod.description,
							images: prod.images,
							quantity_sold: prod.total_quantity_sold,
							quantity: prod.product_quantity,
							price: prod.unit_price,
							discounted_price: prod.discount_price || 0,
							is_discounted: prod.is_discounted,
						};
					});
					product_type = "Sold";
					break;
				case ProductMgtOption.PROMO:
					filter = {
						...(status && { status }),
						...(product_name && {
							product_name: { $regex: product_name, $options: "i" },
						}),
						...(start_date &&
							end_date && {
								createdAt: {
									$gte: start_date,
									$lte: end_date,
								},
							}),
						is_discounted: true,
					};
					paginateRequest = await getPaginatedRecords(this.Product, {
						limit,
						page,
						data: filter,
					});
					paginateRequest.data.map((prod) => {
						productData = {
							name: prod.product_name,
							description: prod.description,
							images: prod.images,
							quantity_sold: prod.total_quantity_sold,
							quantity: prod.product_quantity,
							price: prod.unit_price,
							discounted_price: prod.discount_price || 0,
							is_discounted: prod.is_discounted,
						};
					});
					product_type = "Promo";
					break;
				case ProductMgtOption.OUT_OF_STOCK:
					filter = {
						...(status && { status }),
						...(product_name && {
							product_name: { $regex: product_name, $options: "i" },
						}),
						...(start_date &&
							end_date && {
								createdAt: {
									$gte: start_date,
									$lte: end_date,
								},
							}),
						product_quantity: 0,
					};
					paginateRequest = await getPaginatedRecords(this.Product, {
						limit,
						page,
						data: filter,
					});
					paginateRequest.data.map((prod) => {
						productData = {
							name: prod.product_name,
							description: prod.description,
							images: prod.images,
							quantity_sold: prod.total_quantity_sold,
							quantity: prod.product_quantity,
							price: prod.unit_price,
							discounted_price: prod.discount_price || 0,
							is_discounted: prod.is_discounted,
						};
					});
					product_type = "Out of Stock";
					break;
				case ProductMgtOption.RETURNED:
					filter = {
						...(status && { status: OrderStatus.RETURNED }),
						...(product_name && {
							product_name: { $regex: product_name, $options: "i" },
						}),
						...(start_date &&
							end_date && {
								createdAt: {
									$gte: start_date,
									$lte: end_date,
								},
							}),
					};

					paginateRequest = await getPaginatedRecords(this.OrderDetails, {
						limit,
						page,
						data: filter,
						populateObj: {
							path: "product_id",
							select: "images total_quantity_sold",
						},
					});
					paginateRequest.data.map((prod) => {
						productData = {
							name: prod.product_name,
							description: prod.description || "",
							images: prod.toObject()?.product_id?.images || [],
							quantity_sold:
								prod.toObject()?.product_id?.total_quantity_sold || 0,
							quantity: prod.quantity,
							price: prod.unit_price,
							discounted_price: prod.unit_price || 0,
							is_discounted: prod.is_discounted,
						};
					});
					product_type = "Returned";
					break;
				default:
					filter = {
						...(status && { status }),
						...(product_name && {
							product_name: { $regex: product_name, $options: "i" },
						}),
						...(start_date &&
							end_date && {
								createdAt: {
									$gte: start_date,
									$lte: end_date,
								},
							}),

						// is_verified:true,
					};
					console.log(
						"🚀 ~ AdminOverviewService ~ getProductMgts ~ filter:",
						filter
					);

					paginateRequest = await getPaginatedRecords(this.Product, {
						limit,
						page,
						data: filter,
					});
					paginateRequest.data.map((prod) => {
						productData = {
							name: prod.product_name,
							description: prod.description,
							images: prod.images,
							quantity_sold: prod.total_quantity_sold,
							quantity: prod.product_quantity,
							price: prod.unit_price,
							discounted_price: prod.discount_price || 0,
							is_discounted: prod.is_discounted,
						};
					});
					product_type = "Active";
					break;
			}
			responseData.message = product_type + " Products Retreived Successfully";
			responseData.data = paginateRequest;
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminOverviewService ~ getOrders ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async createProduct(payload: AddProductDto): Promise<ResponseData> {
		try {
			const sotoUser =
				(await this.User.findOne({
					FirstName: "SOTO",
					LastName: "SOTO",
					Email: "soto@gmail.com",
					PhoneNumber: "0000000",
				})) ||
				(await this.User.create({
					FirstName: "SOTO",
					LastName: "SOTO",
					Email: "soto@gmail.com",
					PhoneNumber: "0000000",
				}));
			const addProduct = await this.productService.addProduct(
				payload,
				sotoUser
			);
			return addProduct;
		} catch (error: any) {
			console.log("🚀 ~ AdminOverviewService ~ createProduct ~ error:", error);
			return catchBlockResponse;
		}
	}

	public async updateProduct(payload: UpdateProductDto): Promise<ResponseData> {
		try {
			const sotoUser =
				(await this.User.findOne({
					FirstName: "SOTO",
					LastName: "SOTO",
					Email: "soto@gmail.com",
					PhoneNumber: "0000000",
				})) ||
				(await this.User.create({
					FirstName: "SOTO",
					LastName: "SOTO",
					Email: "soto@gmail.com",
					PhoneNumber: "0000000",
				}));
			console.log(
				"🚀 ~ AdminOverviewService ~ updateProduct ~ sotoUser:",
				sotoUser
			);

			const addProduct = await this.productService.updateProduct(
				payload,
				sotoUser
			);
			return addProduct;
		} catch (error: any) {
			console.log("🚀 ~ AdminOverviewService ~ updateProduct ~ error:", error);
			return catchBlockResponse;
		}
	}

	public async viewAProduct(product_id: string): Promise<ResponseData> {
		try {
			const viewAProduct = await this.productService.viewAProduct(product_id);
			return viewAProduct;
		} catch (error: any) {
			console.log("🚀 ~ AdminOverviewService ~ viewAProduct ~ error:", error);
			return catchBlockResponse;
		}
	}

	public async createShippingAddress(
		payload: AddShippingAddressDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Shipping Address Created Successfully",
		};
		try {
			const {
				user,
				address,
				is_admin = false,
				city,
				country = "NG",
				state,
				postal_code,
			} = payload;
			let body: object;
			let filter_id: string = String(user._id);
			switch (is_admin) {
				case true:
					console.log(
						"🚀 ~ AdminOverviewService ~ createShippingAddress ~ is_admin:",
						is_admin
					);

					body = {
						first_name: user?.FirstName,
						last_name: user?.LastName,
						email: user?.Email,
						line1: address,
						city,
						country: "NG",
						state,
						zip: postal_code,
					};
					break;
				default:
					console.log(
						"🚀 ~ AdminOverviewService ~ createShippingAddress ~ is_admin:",
						is_admin
					);
					filter_id = String(user._id);
					body = {
						first_name: user.FirstName,
						last_name: user.LastName,
						email: user.Email,
						phone: formatPhoneNumber(user.PhoneNumber),
						line1: address,
						city,
						country: "NG",
						state,
						zip: postal_code,
					};
					break;
			}
			const axiosConfig: requestProp = {
				method: "POST",
				url: envConfig.TERMINAL_AFRICA_BASE_URL + `/addresses`,
				body: body,
				headers: {
					authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`,
				},
			};
			const createAddressCall = await axiosRequestFunction(axiosConfig);
			if (createAddressCall.status === StatusMessages.error) {
				return createAddressCall;
			}
			const addressData: any = createAddressCall.data.data;
			const addressUpdate = {
				coordinate: [
					addressData?.coordinates?.lng,
					addressData?.coordinates?.lat,
				],
				ShippingAddress: {
					full_address: `${address}, ${city}, ${state}, ${country}`,
					address,
					address_id: addressData.address_id,
					city: addressData.city,
					coordinates: addressData.coordinates,
					country,
					postal_code,
				},
				shipping_address_id: addressData.address_id,
			};
			const updatedAddress = await this.User.findByIdAndUpdate(
				filter_id,
				addressUpdate,
				{ new: true }
			);
			responseData.data = updatedAddress;
			return responseData;
		} catch (error: any) {
			console.log(
				"🚀 ~ AdminOverviewService ~ createShippingAddress ~ error:",
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

	public async createShipment(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Shipment Created Successfully",
		};
		try {
			const { user, order_id, soto_user } = payload;
			const order = await this.Order.findOne({
				_id: order_id,
				status: OrderStatus.BOOKED,
			});
			if (!order) {
				return {
					status: StatusMessages.error,
					code: HttpCodesEnum.HTTP_BAD_REQUEST,
					message: "Order Not Found",
				};
			}
			const body = {
				address_from: soto_user.shipping_address_id,
				address_to: order.delivery_vendor.delivery_address,
				parcel: order.delivery_vendor.parcel,
			};

			const axiosConfig: requestProp = {
				method: "POST",
				url: envConfig.TERMINAL_AFRICA_BASE_URL + `/shipments`,
				body,
				headers: {
					authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`,
				},
			};
			const createShipmentCall = await axiosRequestFunction(axiosConfig);
			if (createShipmentCall.status === StatusMessages.error) {
				return createShipmentCall;
			}
			const shipmentData: any = createShipmentCall.data.data;
			const createShipmentData = {
				address_from: shipmentData.address_from,
				address_return: shipmentData.address_return,
				address_to: shipmentData.address_to,
				events: shipmentData.events,
				created_shipment_id: shipmentData.id,
				parcel: shipmentData.parcel,
				shipment_id: shipmentData.shipment_id,
				status: shipmentData.status,
				order: order._id,
			};
			const newShipment = await this.Shipment.create(createShipmentData);
			await this.Order.findByIdAndUpdate(order._id, {
				shipment: newShipment._id,
			});

			responseData.data = newShipment;
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminOverviewService ~ createShipment ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async arrangePickup(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Pickup Arranged Successfully",
		};
		try {
			const { user, order_id, soto_user } = payload;
			const order = await this.Order.findOne({
				_id: order_id,
				status: OrderStatus.BOOKED,
			});
			if (!order) {
				return {
					status: StatusMessages.error,
					code: HttpCodesEnum.HTTP_BAD_REQUEST,
					message: "Order Not Found",
				};
			}
			const body = {
				rate_id: order.toObject().delivery_vendor.rate_id,
				parcel: order.delivery_vendor.parcel,
			};

			const axiosConfig: requestProp = {
				method: "POST",
				url: envConfig.TERMINAL_AFRICA_BASE_URL + `/shipments/pickup`,
				body,
				headers: {
					authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`,
				},
			};
			const createShipmentCall = await axiosRequestFunction(axiosConfig);
			if (createShipmentCall.status === StatusMessages.error) {
				return createShipmentCall;
			}
			const shipmentData: any = createShipmentCall.data.data;
			const createShipmentData = {
				address_from: shipmentData.address_from,
				address_return: shipmentData.address_return,
				address_to: shipmentData.address_to,
				events: shipmentData.events,
				extras: shipmentData.extras,
				created_shipment_id: shipmentData.id || shipmentData._id,
				parcel: shipmentData.parcel,
				shipment_id: shipmentData.shipment_id,
				status: shipmentData.status,
				order: order._id,
			};
			const newShipment = await this.Shipment.create(createShipmentData);
			await this.Order.findByIdAndUpdate(order._id, {
				shipment: newShipment._id,
			});

			responseData.data = newShipment;
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminOverviewService ~ createShipment ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async trackShipment(order_id: string): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Shipment Tracked Successfully",
		};
		try {
			const shipment = await this.Shipment.findOne({
				order: order_id,
			});
			if (!shipment) {
				return {
					status: StatusMessages.error,
					code: HttpCodesEnum.HTTP_BAD_REQUEST,
					message: "Shipment Not Found",
				};
			}
			const shipment_id = String(shipment.toObject().shipment_id);

			const axiosConfig: requestProp = {
				method: "GET",
				url:
					envConfig.TERMINAL_AFRICA_BASE_URL +
					`/shipments/track/${shipment_id}`,
				headers: {
					authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`,
				},
			};
			const trackShipmentCall = await axiosRequestFunction(axiosConfig);
			if (trackShipmentCall.status === StatusMessages.error) {
				return trackShipmentCall;
			}
			const shipmentData: any = trackShipmentCall.data.data;
			const trackShipmentData = {
				...shipmentData,
			};
			const trackedShipment = await this.Shipment.findByIdAndUpdate(
				shipment._id,
				trackShipmentData,
				{ new: true }
			);

			responseData.data = trackedShipment;
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminOverviewService ~ trackShipment ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async createCoupon(
		payload: CreateCouponDto,
		user: InstanceType<typeof userModel>
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Coupon Created Successfully",
		};
		try {
			const exsitingCoupon = await this.GeneralCoupon.findOne({
				name: payload.name.toLowerCase(),
			});
			if (exsitingCoupon) {
				return {
					status: StatusMessages.error,
					code: HttpCodesEnum.HTTP_BAD_REQUEST,
					message: "Coupon With This Name Already Exists",
				};
			}
			const code = await generateUnusedCoupon();
			const coupon_type =
				payload.coupon_type === PromoTypes.FIXED_DISCOUNT ||
				payload.coupon_type === PromoTypes.PRICE_DISCOUNT ||
				payload.coupon_type === PromoTypes.PERCENTAGE_DISCOUNT
					? PromoTypes.PRICE_DISCOUNT
					: PromoTypes.FREE_SHIPPING;

			const amount_type =
				payload.coupon_type === PromoTypes.FIXED_DISCOUNT ||
				payload.coupon_type === PromoTypes.PRICE_DISCOUNT ||
				payload.coupon_type === PromoTypes.FREE_SHIPPING
					? DiscountTypes.FIXED
					: DiscountTypes.PERCENTAGE;

			const newGenCoupon = await this.GeneralCoupon.create({
				name: payload.name.toLowerCase(),
				code,
				amount: payload.amount,
				coupon_type,
				amount_type,
				audience: payload.applied_to,
				activation_date: startOfDay(new Date(payload.activation_date)),
				...(payload?.expiry_date &&
					payload.remove_expiry_date === YesOrNo.NO && {
						expiry_date: endOfDay(new Date(payload.expiry_date)),
					}),
				...(payload?.usage_limit &&
					payload.remove_usage_limit === YesOrNo.NO && {
						usage_limit: payload.usage_limit,
					}),
				created_by: user?._id,
				remove_usage_limit:
					payload.remove_usage_limit === YesOrNo.NO ? true : false,
				remove_expiry_date:
					payload.remove_expiry_date === YesOrNo.NO ? true : false,
			});

			responseData.data = newGenCoupon;
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminOverviewService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async updateCoupon(
		payload: UpdateCouponDto,
		coupon_id: string,
		user: InstanceType<typeof userModel>
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Coupon updated Successfully",
		};
		try {
			const exsitingCoupon = await this.GeneralCoupon.findById(coupon_id);
			if (!exsitingCoupon) {
				return {
					status: StatusMessages.error,
					code: HttpCodesEnum.HTTP_BAD_REQUEST,
					message: "Coupon Not Found",
				};
			}
			const coupon_type = payload.coupon_type
				? payload.coupon_type === PromoTypes.FIXED_DISCOUNT ||
					payload.coupon_type === PromoTypes.PRICE_DISCOUNT ||
					payload.coupon_type === PromoTypes.PERCENTAGE_DISCOUNT
					? PromoTypes.PRICE_DISCOUNT
					: PromoTypes.FREE_SHIPPING
				: undefined;

			const amount_type = payload.coupon_type
				? payload.coupon_type === PromoTypes.FIXED_DISCOUNT ||
					payload.coupon_type === PromoTypes.PRICE_DISCOUNT ||
					payload.coupon_type === PromoTypes.FREE_SHIPPING
					? DiscountTypes.FIXED
					: DiscountTypes.PERCENTAGE
				: undefined;

			const update = {
				...(payload?.name && {
					name: payload.name.toLowerCase(),
				}),
				...(payload?.amount && {
					amount: payload.amount,
				}),
				...(coupon_type && {
					coupon_type,
				}),
				...(amount_type && {
					amount_type,
				}),
				...(payload?.applied_to && {
					audience: payload.applied_to,
				}),
				...(payload?.activation_date && {
					activation_date: startOfDay(new Date(payload.activation_date)),
				}),
				...(payload?.expiry_date && {
					expiry_date: endOfDay(new Date(payload.expiry_date)),
				}),
				...(payload?.usage_limit &&
					payload.remove_usage_limit === YesOrNo.NO && {
						usage_limit: payload.usage_limit,
					}),
				...(payload?.remove_usage_limit && {
					remove_usage_limit:
						payload.remove_usage_limit === YesOrNo.NO ? true : false,
				}),
				...(payload?.remove_expiry_date && {
					remove_expiry_date:
						payload.remove_expiry_date === YesOrNo.NO ? true : false,
				}),
				...(payload?.active_status && {
					active_status: payload.active_status === YesOrNo.NO ? true : false,
				}),
				updated_by: user?._id,
			};

			const updatedCoupon = await this.GeneralCoupon.findByIdAndUpdate(
				coupon_id,
				update,
				{ new: true }
			);

			responseData.data = updatedCoupon;
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminOverviewService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async getCoupons(payload: paginateDto): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Coupons retreived Successfully",
		};
		try {
			const { limit, page, start_date, end_date, search } = payload;
			const dataFilter = {
				$or: [
					{
						...(search && {
							name: { $regex: search, $options: "i" },
						}),
						...(start_date &&
							end_date && {
								createdAt: {
									$gte: startOfDay(start_date),
									$lt: endOfDay(end_date),
								},
							}),
					},
					{
						...(search && {
							code: { $regex: search, $options: "i" },
						}),
						...(start_date &&
							end_date && {
								createdAt: {
									$gte: startOfDay(start_date),
									$lt: endOfDay(end_date),
								},
							}),
					},
				],
			};
			const couponRecords = await getPaginatedRecords(this.GeneralCoupon, {
				limit,
				page,
				data: dataFilter,
			});
			responseData.data = couponRecords;

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminOverviewService ~ getCoupons ~ error:", error);
			return catchBlockResponse;
		}
	}
}

export default AdminOverviewService;
