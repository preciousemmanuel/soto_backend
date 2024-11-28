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
	CreateAssignmentDto,
	OrderDetailsForAssignmentDto,
} from "./assignment.dto";
import { hashPassword } from "@/utils/helpers/token";
import {
	OrderStatus,
	OtpPurposeOptions,
	StatusMessages,
	UserTypes,
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
import assignmentModel from "./assignment.model";
import adminModel from "../adminConfig/admin.model";
import mongoose from "mongoose";
import { HttpCodesEnum } from "@/utils/enums/httpCodes.enum";
import { catchBlockResponseFn } from "@/utils/constants/data";

class AssignmentService {
	private User = UserModel;
	private Order = orderModel;
	private Product = productModel;
	private OrderDetails = orderDetailsModel;
	private Assignment = assignmentModel;
	private Admin = adminModel;
	private mailService = new MailService();

	public async createAssignments(
		payload: CreateAssignmentDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "",
		};
		try {
			console.log("TIME TO CREATE ASSIGNMENTS FOR PICK UP AGENTS");
			const role_id = new mongoose.Types.ObjectId("673c9cf44e37eeaa3697b8d6");
			const purchasers: any[] = [];
			const assignmentObject = (
				vendors: InstanceType<typeof this.User>[],
				orderDetails: OrderDetailsForAssignmentDto[]
			) => {
				return orderDetails
					.map(async (detail) => {
						const matchedVendor = vendors.find(
							(vendor) =>
								String(vendor._id).toString() ===
								String(detail.vendor).toString()
						);
						if (matchedVendor) {
							const nearestPurchaser = (
								await this.Admin.aggregate([
									{
										$geoNear: {
											near: {
												type: "Point",
												coordinates: matchedVendor.coordinate,
											},
											distanceField: "distance",
											key: "coordinate",
											spherical: true,
											query: {
												Role: role_id,
											},
										},
									},
									{
										$sort: { distance: 1 },
									},
									{
										$limit: 1,
									},
								])
							)[0];
							if (nearestPurchaser) {
								purchasers.push(nearestPurchaser);
								return {
									order_details: detail._id,
									extra_detail: {
										...detail.toObject(),
									},
									purchaser: nearestPurchaser._id,
									vendor_contact: {
										first_name: matchedVendor.FirstName,
										last_name: matchedVendor.LastName,
										phone_number: matchedVendor.PhoneNumber,
										...matchedVendor?.ShippingAddress,
									},
								};
							}
							return null;
						}
						return null;
					})
					.filter((result) => result !== null);
			};
			const order_details_array: any[] = [];
			const vendor_id_array: any[] = [];
			payload.order_details.map((detail) => {
				order_details_array.push(detail._id);
				vendor_id_array.push(detail.vendor);
			});

			const vendors = await this.User.find({
				_id: { $in: vendor_id_array },
			});
			const orderDetails = payload.order_details;

			const InsertsAssignment = assignmentObject(vendors, orderDetails);
			let assignments: any[];
			await this.Assignment.insertMany(InsertsAssignment)
				.then((ass) => {
					assignments = ass;
					this.sendAssignmentMailsToPurchasers(
						purchasers as InstanceType<typeof this.Admin>[],
						assignments as InstanceType<typeof this.Assignment>[]
					);
					responseData.data = assignments;
					responseData.message =
						"Assignments Created Successfully successfully";
				})
				.catch((e: any) => {
					console.log(
						"🚀 ~ AssignmentService ~this.Assignment.insertMany(InsertsAssignment) e:",
						e
					);
					responseData = {
						status: StatusMessages.error,
						code: HttpCodesEnum.HTTP_BAD_REQUEST,
						message: e.toString(),
					};
				});
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

	public async sendAssignmentMailsToPurchasers(
		purchasers: InstanceType<typeof this.Admin>[],
		assignments: InstanceType<typeof this.Assignment>[]
	) {
		try {
			for (const purchaser of purchasers) {
				this.mailService.sendAssignmentsToPurchasers({
					email: purchaser.Email,
					first_name: purchaser.FirstName,
					assignments: assignments as InstanceType<typeof this.Assignment>[],
				});
			}
		} catch (error: any) {
			console.log(
				"🚀 ~ AssignmentService sendAssignmentMailsToPurchasers ~ error:",
				error
			);
			catchBlockResponseFn(error);
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
					$project: {
						product_id: 1,
						product_name: 1,
						total_price: { $multiply: ["$unit_price", "$quantity"] },
						quantity: 1,
					},
				},
				{
					$group: {
						_id: "$product_id",
						product_name: { $first: "$product_name" },
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
					$project: {
						product_id: 1,
						product_name: 1,
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
								product_name: "$product_name",
								quantity: "$quantity",
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
}

export default AssignmentService;
