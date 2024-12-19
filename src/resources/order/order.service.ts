import UserModel from "@/resources/user/user.model";
import {
	calculateDateXDaysAgo,
	generateUnusedOrderId,
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
	AddToCartDto,
	CreateCustomOrderDto,
	CreateOrderDto,
	CustomOrderArrayDto,
	FetchMyOrdersDto,
	MarkAsRemittedDto,
	RemitVendorSalesDto,
	RemoveFromCartDto,
} from "./order.dto";
import { hashPassword } from "@/utils/helpers/token";
import {
	NotificationCategory,
	OrderStatus,
	OtpPurposeOptions,
	StatusMessages,
	UserTypes,
	YesOrNo,
} from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import cloudUploader from "@/utils/config/cloudUploader";
import orderModel from "./order.model";
import productModel from "../product/product.model";
import { ItemInCart, itemsToBeOrdered, orderItems } from "./order.interface";
import orderDetailsModel from "./orderDetails.model";
import { getPaginatedRecords } from "@/utils/helpers/paginate";
import cartModel from "./cart.model";
import MailService from "../mail/mail.service";
import NotificationService from "../notification/notification.service";
import AssignmentService from "../assignment/assignment.service";
import customOrderModel from "./customOrder.model";
import genCouponModel from "../coupon/genCoupon.model";
import CouponService from "../coupon/coupon.service";
import { HttpCodesEnum } from "@/utils/enums/httpCodes.enum";
import DeliveryService from "../delivery/delivery.service";
import envConfig from "@/utils/config/env.config";
import {
	CreateNotificationDto,
	SendSmsNotificationDto,
} from "../notification/notification.dto";
import AdminOverviewService from "../adminOverview/adminOverview.service";
import settingModel from "../adminConfig/setting.model";
import { catchBlockResponseFn } from "@/utils/constants/data";
import BusinessService from "../business/business.service";

class OrderService {
	private Order = orderModel;
	private CustomOrder = customOrderModel;
	private Cart = cartModel;
	private GenCoupon = genCouponModel;
	private OrderDetail = orderDetailsModel;
	private User = UserModel;
	private Product = productModel;
	private businessService = new BusinessService();
	private mailService = new MailService();
	private notificationService = new NotificationService();
	private assignmentService = new AssignmentService();
	private couponService = new CouponService();
	private deliveryService = new DeliveryService();
	private Setting = settingModel;

