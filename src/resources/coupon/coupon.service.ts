// import logger from "@/utils/logger";
import { FetchCategoriesDto } from "./coupon.dto";
import {
	DiscountTypes,
	PromoTypes,
	StatusMessages,
} from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import { getPaginatedRecords } from "@/utils/helpers/paginate";
import { categorySeedData } from "@/utils/seeders/category.data";
import genCouponModel from "./genCoupon.model";
import orderModel from "../order/order.model";
import userCouponModel from "./userCoupon.model";
import { endOfToday, startOfToday } from "date-fns";
import { catchBlockResponseFn } from "@/utils/constants/data";
import { HttpCodesEnum } from "@/utils/enums/httpCodes.enum";
import userModel from "../user/user.model";

class CouponService {
	private Order = orderModel;
	private GenCoupon = genCouponModel;
	private Usercoupon = userCouponModel;
	private User = userModel;

	public async useCoupon(
		order: InstanceType<typeof this.Order>,
		genCoupon: InstanceType<typeof this.GenCoupon>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			console.log("WE WANT TO TRY AND APPLY COUPON TO THE PRICE");
			console.log("ORDER GRAND TOTAL BEFORE COUPON:: ", order.grand_total);

			let finalOrder: InstanceType<typeof this.Order> | null;
			let discount_amount = 0;
			if (genCoupon) {
				const couponUsage = await this.Usercoupon.countDocuments({
					coupon: genCoupon._id,
				});
				switch (genCoupon?.amount_type) {
					case DiscountTypes.FIXED:
						discount_amount = genCoupon.amount;
						break;
					default:
						discount_amount = Math.round(
							order.grand_total * (genCoupon.amount / 100)
						);
						break;
				}
				let deducted_final: number;
				switch (genCoupon.coupon_type) {
					case PromoTypes.FREE_SHIPPING:
						order.shipment_charges = false;
						await order.save();
						break;

					default:
						if (
							genCoupon.usage_limit &&
							genCoupon.remove_usage_limit === false
						) {
							if (genCoupon.total_usage < genCoupon.usage_limit) {
								deducted_final = order.grand_total - discount_amount;
								order.grand_total = deducted_final > 0 ? deducted_final : 0;
							}
						}
						break;
				}
				if (
					genCoupon.usage_limit &&
					genCoupon.usage_limit > couponUsage &&
					genCoupon.remove_usage_limit === false
				) {
					console.log("COUPON HAS USAGE LIMIT");
					await order.save();
					const userCoupon = await this.Usercoupon.findOneAndUpdate(
						{
							user: order.user,
							coupon: genCoupon._id,
							order: order._id,
						},
						{
							$setOnInsert: {
								activation_date: genCoupon.activation_date,
								expiry_date: genCoupon.expiry_date,
								amount_type: genCoupon.amount_type,
								status: "active",
								order: order._id,
							},
						},
						{
							new: true,
							upsert: true,
						}
					);
					await this.Order.findByIdAndUpdate(
						order._id,
						{
							applied_coupon: userCoupon._id,
							general_coupon: genCoupon._id,
							is_coupon_applied: true,
							discounted_amount: discount_amount,
						},
						{ new: true }
					);
					finalOrder = await this.Order.findById(order._id);
					const usage = await this.Usercoupon.countDocuments({
						coupon: genCoupon._id,
					});
					const active_status = genCoupon?.usage_limit
						? genCoupon.usage_limit > usage
						: true;
					await this.GenCoupon.findByIdAndUpdate(genCoupon._id, {
						total_usage: usage,
						active_status,
					});
					console.log("COUPON APPLICATION COMPLETED");
				} else if (genCoupon.remove_usage_limit === true) {
					console.log("COUPON HAS NO USAGE LIMIT");
					await order.save();
					const userCoupon = await this.Usercoupon.findOneAndUpdate(
						{
							user: order.user,
							coupon: genCoupon._id,
							order: order._id,
						},
						{
							$setOnInsert: {
								activation_date: genCoupon.activation_date,
								expiry_date: genCoupon.expiry_date,
								amount_type: genCoupon.amount_type,
								status: "active",
								order: order._id,
							},
						},
						{
							new: true,
							upsert: true,
						}
					);
					await this.Order.findByIdAndUpdate(
						order._id,
						{
							applied_coupon: userCoupon._id,
							general_coupon: genCoupon._id,
							is_coupon_applied: true,
							discounted_amount: discount_amount,
						},
						{ new: true }
					);
					finalOrder = await this.Order.findById(order._id);
					const usage = await this.Usercoupon.countDocuments({
						coupon: genCoupon._id,
					});
					const active_status = genCoupon?.usage_limit
						? genCoupon.usage_limit > usage
						: true;
					await this.GenCoupon.findByIdAndUpdate(genCoupon._id, {
						total_usage: usage,
						active_status,
					});
					console.log("COUPON APPLICATION COMPLETED");
				} else {
					finalOrder = order;
					console.log("COUPON APPLICATION INCOMPLETE");
				}
			} else {
				finalOrder = order;
				console.log("COUPON APPLICATION DENIED");
			}
			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Order Processed Successfully",
				data: finalOrder,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ BusinessService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
				data: order,
			};
			return responseData;
		}
	}

	public async getAvailableCoupons(
		limit: number,
		page: number,
		user: InstanceType<typeof this.User>
	): Promise<ResponseData> {
		try {
			const genCoupons = await getPaginatedRecords(this.GenCoupon, {
				limit,
				page,
				data: {
					active_status: true,
					activation_date: {
						$lte: startOfToday(),
					},
					expiry_date: {
						$gt: endOfToday(),
					},
				},
			});
			return {
				status: StatusMessages.success,
				code: HttpCodesEnum.HTTP_OK,
				message: "Available Coupons Fetched Successfully",
				data: genCoupons,
			};
		} catch (error: any) {
			console.log("🚀 ~ CouponService ~ getAvailableCoupons ~ error:", error);
			return catchBlockResponseFn(error);
		}
	}

	public async getMyAppliedCoupons(
		limit: number,
		page: number,
		user: InstanceType<typeof this.User>
	): Promise<ResponseData> {
		try {
			const userCoupons = await getPaginatedRecords(this.Usercoupon, {
				limit,
				page,
				data: {
					user: user._id,
				},
				populateObj: {
					path: "coupon",
					select: "name code",
				},
			});

			return {
				status: StatusMessages.success,
				code: HttpCodesEnum.HTTP_OK,
				message: "Used Coupons Fetched Successfully",
				data: userCoupons,
			};
		} catch (error: any) {
			console.log("🚀 ~ CouponService ~ getMyAppliedCoupons ~ error:", error);
			return catchBlockResponseFn(error);
		}
	}
}

export default CouponService;
