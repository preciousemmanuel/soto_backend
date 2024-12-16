import { User, ShippingAddress } from "@/resources/user/user.interface";
import UserModel from "./user.model";
import { backDaterForChart, uniqueCode } from "@/utils/helpers";
import {
	comparePassword,
	createToken,
	generateOtpModel,
	isOtpCorrect,
} from "@/utils/helpers/token";

// import logger from "@/utils/logger";
import {
	AddShippingAddressDto,
	ChangePasswordDto,
	CreateUserDto,
	LoginDto,
	vendorDashboardDto,
	vendorInventoryDto,
} from "./user.dto";
import { hashPassword } from "@/utils/helpers/token";
import {
	OrderStatus,
	OtpPurposeOptions,
	ProductMgtOption,
	StatusMessages,
	Timeline,
	UserTypes,
} from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import WalletModel from "../business/wallet.model";
import cartModel from "../order/cart.model";
import MailService from "../mail/mail.service";
import transactionLogModel from "../transaction/transactionLog.model";
import orderDetailsModel from "../order/orderDetails.model";
import mongoose, { PipelineStage } from "mongoose";
import productModel from "../product/product.model";
import { BackDaterResponse } from "@/utils/interfaces/base.interface";
import { getPaginatedRecords } from "@/utils/helpers/paginate";
import otpModel from "./otp.model";
import { endOfMonth, startOfMonth } from "date-fns";
import { email } from "envalid";

class UserService {
	private user = UserModel;
	private wallet = WalletModel;
	private Cart = cartModel;
	private Otp = otpModel;
	private TransactionLog = transactionLogModel;
	private OrderDetail = orderDetailsModel;
	private Product = productModel;
	private mailService = new MailService();

	public async createUser(createUser: CreateUserDto): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const userExist = await this.user.findOne({
				$or: [
					{ Email: createUser.Email.toLowerCase() },
					{ PhoneNumber: createUser.PhoneNumber },
				],
			});