	public async addToCart(
		payload: AddToCartDto,
		user: InstanceType<typeof UserModel>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		let product_ids: string[] = [];
		try {
			const openCart = await this.Cart.findOne({
				user: user?._id,
			});
			const currentItemsInCart: any[] = openCart
				? [...openCart.toObject().items]
				: [];
			const itemsToEnterCart = payload.items;
			// currentItemsInCart.push(...payload.items)
			for (const item of itemsToEnterCart) {
				product_ids.push(item.product_id);
			}
			const products = await this.Product.find({
				_id: { $in: product_ids },
				// is_verified: true
			});

			const purpose = "cart";
			const processedItems = await this.processMathcingItems(
				itemsToEnterCart,
				currentItemsInCart,
				products,
				user,
				purpose
			);
			if (processedItems.status === StatusMessages.error) {
				return processedItems;
			}

			if (openCart) {
				const current_items_in_cart = openCart.items;
				current_items_in_cart.push(...processedItems?.data?.itemsInOrder);
				openCart.items = processedItems?.data?.itemsInOrder;
				openCart.total_amount = processedItems?.data?.total_amount;
				openCart.grand_total = processedItems?.data?.total_amount;
				openCart.save();
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: "Product Added To Cart Successfully",
					data: openCart,
				};
			} else {
				const newCart = await this.Cart.create({
					items: processedItems?.data?.itemsInOrder,
					total_amount: processedItems?.data?.total_amount,
					user: user._id,
					status: OrderStatus.PENDING,
					grand_total: processedItems?.data?.total_amount,
				});

				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: "Product Added To Cart Successfully",
					data: newCart,
				};
			}

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async removeFromCart(
		payload: RemoveFromCartDto,
		user: InstanceType<typeof UserModel>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const openCart = await this.Cart.findOne({
				user: user?._id,
			});
			if (openCart) {
				const current_items_in_cart = openCart.items;
				const current_total = openCart.total_amount;
				const product = current_items_in_cart.find(
					(item) => String(item.product_id) === String(payload.product_id)
				);
				const newItemsCart = current_items_in_cart.filter(
					(item) => String(item.product_id) !== String(payload.product_id)
				);
				const product_quantity = product?.quantity || 0;
				const product_unit_price = product?.unit_price || 0;
				const new_total = current_total - product_quantity * product_unit_price;
				const updatedCart = await this.Cart.findByIdAndUpdate(
					openCart._id,
					{
						items: newItemsCart,
						total_amount: new_total,
						grand_total: new_total,
					},
					{ new: true }
				);

				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: "Product Removed To Cart Successfully",
					data: updatedCart,
				};
			} else {
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: "Product Removed To Cart Successfully",
					data: null,
				};
			}

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async createOrder(
		payload: CreateOrderDto,
		user: InstanceType<typeof UserModel>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		let product_ids: string[] = [];
		try {
			for (const item of payload.items) {
				product_ids.push(item.product_id);
			}
			const products = await this.Product.find({
				_id: { $in: product_ids },
				// is_verified: true
			});
			const cartItems =
				payload.checkout_with_cart === YesOrNo.YES
					? (await this.Cart.findOne({ user: user._id }))?.items || []
					: [];
			const purpose = "cart";
			const processedItems = await this.processMathcingItems(
				payload.items,
				cartItems,
				products,
				user,
				purpose
			);
			if (processedItems.status === StatusMessages.error) {
				return processedItems;
			}
			const openCart = await this.Order.findOne({
				user: user._id,
				status: OrderStatus.PENDING,
			});

			if (payload.checkout_with_cart === YesOrNo.YES) {
				await this.Cart.findOneAndUpdate(
					{ user: user._id },
					{
						items: null,
						total_amount: 0,
						grand_total: 0,
						price_before_discount: 0,
					},
					{ new: true }
				);
			}
			const getShippingCost =
				await this.deliveryService.getShippingPriceAgility(
					processedItems?.data?.itemsInOrder
				);
			if (getShippingCost.status === StatusMessages.error) {
				return getShippingCost;
			}
			const shippingCost = getShippingCost?.data?.shipping_cost || 0;
			const agilityPayload = getShippingCost?.data?.agility_payload || 0;
			if (openCart) {
				openCart.items = processedItems?.data?.itemsInOrder;
				openCart.delivery_amount = shippingCost;
				openCart.agility_price_payload = agilityPayload;
				openCart.total_amount = processedItems?.data?.total_amount;
				openCart.shipping_address =
					payload.shipping_address || user.ShippingAddress?.full_address || "";
				openCart.grand_total =
					processedItems?.data?.total_amount + shippingCost;
				openCart.price_before_discount = processedItems?.data?.total_amount;
				openCart.payment_type = payload?.payment_type || openCart?.payment_type;
				openCart.save();
				let closedOrder = openCart;
				if (openCart.general_coupon) {
					const generalCoupon = await this.GenCoupon.findById(
						openCart.general_coupon
					);
					if (generalCoupon) {
						closedOrder = (
							await this.couponService.useCoupon(openCart, generalCoupon)
						).data;
					}
				}
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: "Order Created Successfully",
					data: closedOrder,
				};
			} else {
				const tracking_id = await generateUnusedOrderId();
				const genCoupon = payload?.coupon_code
					? await this.GenCoupon.findOne({
							code: String(payload.coupon_code).toUpperCase(),
						})
					: undefined;
				const newOrder = await this.Order.create({
					items: processedItems?.data?.itemsInOrder,
					total_amount: processedItems?.data?.total_amount,
					user: user._id,
					status: OrderStatus.PENDING,
					shipping_address:
						payload.shipping_address ||
						user.ShippingAddress?.full_address ||
						"",
					grand_total: processedItems?.data?.total_amount + shippingCost,
					delivery_amount: shippingCost,
					agility_price_payload: agilityPayload,
					price_before_discount: processedItems?.data?.total_amount,
					tracking_id,
					...(payload?.payment_type && { payment_type: payload?.payment_type }),
				});
				let finalOrder: InstanceType<typeof this.Order> = newOrder;
				if (genCoupon) {
					finalOrder = (await this.couponService.useCoupon(newOrder, genCoupon))
						.data;
				}
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_CREATED,
					message: "Order Created Successfully",
					data: finalOrder,
				};
				this.notificationService.createNotification({
					receiver: String(finalOrder.user),
					title: "Create Order",
					content: `You just created an order with tracking id : ${newOrder.tracking_id}`,
				});
			}

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async processMathcingItems(
		items: orderItems[],
		currentCartItems: any[],
		products: InstanceType<typeof this.Product>[],
		user: InstanceType<typeof this.User>,
		purpose: string
	): Promise<ResponseData> {
		let total_amount = 0;
		let responseData: ResponseData;
		const messages: string[] = [];
		let itemsInOrder: itemsToBeOrdered[] = [];
		try {
			const productMap: Map<
				string,
				{
					_id: string;
					product_name: string;
					product_code: string;
					product_quantity: number;
					description: string;
					vendor?: string;
					images: string[];
					height: number;
					width: number;
					weight: number;
					unit_price: number;
					is_discounted: boolean;
				}
			> = new Map();

			products.forEach((product) => {
				productMap.set(product._id.toString(), {
					_id: String(product._id),
					product_quantity: product.product_quantity,
					unit_price: product.unit_price,
					product_name: product.product_name,
					product_code: product.product_code,
					description: product.description,
					vendor: String(product.vendor),
					images: product.images,
					height: product.height,
					width: product.width,
					weight: product.weight,
					is_discounted: product.is_discounted,
				});
			});

			items.forEach((item) => {
				const product = productMap.get(item.product_id.toString());
				if (!product) {
					console.warn(`Product with ID ${item.product_id} not found.`);
					return;
				}
				if (item.quantity > product.product_quantity) {
					console.warn(
						`Quantity of product ${item.product_id} exceeds available stock.`
					);
					messages.push(
						`Available Quantities For ${product.product_name} is ${product.product_quantity}`
					);
					return;
				}
				const cartItem = currentCartItems.find(
					(cartItem) => cartItem.product_id.toString() === item.product_id
				);
				if (cartItem) {
					console.log("🚀 ~ OrderService ~ cartItem:", cartItem);
					cartItem.quantity += item.quantity;
				} else {
					const newItemToCart = {
						product_id: String(item.product_id),
						quantity: item.quantity,
						unit_price: product.unit_price,
						product_name: product.product_name,
						product_code: product.product_code,
						description: product.description,
						vendor: product.vendor,
						images: product.images,
						height: product.height,
						width: product.width,
						weight: product.weight,
						is_discounted: product.is_discounted,
					};
					currentCartItems.push(newItemToCart);
				}
			});
			total_amount = currentCartItems.reduce((total, cartItem) => {
				return total + cartItem.quantity * cartItem.unit_price;
			}, 0);
			const response = {
				itemsInOrder: currentCartItems,
				total_amount: total_amount,
			};
			if (messages.length > 0) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: messages.toString(),
				};
			} else {
				switch (purpose) {
					case "order":
						// this.createOrderDetails(itemsInOrder, user)
						break;
					default:
						break;
				}
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: "",
					data: response,
				};
			}
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ processMathcingItems ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async getMyOrders(
		myOrdersDto: FetchMyOrdersDto,
		user: InstanceType<typeof this.User>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const search = {
				...(myOrdersDto?.filter?.start_date &&
					myOrdersDto?.filter?.end_date && {
						createdAt: {
							$gte: new Date(myOrdersDto?.filter?.start_date),
							$lte: new Date(myOrdersDto?.filter?.end_date),
						},
					}),
				...(myOrdersDto?.filter?.status && {
					status: myOrdersDto?.filter?.status,
				}),
				vendor: user?._id,
			};

			var paginatedRecords = await getPaginatedRecords(this.OrderDetail, {
				limit: myOrdersDto?.limit,
				page: myOrdersDto?.page,
				data: search,
				populateObj: {
					path: "buyer",
					select: "FirstName LastName",
				},
				populateObj1: {
					path: "product_id",
					select: "product_name images product_quantity",
				},
				populateObj2: {
					path: "order",
					select: "tracking_id",
				},
			});

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "success",
				data: paginatedRecords,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async getMyOrdersVendorsNew(
		myOrdersDto: FetchMyOrdersDto,
		user: InstanceType<typeof this.User>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const search = {
				...(myOrdersDto?.filter?.start_date &&
					myOrdersDto?.filter?.end_date && {
						createdAt: {
							$gte: new Date(myOrdersDto?.filter?.start_date),
							$lte: new Date(myOrdersDto?.filter?.end_date),
						},
					}),
				...(myOrdersDto?.filter?.status && {
					status: myOrdersDto?.filter?.status,
				}),
				vendor: user._id,
			};
			const page = myOrdersDto?.page || 1;
			const limit = myOrdersDto?.limit || 10;
			const skip = (page - 1) * limit;

			const pipeline: any[] = [
				{
					$match: search,
				},

				{
					$lookup: {
						from: "Orders",
						localField: "order",
						foreignField: "_id",
						as: "order_info",
					},
				},
				{
					$unwind: {
						path: "$order_info",
						preserveNullAndEmptyArrays: true,
					},
				},
				{
					$sort: {
						"order_info.createdAt": -1,
					},
				},
				{
					$group: {
						_id: "$order",
						count: { $sum: 1 },
						order_info: { $first: "$order_info" },
					},
				},

				{
					$project: {
						_id: 0,
						order: "$_id",
						count: 1,
						order_info: {
							_id: 1,
							user: 1,
							items: 1,
							status: 1,
							total_amount: 1,
							delivery_amount: 1,
							grand_total: 1,
							createdAt: 1,
							updatedAt: 1,
						},
					},
				},

				{
					$facet: {
						orders: [{ $skip: skip }, { $limit: limit }],
						totalCount: [{ $count: "totalOrders" }],
					},
				},
				{
					$project: {
						orders: 1,
						totalCount: { $arrayElemAt: ["$totalCount.totalOrders", 0] },
					},
				},
			];
			const orders = await this.OrderDetail.aggregate(pipeline);
			const orderarray =
				orders.length > 0
					? orders[0].orders.map((item: any) => {
							return {
								_id: item.order_info._id,
								items: item.order_info.items,
								user: item.order_info.user,
								status: item.order_info.status,
								total_amount: item.order_info.total_amount,
								delivery_amount: item.order_info.delivery_amount,
								grand_total: item.order_info.grand_total,
								createdAt: item.order_info.createdAt,
								updatedAt: item.order_info.updatedAt,
								order: item.order,
							};
						})
					: [];
			const totalCount = orders.length > 0 ? orders[0].totalCount : 0;
			const records = {
				data: orderarray,
				pagination: {
					pageSize: limit,
					totalCount,
					pageCount: Math.ceil(totalCount / limit),
					currentPage: +page,
					hasNext: page * limit < totalCount,
				},
			};

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "success",
				data: records,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async getMyOrdersBuyer(
		myOrdersDto: FetchMyOrdersDto,
		user: InstanceType<typeof this.User>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const search = {
				...(myOrdersDto?.filter?.start_date &&
					myOrdersDto?.filter?.end_date && {
						createdAt: {
							$gte: new Date(myOrdersDto?.filter?.start_date),
							$lte: new Date(myOrdersDto?.filter?.end_date),
						},
					}),
				...(myOrdersDto?.filter?.status &&
					myOrdersDto?.filter?.status !== OrderStatus.CUSTOM && {
						status: myOrdersDto?.filter?.status,
					}),
				user: user?._id,
			};

			const model =
				myOrdersDto?.filter?.status !== OrderStatus.CUSTOM
					? this.Order
					: this.CustomOrder;

			var paginatedRecords = await getPaginatedRecords(model, {
				limit: myOrdersDto?.limit,
				page: myOrdersDto?.page,
				data: search,
			});

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "success",
				data: paginatedRecords,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	private async createOrderDetails(
		itemsInOrder: itemsToBeOrdered[] | ItemInCart[],
		user: any,
		Order: any
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			console.log("TIME TO CREATE ORDER DETAILS>>>>>>");

			const order_details: any[] = [];
			for (const item of itemsInOrder) {
				order_details.push({
					...item,
					buyer: user?._id,
					order: Order?._id,
				});
			}
			let inserted: InstanceType<typeof this.OrderDetail>[] = [];
			await this.OrderDetail.deleteMany({
				order: Order?._id,
				buyer: user._id,
			}).then(async () => {
				inserted = (await this.OrderDetail.insertMany(
					order_details
				)) as InstanceType<typeof this.OrderDetail>[];
			});

			const details_ids = [];
			for (const item of inserted) {
				details_ids.push(item?._id);
			}
			if (details_ids.length > 0) {
				const details_to_vendors = await this.OrderDetail.find({
					_id: { $in: details_ids },
				});
				this.sendOrderToVendors(details_to_vendors);
				this.assignmentService.createAssignments({
					buyer: user,
					order_details: inserted as InstanceType<typeof this.OrderDetail>[],
				});
			}

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "success",
				data: inserted,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async confirmOrderPayment(
		narration_id: string
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const order = await this.Order.findById(narration_id);

			if (!order) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Order Not Found",
				};
				return responseData;
			}
			const user = await this.User.findById(order.user);

			const completedOrder = await this.Order.findByIdAndUpdate(
				order._id,
				{
					status: OrderStatus.BOOKED,
				},
				{ new: true }
			);

			const updateData = order.toObject().items.map((item) => {
				return {
					updateOne: {
						filter: { _id: item.product_id },
						update: {
							$inc: {
								product_quantity: -item.quantity,
								total_quantity_sold: item.quantity,
							},
						},
					},
				};
			});
			const updateProduct = await this.Product.bulkWrite(updateData);
			const fineTuneItems = order.toObject().items.map((item) => {
				return {
					product_id: String(item.product_id),
					product_name: item.product_name,
					product_code: item.product_code,
					description: item.description,
					vendor: String(item.vendor),
					images: item.images,
					quantity: item.quantity,
					unit_price: item.unit_price,
					height: item.height,
					width: item.width,
					weight: item.weight,
					is_discounted: item.is_discounted,
					status: OrderStatus.BOOKED,
				};
			});
			this.createOrderDetails(fineTuneItems, user, order);
			const notificationPayload: CreateNotificationDto = {
				sender: envConfig.SOTO_USER_ID,
				receiver: envConfig.SOTO_USER_ID,
				category: NotificationCategory.VENDOR,
				category_id: String(order?._id),
				title: "NEW ORDER PAYMENT",
				content: "A client just completed an order payment",
			};
			this.notificationService.createNotification(notificationPayload);

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "success",
				data: {
					completedOrder,
					updateProduct,
				},
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async sendOrderToVendors(order_details: any[]): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "success",
			data: null,
		};
		try {
			console.log("TIME TO SEND EMAILS OF ORDERS TO VENDORS");
			console.log(
				"🚀 ~ OrderService ~ sendOrderToVendors ~ order_details:",
				order_details.length
			);

			const groupedItems = order_details.reduce(
				(acc, item) => {
					const vendorId = String(item?.vendor);
					if (vendorId) {
						if (!acc[vendorId]) {
							acc[vendorId] = [];
						}
						acc[vendorId].push(item);
					}
					return acc;
				},
				{} as { [vendor: string]: any[] }
			);
			let smsPayloads: SendSmsNotificationDto[] = [];

			for (const vendor of Object.keys(groupedItems)) {
				const vendorItems = groupedItems[vendor];
				if (vendorItems.length > 0) {
					const user = await this.User.findById(vendor);

					if (user?.PhoneNumber) {
						smsPayloads.push({
							from: "soto",
							to: user.PhoneNumber,
							body: "You have an order for your product on soto, login to see full details",
						});
					}

					const emailPayload = {
						business_name: user?.FirstName,
						email: user?.Email,
						items: vendorItems,
					};

					await this.mailService.sendOrdersToVendor(emailPayload);
				}
			}
			this.notificationService.sendSMsToMany(smsPayloads);
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async viewAnOrder(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Order Retrieved Successfully",
		};
		try {
			const { order_id, user } = payload;
			const order = await this.Order.findOne({ _id: order_id, user: user._id })
				.populate({
					path: "items.vendor",
					select: "firstName lastName Email ProfileImage PhoneNumber",
				})
				.populate({
					path: "user",
					select: "FirstName LastName ProfileImage Email PhoneNumber",
				})
				.populate("shipment");

			if (!order) {
				return {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Order Not Found",
				};
			}

			const order_itinerary = await this.fetchOrderItineraryInOrderService(
				order.order_itinerary
			);

			responseData.data = {
				...order.toObject(),
				order_itinerary,
			};
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

	public async viewAnOrderByVendor(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Order Retrieved Successfully",
		};
		try {
			const { order_id, user } = payload;
			const order = await this.Order.findById(order_id);

			if (!order) {
				return {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Order Not Found",
				};
			}

			const details = await this.OrderDetail.find({
				order: order_id,
				vendor: user._id,
			});

			responseData.data = details;
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ viewAnOrderByVendor ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async fetchOrderItineraryInOrderService(step: number) {
		const settingModel = await this.Setting.findOne({});

		let order_itinerary: object = {
			step_1: settingModel?.order_itinerary?.step_1?.description,
		};
		if (settingModel) {
			switch (step) {
				case 1:
					order_itinerary = {
						step_1: settingModel.order_itinerary?.step_1?.description,
					};
					break;
				case 2:
					order_itinerary = {
						step_1: settingModel.order_itinerary?.step_1?.description,
						step_2: settingModel.order_itinerary?.step_2?.description,
					};
					break;
				case 3:
					order_itinerary = {
						step_1: settingModel.order_itinerary?.step_1?.description,
						step_2: settingModel.order_itinerary?.step_2?.description,
						step_3: settingModel.order_itinerary?.step_3?.description,
					};
					break;
				case 4:
					order_itinerary = {
						step_1: settingModel.order_itinerary?.step_1?.description,
						step_2: settingModel.order_itinerary?.step_2?.description,
						step_3: settingModel.order_itinerary?.step_3?.description,
						step_4: settingModel.order_itinerary?.step_4?.description,
					};
					break;
				default:
					order_itinerary = {
						step_1: settingModel.order_itinerary?.step_1?.description,
					};
					break;
			}
		}
		return order_itinerary;
	}

	public async createCustomOrder(
		payload: CustomOrderArrayDto,
		user: InstanceType<typeof this.User>
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Custom Order Created Successfully",
		};
		try {
			var orders: CreateCustomOrderDto[] = payload.orders;
			const fineTuned: any[] = [];
			for (const order of orders) {
				const updated = {
					...(order?.product_name &&
						order.product_name !== "" && { product_name: order.product_name }),
					...(order?.product_brand &&
						order.product_brand !== "" && {
							product_brand: order.product_brand,
						}),
					...(order?.size && order.size !== "" && { size: order.size }),
					...(order?.color && order.color !== "" && { color: order.color }),
					...(order?.type && order.type !== "" && { type: order.type }),
					...(order?.quantity &&
						order.quantity.toLocaleString() !== "" && {
							quantity: order.quantity,
						}),
					...(order?.max_price &&
						order.max_price.toLocaleString() !== "" && {
							max_price: order.max_price,
						}),
					...(order?.min_price &&
						order.min_price.toLocaleString() !== "" && {
							min_price: order.min_price,
						}),
					...(order?.phone_number &&
						order.phone_number !== "" && { phone_number: order.phone_number }),
					...(order?.email && order.email !== "" && { email: order.email }),
					...(order?.note && order.note !== "" && { note: order.note }),
					...(user && { user: user._id }),
					tracking_id: await generateUnusedOrderId(),
				};
				fineTuned.push(updated);
			}

			const custom_order = await this.CustomOrder.insertMany(fineTuned);
			responseData.data = custom_order;
			return responseData;
		} catch (error: any) {
			console.log(
				"🚀 ~ AdminOverviewService ~ createCustomOrder ~ error:",
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

	public async cancelAnOrder(
		order_id: string,
		user?: InstanceType<typeof this.User>
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Order canceled Successfully",
		};
		try {
			const order = user
				? await this.Order.findOne({ _id: order_id, user: user._id })
				: await this.Order.findById(order_id);
			if (!order) {
				return {
					status: StatusMessages.error,
					code: HttpCodesEnum.HTTP_BAD_REQUEST,
					message: "Order Not Found",
				};
			}
			const orderStatus = order.status;
			switch (orderStatus) {
				case OrderStatus.CANCELLED:
					responseData = {
						status: StatusMessages.success,
						code: HttpCodes.HTTP_OK,
						message: "Order already cancelled",
						data: order,
					};
					break;
				case OrderStatus.PENDING:
					order.status = OrderStatus.CANCELLED;
					await order.save();
					responseData = {
						status: StatusMessages.success,
						code: HttpCodes.HTTP_OK,
						message: "Order canceled Successfully",
						data: order,
					};
					break;
				case OrderStatus.BOOKED:
					order.status = OrderStatus.CANCELLED;
					await order.save();
					this.sendCancelledOrderToVendors(order);
					responseData = {
						status: StatusMessages.success,
						code: HttpCodes.HTTP_OK,
						message: "Order canceled Successfully",
						data: order,
					};
					break;
				case OrderStatus.RETURNED:
					responseData = {
						status: StatusMessages.error,
						code: HttpCodes.HTTP_BAD_REQUEST,
						message: "Order already returned",
						data: order,
					};
					break;
				case OrderStatus.DELIVERED:
					responseData = {
						status: StatusMessages.error,
						code: HttpCodes.HTTP_BAD_REQUEST,
						message:
							"Order already delivered, initiate a return process instead",
						data: order,
					};
					break;
				case OrderStatus.PICKED_UP:
					order.status = OrderStatus.CANCELLED;
					await order.save();
					this.sendCancelledOrderToVendors(order);
					responseData = {
						status: StatusMessages.success,
						code: HttpCodes.HTTP_OK,
						message: "Order canceled Successfully",
						data: order,
					};
					break;
				default:
					order.status = OrderStatus.CANCELLED;
					await order.save();
					this.sendCancelledOrderToVendors(order);
					responseData = {
						status: StatusMessages.success,
						code: HttpCodes.HTTP_OK,
						message: "Order canceled Successfully",
						data: order,
					};
					break;
			}
			return responseData;
		} catch (error: any) {
			console.log(
				"🚀 ~ AdminOverviewService ~ createCustomOrder ~ error:",
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

	public async sendCancelledOrderToVendors(
		order: InstanceType<typeof this.Order>
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "success",
			data: null,
		};
		try {
			console.log("TIME TO SEND EMAILS OF CANCELED ORDERS TO VENDORS");
			const order_details = await this.OrderDetail.find({ order: order._id });
			this.assignmentService.cancelAssignments(order_details);

			const groupedItems = order_details.reduce(
				(acc, item) => {
					const vendorId = String(item?.vendor);
					if (vendorId) {
						if (!acc[vendorId]) {
							acc[vendorId] = [];
						}
						acc[vendorId].push(item);
					}
					return acc;
				},
				{} as { [vendor: string]: any[] }
			);

			Object.keys(groupedItems).forEach(async (vendor) => {
				const vendorItems = groupedItems[vendor];
				if (vendorItems.length > 0) {
					const user = await this.User.findById(vendor);
					const emailPayload = {
						business_name: user?.FirstName,
						email: user?.Email,
						items: vendorItems,
					};
					this.mailService.sendCancelledOrdersToVendor(emailPayload);
				}
			});
			await this.OrderDetail.updateMany(
				{
					order: order._id,
				},
				{ $set: { status: OrderStatus.CANCELLED } }
			);
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async remitVendorSales(): Promise<ResponseData | any> {
		try {
			const setting = await this.Setting.findOne({});
			const days = 1 || setting?.remittance_day;
			const backDate = calculateDateXDaysAgo(days);

			const pipeline = [
				{
					$match: {
						status: OrderStatus.DELIVERED,
						is_remitted: false,
						delivery_date: { $lte: backDate },
					},
				},
				{
					$addFields: {
						total: { $multiply: ["$unit_price", "$quantity"] },
					},
				},
				{
					$group: {
						_id: "$vendor",
						orders: { $push: "$$ROOT" },
						grand_total: { $sum: "$total" },
						order_ids: { $push: "$_id" },
					},
				},
				{
					$project: {
						vendor: "$_id",
						orders: 1,
						grand_total: 1,
						order_ids: 1,
						_id: 0,
					},
				},
			];
			const aggregate = (await this.OrderDetail.aggregate(pipeline)) || [];
			const order_ids: string[] = [];
			const vendor_details: RemitVendorSalesDto[] = [];
			let is_remitted: any = {};
			if (aggregate.length > 0) {
				for (const agg of aggregate) {
					order_ids.push(...agg.order_ids);
					vendor_details.push({
						grand_total: agg.grand_total,
						vendor: agg.vendor,
					});
				}
				is_remitted = await this.markAsRemitted({
					order_details_ids: order_ids,
					vendor_details,
				});
			}

			return {
				status: StatusMessages.success,
				code: HttpCodesEnum.HTTP_OK,
				message: "Success",
				data: {
					all_ids: order_ids,
					vendor_details,
					is_remitted,
				},
			};
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ remitVendorSales ~ error:", error);
			return catchBlockResponseFn(error);
		}
	}

	public async markAsRemitted(payload: MarkAsRemittedDto) {
		try {
			console.log("🚀 ~ TIME TO MARK ORDER DETAILS AS REMITTED ");
			const { order_details_ids, vendor_details } = payload;
			let is_remitted: any;
			await this.OrderDetail.updateMany(
				{
					_id: { $in: order_details_ids },
				},
				{
					is_remitted: true,
				}
			).then((remitted) => {
				is_remitted = remitted;
				this.CreditVendors(vendor_details);
			});
			return is_remitted;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ markAsRemitted ~ error:", error);
			return catchBlockResponseFn(error);
		}
	}

	public async CreditVendors(payload: RemitVendorSalesDto[]) {
		console.log("🚀 ~ TIME TO CREDIT VENDORS");
		try {
			for (const vendor_detail of payload) {
				await this.businessService.walletCredit(
					vendor_detail.vendor,
					vendor_detail.grand_total
				);
			}
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ CreditVendors ~ error:", error);
			return catchBlockResponseFn(error);
		}
	}
}

export default OrderService;