			if (userExist) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "User With These Details Already Exists",
				};
			} else {
				const full_name_split = createUser.FullName.split(" ");
				console.log("🚀 ~ UserService ~ full_name_split:", full_name_split);
				const hashedPassword = await hashPassword(createUser.Password);
				const createdUser: any = await this.user.create({
					FirstName:
						full_name_split.length > 0 ? full_name_split[0].toLowerCase() : "",
					LastName:
						full_name_split.length > 1 ? full_name_split[1].toLowerCase() : "",
					Email: createUser.Email.toLowerCase(),
					PhoneNumber: createUser.PhoneNumber,
					Password: hashedPassword,
					SignupChannel: createUser?.SignupChannel,
					UserType: createUser?.UserType,
				});
				const token = createToken(createdUser);
				const wallet =
					(await this.wallet.findOne({ user: createdUser._id })) ||
					(await this.wallet.create({
						user: createdUser._id,
					}));
				const cart =
					(await this.Cart.findOne({ user: createdUser._id })) ||
					(await this.Cart.create({
						user: createdUser._id,
						grand_total: 0,
						total_amount: 0,
					}));
				createdUser.Token = token;
				createdUser.wallet = wallet._id;
				createdUser.cart = cart._id;

				await createdUser.save();
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_CREATED,
					message: "User Created Successfully",
					data: createdUser,
				};
			}

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async addShippingAddress(
		addShippingAddress: AddShippingAddressDto,
		user: User
	): Promise<ResponseData> {
		let responseData: ResponseData;
		const full_address =
			addShippingAddress.address +
			", " +
			addShippingAddress.city +
			", " +
			addShippingAddress.state +
			", " +
			addShippingAddress.country;

		try {
			user.ShippingAddress = {
				full_address: full_address,
				address: addShippingAddress.address,
				city: addShippingAddress.city,
				state: addShippingAddress.state,
				...(addShippingAddress?.postal_code && {
					postal_code: addShippingAddress.postal_code,
				}),
				country: addShippingAddress.country,
			};
			await user.save();
			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Shipping Address Added Successfully",
				data: user,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async getProfile(user: User): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Profile Retreived Successfully",
				data: user,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ UserService ~ getProfile ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async getVendorDashboard(
		payload: vendorDashboardDto
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const { user, timeFrame, custom } = payload;
			let start: Date | undefined;
			let end: Date | undefined;
			let backDater: BackDaterResponse;
			let backDaterBackTrack: BackDaterResponse;
			let input = new Date();
			const unremitted_aggregate = await this.OrderDetail.aggregate([
				{
					$match: {
						vendor: user._id,
						status: OrderStatus.DELIVERED,
						is_remitted: false,
					},
				},
				{
					$addFields: {
						total_price: { $multiply: ["$unit_price", "$quantity"] },
					},
				},
				{
					$group: {
						_id: null,
						total_unremitted: { $sum: "$total_price" },
					},
				},
			]);

			const total_unremitted =
				unremitted_aggregate.length > 0
					? unremitted_aggregate[0]?.total_unremitted
					: 0;

			const total_in_stock_aggregate = await this.Product.aggregate([
				{
					$match: {
						vendor: user._id,
						is_verified: true,
						is_deleted: false,
					},
				},
				{
					$addFields: {
						total_price: { $multiply: ["$unit_price", "$product_quantity"] },
					},
				},
				{
					$group: {
						_id: null,
						total_in_stock: { $sum: "$total_price" },
					},
				},
			]);
			const total_in_stock =
				total_in_stock_aggregate.length > 0
					? total_in_stock_aggregate[0]?.total_in_stock
					: 0;
			backDater = await backDaterForChart({ input, format: timeFrame });
			if (timeFrame) {
				switch (timeFrame) {
					case Timeline.YESTERDAY:
						backDater = await backDaterForChart({ input, format: timeFrame });
						break;

					default:
						break;
				}
			}
			const arrayFilter = backDater.array;

			const pipeline: PipelineStage[] = [
				{
					$facet: arrayFilter.reduce((acc, filter) => {
						const { start, end, day, month } = filter;
						const filterStage: Record<string, any> = {
							is_remitted: true,
							createdAt: {
								$gte: start,
								$lte: end,
							},
						};
						acc[`${day || month || "time_frame"}`] = [
							{ $match: filterStage },
							{
								$addFields: {
									total_price: { $multiply: ["$unit_price", "$quantity"] },
								},
							},
							{
								$group: {
									_id: null,
									total_price_value: { $sum: "$total_price" },
								},
							},
							{
								$project: {
									_id: 0,
									start,
									end,
									day: day || null,
									month: month || null,
									total_price_value: "$total_price_value",
								},
							},
						] as PipelineStage[];
						return acc;
					}, {} as any),
				},
			];

			let income_stat_agg: any[] = [];
			await this.OrderDetail.aggregate(pipeline)
				.then((result) => {
					income_stat_agg = result[0];
				})
				.catch((e) => {
					console.log("🚀 ~ UNABLE TO RUN INCOME STAT AGGREGATE:", e);
				});

			const unremitted_aggregate_backtrack = await this.OrderDetail.aggregate([
				{
					$match: {
						vendor: user._id,
						status: OrderStatus.DELIVERED,
						is_remitted: false,
					},
				},
				{
					$addFields: {
						total_price: { $multiply: ["$unit_price", "$quantity"] },
					},
				},
				{
					$group: {
						_id: null,
						total_unremitted: { $sum: "$total_price" },
					},
				},
			]);

			const total_unremitted_backtrack =
				unremitted_aggregate_backtrack.length > 0
					? unremitted_aggregate_backtrack[0]?.total_unremitted
					: 0;

			const total_in_stock_aggregate_backtrack = await this.Product.aggregate([
				{
					$match: {
						vendor: user._id,
						is_verified: true,
						status: ProductMgtOption.APPROVED,
						is_deleted: false,
					},
				},
				{
					$addFields: {
						total_price: { $multiply: ["$unit_price", "$product_quantity"] },
					},
				},
				{
					$group: {
						_id: null,
						total_in_stock: { $sum: "$total_price" },
					},
				},
			]);
			const total_in_stock_backtrack =
				total_in_stock_aggregate_backtrack.length > 0
					? total_in_stock_aggregate_backtrack[0]?.total_in_stock
					: 0;
			backDater = await backDaterForChart({ input, format: timeFrame });
			if (timeFrame) {
				switch (timeFrame) {
					case Timeline.YESTERDAY:
						backDater = await backDaterForChart({ input, format: timeFrame });
						break;

					default:
						break;
				}
			}
			const arrayFilter_backtrack = backDater.array;

			const pipeline_backtrack: PipelineStage[] = [
				{
					$facet: arrayFilter_backtrack.reduce((acc, filter) => {
						const { start, end, day, month } = filter;
						const filterStage: Record<string, any> = {
							is_remitted: true,
							createdAt: {
								$gte: start,
								$lte: end,
							},
						};
						acc[`${day || month || "time_frame"}`] = [
							{ $match: filterStage },
							{
								$addFields: {
									total_price: { $multiply: ["$unit_price", "$quantity"] },
								},
							},
							{
								$group: {
									_id: null,
									total_price_value: { $sum: "$total_price" },
								},
							},
							{
								$project: {
									_id: 0,
									start,
									end,
									day: day || null,
									month: month || null,
									total_price_value: "$total_price_value",
								},
							},
						] as PipelineStage[];
						return acc;
					}, {} as any),
				},
			];

			let income_stat_agg_backtrack: any[] = [];
			await this.OrderDetail.aggregate(pipeline_backtrack)
				.then((result) => {
					income_stat_agg_backtrack = result[0];
				})
				.catch((e) => {
					console.log("🚀 ~ UNABLE TO RUN INCOME STAT AGGREGATE:", e);
				});
			const unremitted = total_unremitted || 0;
			const unremitted_backtrack = total_unremitted_backtrack || 0;
			const total_unremitted_percentage = Math.ceil(
				((unremitted - unremitted_backtrack) / unremitted) * 100
			);
			const in_stock = total_in_stock || 0;
			const in_stock_backtrack = total_in_stock_backtrack || 0;
			const total_in_stock_percentage = Math.ceil(
				((in_stock - in_stock_backtrack) / in_stock) * 100
			);
			const dashboard = {
				user,
				total_unremitted,
				total_unremitted_percentage,
				total_in_stock,
				total_in_stock_percentage,
				income_stat_agg,
			};

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Vendor Overview Retreived Successfully",
				data: dashboard,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ UserService ~ getProfile ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async getVendorInventory(
		payload: vendorInventoryDto
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const { user, limit, page } = payload;
			var records = await getPaginatedRecords(this.OrderDetail, {
				limit,
				page,
				data: {
					vendor: user._id,
					status: OrderStatus.DELIVERED,
				},
				populateObj: {
					path: "buyer",
					select: "FirstName LastName ProfileImage ShippingAddress",
				},
			});

			const total_sold_aggregate = await this.OrderDetail.aggregate([
				{
					$match: {
						vendor: user._id,
						status: OrderStatus.DELIVERED,
					},
				},
				{
					$addFields: {
						total_price: { $multiply: ["$unit_price", "$quantity"] },
					},
				},
				{
					$group: {
						_id: null,
						total_sold: { $sum: "$quantity" },
					},
				},
			]);
			const total_sold =
				total_sold_aggregate.length > 0
					? total_sold_aggregate[0]?.total_sold
					: 0;

			const total_in_stock_aggregate = await this.Product.aggregate([
				{
					$match: {
						vendor: user._id,
						is_verified: true,
						is_deleted: false,
					},
				},
				{
					$group: {
						_id: null,
						total_in_stock: { $sum: "$product_quantity" },
					},
				},
			]);
			const total_in_stock =
				total_in_stock_aggregate.length > 0
					? total_in_stock_aggregate[0]?.total_in_stock
					: 0;

			const inventory = {
				total_products: total_in_stock + total_sold,
				total_sold,
				total_in_stock,
				inventory_records: records,
			};

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Vendor Inventory Retreived Successfully",
				data: inventory,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ UserService ~ getVendorInventory ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async getSalesAnalytics(
		user: InstanceType<typeof this.user>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const today = new Date();
			let last_month = new Date();
			last_month.setMonth(new Date(today).getMonth() - 1);

			const thisMonthFilter = {
				vendor: user?._id,
				createdAt: {
					$gte: startOfMonth(today),
					$lte: endOfMonth(today),
				},
			};

			const lastMonthFilter = {
				vendor: user?._id,
				createdAt: {
					$gte: startOfMonth(last_month),
					$lte: endOfMonth(last_month),
				},
			};

			const total_sold_aggregate_this_month = await this.OrderDetail.aggregate([
				{
					$match: {
						...thisMonthFilter,
						status: OrderStatus.DELIVERED,
					},
				},
				{
					$addFields: {
						total_price: { $multiply: ["$unit_price", "$quantity"] },
					},
				},
				{
					$group: {
						_id: null,
						total_sold: { $sum: "$quantity" },
						total_price: { $sum: "$total_price" },
					},
				},
			]);

			const total_sold_aggregate_last_month = await this.OrderDetail.aggregate([
				{
					$match: {
						...lastMonthFilter,
						status: OrderStatus.DELIVERED,
					},
				},
				{
					$addFields: {
						total_price: { $multiply: ["$unit_price", "$quantity"] },
					},
				},
				{
					$group: {
						_id: null,
						total_sold: { $sum: "$quantity" },
						total_price: { $sum: "$total_price" },
					},
				},
			]);
			const total_sales_this_month =
				total_sold_aggregate_this_month.length > 0
					? total_sold_aggregate_this_month[0]?.total_sold
					: 0;
			const total_revenue_this_month =
				total_sold_aggregate_this_month.length > 0
					? total_sold_aggregate_this_month[0]?.total_price
					: 0;
			const total_sold_last_month =
				total_sold_aggregate_last_month.length > 0
					? total_sold_aggregate_last_month[0]?.total_sold
					: 0;
			const total_revenue_last_month =
				total_sold_aggregate_last_month.length > 0
					? total_sold_aggregate_last_month[0]?.total_price
					: 0;
			const revenue_increase = Math.round(
				((total_revenue_this_month - total_revenue_last_month) /
					total_revenue_last_month) *
					100
			);
			const salses_increase = Math.round(
				((total_sales_this_month - total_sold_last_month) /
					total_sold_last_month) *
					100
			);

			const salesAnalytics = {
				revenue: {
					total: total_revenue_this_month,
					percentage: revenue_increase,
				},
				sales: {
					total: total_sales_this_month,
					percentage: salses_increase,
				},
				best_seller: {
					total: 0,
					percentage: 0,
				},
			};

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Sales Analytics Retreived Successfully",
				data: salesAnalytics,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ UserService ~ getSalesAnalytics ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async userLogin(login: LoginDto): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const user = await this.user
				.findOne({
					$or: [
						{
							Email: login.email_or_phone_number.toLowerCase(),
							UserType: login.userType,
						},
						{
							PhoneNumber: login.email_or_phone_number.toLowerCase(),
							UserType: login.userType,
						},
					],
				})
				.populate("business")
				.populate("wallet")
				.populate("cart");
			if (!user) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Incorrect Username Or Password",
				};
				return responseData;
			}
			const isPasswordCorrect = await comparePassword(
				login.password,
				user?.Password
			);
			if (isPasswordCorrect === false) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Incorrect Username Or Password",
				};
				return responseData;
			}
			const token = createToken(user);
			user.Token = token;
			await user.save();
			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "User Login Successful",
				data: user,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ UserService ~ login ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async changePasswordRequest(
		changePasswordDto: ChangePasswordDto
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const user = await this.user.findOne({
				$or: [
					{
						Email: changePasswordDto.email_or_phone_number.toLowerCase(),
					},
					{
						PhoneNumber: changePasswordDto.email_or_phone_number.toLowerCase(),
					},
				],
			});
			if (!user) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "User Not Found",
				};
				return responseData;
			}
			const oneTimePassword = await generateOtpModel(
				OtpPurposeOptions.CHANGE_PASSWORD,
				user,
				user?.Email
			);
			this.mailService.sendOtpMail({
				email: user.Email,
				otp: oneTimePassword.otp,
				first_name: user.FirstName,
			});

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Otp Generated Successfully",
				data: oneTimePassword,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ UserService ~ login ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async validateOtp(
		otp: string,
		otp_purpose: string
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const otpValiationResponse = await isOtpCorrect(otp, otp_purpose);
			return otpValiationResponse;
		} catch (error: any) {
			console.log("🚀 ~ UserService ~ login ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async newPasswordChange(
		new_password: string,
		user: User
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const hashed_password = await hashPassword(new_password);
			user.Password = hashed_password;
			await user.save();
			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Password Changed Successflly",
				data: user,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ UserService ~ login ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async newPasswordReset(
		new_password: string,
		otp: string
	): Promise<ResponseData> {
		let responseData: ResponseData;
		let user: InstanceType<typeof this.user> | any;
		try {
			const otpModel = await this.Otp.findOne({
				otp,
				purpose: OtpPurposeOptions.CHANGE_PASSWORD,
			});
			if (!otpModel) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Incorrect Otp",
					data: null,
				};
			}
			user = await this.user.findById(otpModel?.user);
			const hashed_password = await hashPassword(new_password);
			user.Password = hashed_password;
			await user.save();
			await this.Otp.deleteOne({
				_id: otpModel?._id,
			});
			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Password Reset Successflly",
				data: null,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ UserService ~ login ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async getUserById(id: number): Promise<User | Error | null> {
		try {
			const user = await this.user.findOne({ userId: id }).select("-passwword");
			if (user) {
				return user!;
			}
			return null;
			// throw new Error("user does not exist");
		} catch (error: any) {
			console.log("notforur", error);
			throw new Error(error.toString());
		}
	}

	public async updateFcmToken(
		userId: number,
		token: string
	): Promise<User | Error> {
		try {
			const data = await this.user.findOneAndUpdate(
				{ userId },
				{
					fcmToken: token,
				},
				{ new: true }
			);
			return data!;
		} catch (error) {
			console.log("dsdsddsad", error);
			//logger.log("error",`cannotcreateusername ${JSON.stringify(error)}`);
			throw new Error("unable to update fcmtoken");
		}
	}
}

export default UserService;
